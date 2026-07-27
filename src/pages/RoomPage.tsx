import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { NotesSheet } from '../components/NotesSheet'
import { ReadingSettingsButton } from '../components/ReadingSettingsButton'
import { TopBar } from '../components/TopBar'
import { Trail } from '../components/Trail'
import type { Source, SourcePassage, Room, Path } from '../content/editorial/schema'
import { roomsForPath } from '../lib/library'
import {
  allRooms,
  useLabel,
  findSource,
  findPassage,
  findRoom,
  findTheme,
  findPathBySlug,
  sourceName,
  uncertainties,
  paragraphs,
} from '../lib/content'
import { useAtlas } from '../lib/store'
import { report } from '../lib/telemetry'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { NotFoundNote } from './NotFoundNote'
import styles from './RoomPage.module.css'

/** A row in the room's colophon: letter-spaced caps with a downward arrow. Opens in place
 * and never leads away — the arrow promises depth here, not navigation. */
const ColophonRow = ({
  label,
  open,
  onToggle,
  detailId,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  detailId: string
  children: React.ReactNode
}) => (
  <div>
    <button
      type="button"
      className={styles.colophonRow}
      aria-expanded={open}
      aria-controls={detailId}
      onClick={onToggle}
    >
      {label} <span aria-hidden>{open ? '▴' : '▾'}</span>
    </button>
    <div id={detailId} hidden={!open} className={styles.detail}>
      {children}
    </div>
  </div>
)

// The bibliography row: work, reference and provenance (language · dating) in sequence.
const sourceRow = (source: Source, reference: string | undefined): string => {
  const title = [source.title, reference].filter(Boolean).join(', ')
  const origin = [source.originalLanguage, source.approximateDating].filter(Boolean).join(' · ')
  return [title, origin].filter(Boolean).join(' · ')
}

// The edition row shows only when a passage specifies an edition (source-and-context.md,
// Translation Policy): edition and, for an in-house translation, the responsible hand.
const editionRow = (passage: SourcePassage | undefined): string | undefined => {
  if (!passage?.edition) return undefined
  const translation = passage.translator ? ` · översättning ${passage.translator}` : ''
  return `Utgåva: ${passage.edition}${translation}`
}

type SourceRelation = Room['sources'][number]

// The relations grouped per source entry in frontmatter order, so that a room
// with several references into the same work (e.g. two Bible passages) gets one block with
// a single uncertainty declaration and one »Om texten« link — not repeated.
const groupBySource = (relations: SourceRelation[]): [Source, SourceRelation[]][] => {
  const groups: [Source, SourceRelation[]][] = []
  for (const relation of relations) {
    const existing = groups.find(([source]) => source.id === relation.source)
    if (existing) {
      existing[1].push(relation)
      continue
    }
    const source = findSource(relation.source)
    if (source) groups.push([source, [relation]])
  }
  return groups
}

// A source's rows in the detail: bibliography + use + edition per relation,
// then the source's uncertainty once and the link to the source page.
const SourceBlock = ({ source, relations }: { source: Source; relations: SourceRelation[] }) => {
  const rows = [
    ...relations.flatMap((relation) => {
      const passage = relation.passage ? findPassage(relation.passage) : undefined
      return [
        sourceRow(source, passage?.reference ?? relation.reference),
        useLabel[relation.use],
        editionRow(passage),
      ]
    }),
    ...uncertainties(source),
  ].filter((row): row is string => Boolean(row))
  return (
    <div className={styles.sourceBlock}>
      {rows.map((row, i) => (
        <p key={`${row}-${i}`} className={styles.detailRow}>
          {row}
        </p>
      ))}
      <Link to="/bibliotek/kalla/$slug" params={{ slug: source.slug }} className={styles.detailLink}>
        Om texten
      </Link>
    </div>
  )
}

/** The source detail behind the name: work, reference, use declaration and honest
 * uncertainty — visible only on request (source-and-context.md, Source
 * Visibility). Stays bibliographic; the source's words and full passage text
 * live on the source page, where »Om texten« leads after a deliberate choice. Rooms with
 * several sources show all relations, grouped per source entry. */
const SourceDetail = ({ room }: { room: Room }) => (
  <>
    {groupBySource(room.sources).map(([source, relations]) => (
      <SourceBlock key={source.id} source={source} relations={relations} />
    ))}
  </>
)

