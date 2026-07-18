import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Room, Path } from '../../content/editorial/schema'
import {
  publishedThrough,
  roomsForPath,
  traditionsForPath,
  pathReadingTime,
} from '../../lib/library'
import {
  allSources,
  allRooms,
  allTraditions,
  findQuestion,
  findPathBySlug,
} from '../../lib/content'
import { useAtlas } from '../../lib/store'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Row, Section, Sidhuvud } from './Biblioteksdelar'

/** Stilla orienteringsrad: vandringens traditions följt av ungefärlig
 * sammanlagd lästid (paths.md, Path Overview — sources visas lågmält, tiden
 * är ungefärlig och aldrig ett mål). */
const Metarad = ({ rummen }: { rummen: Room[] }) => {
  const traditions = traditionsForPath(rummen, allSources, allTraditions)
  const delar = [
    ...traditions.map((tradition) => tradition.name),
    `ca ${pathReadingTime(rummen)} min sammanlagt`,
  ]
  return <p className={styles.antal}>{delar.join(' · ')}</p>
}

/** En stilla spara-kontroll (notes-and-saved.md, Saving): »Spara«/»Sparad«,
 * ingen firande återkoppling, ingen räknare. En sparad vandring betyder bara
 * att läsaren vill kunna återvända — aldrig ett åtagande att slutföra. */
const SavePath = ({ vandring }: { vandring: Path }) => {
  const { savedPaths, toggleSavedPath } = useAtlas()
  const saved = !!savedPaths[vandring.id]
  return (
    <div className={styles.spara}>
      <button
        type="button"
        className={styles.sparaknapp}
        aria-pressed={saved}
        onClick={() => toggleSavedPath(vandring.id)}
      >
        {saved ? 'Sparad' : 'Spara'}
      </button>
    </div>
  )
}

/** Den centrala frågan — vandringens hjärta. Visas bara när den är publicerad;
 * annars nås utkastfrågan via biblioteket, inte härifrån. */
const Fragedel = ({ vandring }: { vandring: Path }) => {
  const [fråga] = publishedThrough([vandring.centralQuestion], findQuestion)
  if (!fråga) return null
  return (
    <Section rubrik="Fråga">
      <ToLink to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
        <Row title={fråga.text} />
      </ToLink>
    </Section>
  )
}

/** Rummen som platser längs en stig, inte uppgifter (paths.md, Path Overview).
 * En semantiskt ordnad lista (`<ol>`) bär sekvensen utan visuella pilar
 * (Accessibility). Varje rad öppnar rummet med vandringen som kontext. En
 * neutral »Fortsätt där du stannade« läggs överst om ett rum minns — bara
 * orientering, aldrig förlopp. */
const Rumdel = ({ vandring, rummen }: { vandring: Path; rummen: Room[] }) => {
  const { pathPositions } = useAtlas()
  const place = rummen.find((room) => room.id === pathPositions[vandring.id])
  return (
    <Section rubrik="Rummen">
      {place && (
        <Link
          to="/rum/$slug"
          params={{ slug: place.slug }}
          search={{ vandring: vandring.slug }}
          className={styles.rad}
        >
          <Row title="Fortsätt där du stannade" sub={place.title} />
        </Link>
      )}
      {rummen.length === 0 ? (
        <p className={styles.tomt}>Den här vandringen har inga rum ännu.</p>
      ) : (
        <ol className={styles.vandringslista}>
          {rummen.map((room) => (
            <li key={room.id}>
              <Link
                to="/rum/$slug"
                params={{ slug: room.slug }}
                search={{ vandring: vandring.slug }}
                className={styles.rad}
              >
                <Row title={room.title} sub={`${room.readingTimeMinutes} min`} />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}

/** Vandringens översikt (paths.md, Path Overview): title, stilla metadata,
 * introduction, central fråga och rummen i redaktionell order. Ingen
 * syllabuskänsla, inga förloppsmått. Vandringen läses i läsrummet, ett rum i
 * taget — här väljer man bara var man kliver in. TopBar utan onBack ⇒
 * historiksteg bakåt, så biblioteksplatsen bevaras. */
export const VandringPage = ({ slug }: { slug: string }) => {
  const path = findPathBySlug(slug)
  if (!path) return <NotFoundNote subject="Vandringen" />
  const rooms = roomsForPath(path, allRooms)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Vandring" title={path.title} status={path.status} />
      <Metarad rummen={rooms} />
      <SavePath vandring={path} />
      <Beskrivning text={path.introduction} />
      <Fragedel vandring={path} />
      <Rumdel vandring={path} rummen={rooms} />
    </div>
  )
}
