import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { NotesSheet } from '../components/NotesSheet'
import { ReadingSettingsButton } from '../components/ReadingSettingsButton'
import { RoomText } from '../components/RoomText'
import { TopBar } from '../components/TopBar'
import type { Source, SourcePassage, Room } from '../content/editorial/schema'
import {
  useLabel,
  findSource,
  findPassage,
  findRoom,
  findTheme,
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

/** Writes the orientation memory: the last-read room, so room selection avoids
 * immediate repetition. Only published content is recorded — drafts previewed
 * via a direct link should not push published rooms out of the small window.
 * The path position memory lives in the path's reading flow (PathReadPage). */
const useRoomMemory = (room: Room | undefined): void => {
  const { registerLastRoom } = useAtlas()
  const publishedRoomId = room?.status === 'published' ? room.id : undefined
  useEffect(() => {
    if (publishedRoomId !== undefined) registerLastRoom(publishedRoomId)
  }, [publishedRoomId, registerLastRoom])
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
 * which chooses only published rooms; drafts are reached labelled via a direct
 * link and serve as the editorial review view. Always standalone — a path is
 * read in its own flow (PathReadPage), never room by room here. */
export const RoomPage = ({ slug }: { slug: string }) => {
  const room = findRoom(slug)
  useRoomMemory(room)
  useRelationCheck(room)
  useDocumentTitle(room?.title)
  if (!room) return <NotFoundNote subject="Rummet" />
  const theme = findTheme(room.themes[0] ?? '')
  const kicker = (theme?.label ?? '') + (room.status === 'published' ? '' : ' · Utkast')
  return (
    <div className="screenReader">
      <TopBar right={<ReadingSettingsButton />} />
      <RoomText room={room} heading="h1" kicker={kicker} />
      <RoomEnding room={room} />
    </div>
  )
}
