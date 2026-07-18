import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Rum, Vandring } from '../../content/editorial/schema'
import {
  publiceradeVia,
  rumForVandring,
  traditionerForVandring,
  vandringLastid,
} from '../../lib/bibliotek'
import {
  allaKallor,
  allaRum,
  allaTraditioner,
  hittaFraga,
  hittaVandringViaSlug,
} from '../../lib/innehall'
import { useAtlas } from '../../lib/store'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Rad, Sektion, Sidhuvud } from './Biblioteksdelar'

/** Stilla orienteringsrad: vandringens traditions följt av ungefärlig
 * sammanlagd lästid (paths.md, Path Overview — sources visas lågmält, tiden
 * är ungefärlig och aldrig ett mål). */
const Metarad = ({ rummen }: { rummen: Rum[] }) => {
  const traditions = traditionerForVandring(rummen, allaKallor, allaTraditioner)
  const delar = [
    ...traditions.map((tradition) => tradition.name),
    `ca ${vandringLastid(rummen)} min sammanlagt`,
  ]
  return <p className={styles.antal}>{delar.join(' · ')}</p>
}

/** En stilla spara-kontroll (notes-and-saved.md, Saving): »Spara«/»Sparad«,
 * ingen firande återkoppling, ingen räknare. En sparad vandring betyder bara
 * att läsaren vill kunna återvända — aldrig ett åtagande att slutföra. */
const SparaVandring = ({ vandring }: { vandring: Vandring }) => {
  const { sparadeVandringar, vaxlaSparadVandring } = useAtlas()
  const sparad = !!sparadeVandringar[vandring.id]
  return (
    <div className={styles.spara}>
      <button
        type="button"
        className={styles.sparaknapp}
        aria-pressed={sparad}
        onClick={() => vaxlaSparadVandring(vandring.id)}
      >
        {sparad ? 'Sparad' : 'Spara'}
      </button>
    </div>
  )
}

/** Den centrala frågan — vandringens hjärta. Visas bara när den är publicerad;
 * annars nås utkastfrågan via biblioteket, inte härifrån. */
const Fragedel = ({ vandring }: { vandring: Vandring }) => {
  const [fråga] = publiceradeVia([vandring.centralQuestion], hittaFraga)
  if (!fråga) return null
  return (
    <Sektion rubrik="Fråga">
      <ToLink to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
        <Rad title={fråga.text} />
      </ToLink>
    </Sektion>
  )
}

/** Rummen som platser längs en stig, inte uppgifter (paths.md, Path Overview).
 * En semantiskt ordnad lista (`<ol>`) bär sekvensen utan visuella pilar
 * (Accessibility). Varje rad öppnar rummet med vandringen som kontext. En
 * neutral »Fortsätt där du stannade« läggs överst om ett rum minns — bara
 * orientering, aldrig förlopp. */
const Rumdel = ({ vandring, rummen }: { vandring: Vandring; rummen: Rum[] }) => {
  const { vandringsplatser } = useAtlas()
  const place = rummen.find((ettRum) => ettRum.id === vandringsplatser[vandring.id])
  return (
    <Sektion rubrik="Rummen">
      {place && (
        <Link
          to="/rum/$slug"
          params={{ slug: place.slug }}
          search={{ vandring: vandring.slug }}
          className={styles.rad}
        >
          <Rad title="Fortsätt där du stannade" sub={place.title} />
        </Link>
      )}
      {rummen.length === 0 ? (
        <p className={styles.tomt}>Den här vandringen har inga rum ännu.</p>
      ) : (
        <ol className={styles.vandringslista}>
          {rummen.map((ettRum) => (
            <li key={ettRum.id}>
              <Link
                to="/rum/$slug"
                params={{ slug: ettRum.slug }}
                search={{ vandring: vandring.slug }}
                className={styles.rad}
              >
                <Rad title={ettRum.title} sub={`${ettRum.readingTimeMinutes} min`} />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Sektion>
  )
}

/** Vandringens översikt (paths.md, Path Overview): title, stilla metadata,
 * introduction, central fråga och rummen i redaktionell order. Ingen
 * syllabuskänsla, inga förloppsmått. Vandringen läses i läsrummet, ett rum i
 * taget — här väljer man bara var man kliver in. TopBar utan onBack ⇒
 * historiksteg bakåt, så biblioteksplatsen bevaras. */
export const VandringPage = ({ slug }: { slug: string }) => {
  const vandring = hittaVandringViaSlug(slug)
  if (!vandring) return <NotFoundNote subject="Vandringen" />
  const rummen = rumForVandring(vandring, allaRum)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Vandring" title={vandring.title} status={vandring.status} />
      <Metarad rummen={rummen} />
      <SparaVandring vandring={vandring} />
      <Beskrivning text={vandring.introduction} />
      <Fragedel vandring={vandring} />
      <Rumdel vandring={vandring} rummen={rummen} />
    </div>
  )
}