// The colophon's label: the source's voice when the room builds on one work,
// »Källor« when it builds on several (the first multi-source room: phase 12).
const colophonLabel = (room: Room, source: Source): string =>
  new Set(room.sources.map((relation) => relation.source)).size > 1 ? 'Källor' : sourceName(source)

const RoomEnding = ({ room }: { room: Room }) => {
  const { savedRooms, toggleSavedRoom, notes, setNote, removeNote } = useAtlas()
  const [openRow, setOpenRow] = useState<'source' | 'background' | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const primarySource = room.sources.find((k) => k.primary) ?? room.sources[0]
  const source = primarySource ? findSource(primarySource.source) : undefined
  const saved = !!savedRooms[room.id]
  const toggle = (row: 'source' | 'background') =>
    setOpenRow((current) => (current === row ? null : row))
  return (
    <>
      <div className={styles.rule} />
      <div className={styles.colophon}>
        {source && (
          <ColophonRow
            label={colophonLabel(room, source)}
            open={openRow === 'source'}
            onToggle={() => toggle('source')}
            detailId="kalldetalj"
          >
            <SourceDetail room={room} />
          </ColophonRow>
        )}
        {room.historicalContext && (
          <ColophonRow
            label="Historisk bakgrund"
            open={openRow === 'background'}
            onToggle={() => toggle('background')}
            detailId="bakgrundsdetalj"
          >
            {paragraphs(room.historicalContext).map((paragraph, i) => (
              <p key={i} className={styles.detailRow}>
                {paragraph}
              </p>
            ))}
          </ColophonRow>
        )}
      </div>
      <div className={styles.ending}>
        <button
          type="button"
          className={styles.endingAction}
          aria-pressed={saved}
          onClick={() => toggleSavedRoom(room.id)}
        >
          {saved ? 'Sparad' : 'Spara'}
        </button>
        <button
          type="button"
          className={styles.endingAction}
          onClick={() => setNoteOpen(true)}
        >
          Skriv ner en tanke
        </button>
      </div>
      {noteOpen && (
        <NotesSheet
          title={room.title}
          value={notes[room.id]?.text ?? ''}
          onChange={(text) => setNote('room', room.id, text)}
          onDelete={() => removeNote(room.id)}
          onClose={() => setNoteOpen(false)}
        />
      )}
    </>
  )
}

/** A neighbouring stop on the reader's stretch of the trail: the same marker and
 * title as the path overview, so the line reads as one trail continued rather
 * than a next/previous control. Only the title — the stop's own thought belongs
 * on the overview, where one is choosing where to step in; inside the reading
 * room navigation recedes and must not put the next room's prose in front of
 * the eye (paths.md, One Stop at a Time). Opens with the path kept as context. */
const PathStop = ({ path, room }: { path: Path; room: Room }) => (
  <li className={styles.pathStop}>
    <Link
      to="/rum/$slug"
      params={{ slug: room.slug }}
      search={{ vandring: path.slug }}
      className={styles.pathStopLink}
    >
      <span className={styles.pathStopTitle}>{room.title}</span>
    </Link>
  </li>
)

/** The nearest stretch of the trail: the previous stop, where the reader is
 * standing (filled marker, no link) and the next stop. In the first room there
 * is no previous one; in the last, no next. Never autoplay, and no »rätt«
 * choice: going back is offered exactly as plainly as going on (paths.md, Moving
 * Between Stops). The filled marker is orientation — »var är jag på leden« —
 * never a step counter: nothing fills from having been somewhere, only from
 * being there, and no room is ever ticked off (Completion). */
const PathTrail = ({
  path,
  room,
  previous,
  next,
}: {
  path: Path
  room: Room
  previous: Room | undefined
  next: Room | undefined
}) => (
  <div className={styles.path}>
    <div className={`dots ${styles.pathPause}`}>···</div>
    <Trail className={styles.pathTrail}>
      {previous && <PathStop path={path} room={previous} />}
      <li className={`${styles.pathStop} ${styles.pathHere}`} aria-current="page">
        <span className={styles.pathHereTitle}>{room.title}</span>
        <span className="srOnly">Här är du på vandringen</span>
      </li>
      {next && <PathStop path={path} room={next} />}
    </Trail>
  </div>
)

/** The path's footer: shown only when the room is read within a path (the search
 * parameter `vandring`). After the room's text comes the fold and then the trail.
 * The last room carries the optional closing reflection first — it belongs to the
 * text — without congratulation or progress metric.
 *
 * A path with a single stop gets no trail: a lone marker with nowhere to go is
 * decoration, and the reflection can end the walk on its own. */
