import { Link } from '@tanstack/react-router'
import { Fragment, useEffect, useRef, useState } from 'react'
import { BackIcon } from '../../components/Icons'
import { NotesSheet } from '../../components/NotesSheet'
import { ReadingSettingsButton } from '../../components/ReadingSettingsButton'
import { RoomText } from '../../components/RoomText'
import { ToLink } from '../../components/ToLink'
import type { Path, Room, Source } from '../../content/editorial/schema'
import { allRooms, findPathBySlug, findQuestion, findSource, paragraphs } from '../../lib/content'
import { publishedThrough, roomsForPath } from '../../lib/library'
import { useAtlas } from '../../lib/store'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { NotFoundNote } from '../NotFoundNote'
import styles from './PathRead.module.css'

/** Uppehållet mellan flödets delar: en hel skärmhöjd tomt papper med vecket i
 * mitten. Föregående text är garanterat ur bild, och det tar en liten stund att
 * rulla genom tystnaden innan nästa rubrik stiger upp — det är pausen som gör
 * läsningen långsam, inte någon kontroll. */
const Rest = () => (
  <div className={styles.rest}>
    <span className="dots">···</span>
  </div>
)

/** Den stumma källraden: bara verkens namn i versaler, per rum. Ingen
 * utfällning, ingen länk — källapparaten bor i biblioteket, och flödet ska
 * inte erbjuda någon väg bort mitt i läsningen. */
const sourceLine = (room: Room): string =>
  [
    ...new Set(
      room.sources
        .map((relation) => findSource(relation.source))
        .filter((source): source is Source => source !== undefined)
        .map((source) => source.title),
    ),
  ].join(' · ')

/** Vandringens avslut: den avslutande reflektionen, den centrala frågan som
 * sista tanke och en ensam »Skriv ner en tanke«. Anteckningen hör vandringen
 * till (ursprunget `path`), inte något enskilt rum. Ingen gratulation, ingen
 * förloppsmätare — att känna sig nöjd och sluta mitt i är ett lika gott slut,
 * så slutet firar ingenting. */
const Ending = ({ path }: { path: Path }) => {
  const { notes, setNote, removeNote } = useAtlas()
  const [noteOpen, setNoteOpen] = useState(false)
  const [question] = publishedThrough([path.centralQuestion], findQuestion)
  return (
    <section className={styles.ending}>
      {path.closingReflection !== undefined &&
        paragraphs(path.closingReflection).map((paragraph, i) => (
          <p key={i} className={styles.reflection}>
            {paragraph}
          </p>
        ))}
      {question && (
        <p className={styles.question}>
          <ToLink to={{ kind: 'fraga', slug: question.slug }} className={styles.questionLink}>
            {question.text}
          </ToLink>
        </p>
      )}
      <div className={styles.noteRow}>
        <button type="button" className={styles.noteAction} onClick={() => setNoteOpen(true)}>
          Skriv ner en tanke
        </button>
      </div>
      {noteOpen && (
        <NotesSheet
          title={path.title}
          value={notes[path.id]?.text ?? ''}
          onChange={(text) => setNote('path', path.id, text)}
          onDelete={() => removeNote(path.id)}
          onClose={() => setNoteOpen(false)}
        />
      )}
    </section>
  )
}

/** Skriver vandringens orienteringsminne medan läsaren rullar: det rum vars
 * början senast passerat övre delen av skärmen. Bara orientering — »var var
 * jag« i Sparat — aldrig förlopp, och bara för publicerat innehåll (paths.md:
 * minnet är orientering, aldrig progress). Miljöer utan IntersectionObserver
 * (jsdom) lämnas tysta. */
const usePathPositionMemory = (
  container: { current: HTMLDivElement | null },
  path: Path | undefined,
): void => {
  const { registerPathPosition } = useAtlas()
  const pathId = path?.status === 'published' ? path.id : undefined
  useEffect(() => {
    if (pathId === undefined) return
    if (typeof IntersectionObserver === 'undefined' || container.current === null) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const roomId = entry.target.getAttribute('data-rum')
          if (roomId !== null) registerPathPosition(pathId, roomId)
        }
      },
      // Bandet är skärmens övre femtedel: rummet »är« där man står när dess
      // text ligger överst i bild, inte när det skymtar längst ner.
      { rootMargin: '0px 0px -80% 0px' },
    )
    for (const node of container.current.querySelectorAll('[data-rum]')) observer.observe(node)
    return () => observer.disconnect()
  }, [container, pathId, registerPathPosition])
}

/** Öppnar flödet vid en viss anhalt: förrummets anhaltslänkar bär rummets slug
 * som hash, och sidan ställer sig där direkt — inget animerat hopp, läsningen
 * ska börja i stillhet där man klev på. */
const useHashEntry = (): void => {
  useEffect(() => {
    const slug = window.location.hash.slice(1)
    if (slug === '') return
    document.getElementById(slug)?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [])
}

/** Vandringens egen läsvy — »Den långsamma rullen« (paths.md): hela vandringen
 * som en enda sammanhängande, långsam läsning. Ledstarten (introduktionen bor i
 * förrummet), sedan rummen i redaktionell ordning med en skärmhöjd tystnad
 * mellan varje, och sist avslutet. Man går vidare genom att läsa vidare — inga
 * tryck eller pilar mellan rummen, ingen Spara-knapp i flödet. Bottenbaren är
 * enda kontrollen: chevronen leder alltid tillbaka till förrummet, så man
 * aldrig känner sig fångad i flödet. Rummen i flödet får ett »Utkast«-märke
 * bara när de inte är publicerade (redaktörens granskningsvy). */
export const PathReadPage = ({ slug }: { slug: string }) => {
  const container = useRef<HTMLDivElement | null>(null)
  const path = findPathBySlug(slug)
  usePathPositionMemory(container, path)
  useHashEntry()
  useDocumentTitle(path?.title)
  if (!path) return <NotFoundNote subject="Vandringen" />
  const rooms = roomsForPath(path, allRooms)
  return (
    <div ref={container} className={`screenReader ${styles.screen}`}>
      <header className={styles.trailhead}>
        <div className="kicker">
          Vandring
          {path.status !== 'published' && ' · Utkast'}
        </div>
        <h1 className={styles.title}>{path.title}</h1>
      </header>
      {rooms.length === 0 ? (
        <p className={styles.empty}>Den här vandringen har inga rum ännu.</p>
      ) : (
        <>
          {rooms.map((room) => (
            <Fragment key={room.id}>
              <Rest />
              <article data-rum={room.id}>
                <RoomText
                  room={room}
                  heading="h2"
                  anchor={room.slug}
                  {...(room.status === 'published' ? {} : { kicker: 'Utkast' })}
                />
                {sourceLine(room) !== '' && <p className={styles.sourceLine}>{sourceLine(room)}</p>}
              </article>
            </Fragment>
          ))}
          <Rest />
          <Ending path={path} />
        </>
      )}
      <nav aria-label="Vandringen" className={styles.bar}>
        <Link
          to="/vandring/$slug"
          params={{ slug: path.slug }}
          aria-label="Till vandringens översikt"
          className="iconBtn"
        >
          <BackIcon />
        </Link>
        <ReadingSettingsButton />
      </nav>
    </div>
  )
}