const PathFooter = ({ path, room }: { path: Path; room: Room }) => {
  const order = roomsForPath(path, allRooms)
  const index = order.findIndex((candidate) => candidate.id === room.id)
  if (index === -1) return null
  const previous = order[index - 1]
  const next = order[index + 1]
  return (
    <>
      {next === undefined && path.closingReflection !== undefined && (
        <div className={styles.pathEnd}>
          {paragraphs(path.closingReflection).map((paragraph, i) => (
            <p key={i} className={styles.pathEndParagraph}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
      {(previous !== undefined || next !== undefined) && (
        <PathTrail path={path} room={room} previous={previous} next={next} />
      )}
    </>
  )
}

/** Writes the orientation memory: last-read room (so room selection avoids
 * immediate repetition) and the last-opened room in the path (so the reader can
 * return). Only published content is recorded — drafts previewed via a
 * direct link should neither push published rooms out of the small window nor
 * write path memory (paths.md: the memory is orientation, never progress). */
const useRoomMemory = (room: Room | undefined, path: Path | undefined): void => {
  const { registerLastRoom, registerPathPosition } = useAtlas()
  const publishedRoomId = room?.status === 'published' ? room.id : undefined
  const pathPositionId =
    path?.status === 'published' &&
    publishedRoomId !== undefined &&
    path.rooms.includes(publishedRoomId)
      ? path.id
      : undefined
  useEffect(() => {
    if (publishedRoomId !== undefined) registerLastRoom(publishedRoomId)
  }, [publishedRoomId, registerLastRoom])
  useEffect(() => {
    if (pathPositionId !== undefined && publishedRoomId !== undefined)
      registerPathPosition(pathPositionId, publishedRoomId)
  }, [pathPositionId, publishedRoomId, registerPathPosition])
}

/** Phase 14: catches broken source relations — a room pointing at a source or
 * passage that cannot be resolved. The build gate (check:content) should prevent it
 * for published content, so this is a safety net against drift/regressions.
 * Logs only ids, never text. */
const useRelationCheck = (room: Room | undefined): void => {
  useEffect(() => {
    if (!room) return
    for (const relation of room.sources) {
      if (!findSource(relation.source))
        report({ type: 'broken-source-link', from: room.id, to: relation.source })
      else if (relation.passage !== undefined && !findPassage(relation.passage))
        report({
          type: 'invalid-content-relation',
          kind: 'passage',
          from: room.id,
          reference: relation.passage,
        })
    }
  }, [room])
}

/** The reading room (reading-room.md): one text, one thought, a natural end.
 * No recommendations, no next room. The threshold opens here via room selection,
 * which chooses only published rooms; drafts are reached labelled via a direct link and
 * serve as the editorial review view. The search parameter `vandringSlug` is set
 * only when the room is reached from within a path and controls the path footer. */
export const RoomPage = ({ slug, pathSlug }: { slug: string; pathSlug?: string }) => {
  const room = findRoom(slug)
  const path = pathSlug !== undefined ? findPathBySlug(pathSlug) : undefined
  useRoomMemory(room, path)
  useRelationCheck(room)
  useDocumentTitle(room?.title)
  if (!room) return <NotFoundNote subject="Rummet" />
  const theme = findTheme(room.themes[0] ?? '')
  return (
    <div className="screenReader">
      <TopBar right={<ReadingSettingsButton />} />
      <section className={styles.section}>
        <header className={styles.head}>
          <div className="kicker">
            {theme?.label ?? ''}
            {room.status !== 'published' && ' · Utkast'}
          </div>
          <h1 className={styles.title}>{room.title}</h1>
        </header>
        {paragraphs(room.opening).map((paragraph, i) => (
          <p key={i} className={styles.stycke}>
            {paragraph}
          </p>
        ))}
        <div className={`dots ${styles.pause}`}>···</div>
      </section>
      <section className={styles.section}>
        {paragraphs(room.core).map((paragraph, i) => (
          <p key={i} className={styles.stycke}>
            {paragraph}
          </p>
        ))}
        <div className={`dots ${styles.pause}`}>···</div>
      </section>
      <p className={styles.thought}>{room.thoughtToCarry}</p>
      <div className={styles.questions}>
        {room.reflectionQuestions.map((question) => (
          <p key={question} className={styles.question}>
            {question}
          </p>
        ))}
      </div>
      <RoomEnding room={room} />
      {path !== undefined && <PathFooter path={path} room={room} />}
    </div>
  )
}
