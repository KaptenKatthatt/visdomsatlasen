import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Rum, Vandring } from '../../content/redaktion/schema'
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

/** Stilla orienteringsrad: vandringens traditioner följt av ungefärlig
 * sammanlagd lästid (paths.md, Path Overview — källor visas lågmält, tiden
 * är ungefärlig och aldrig ett mål). */
const Metarad = ({ rummen }: { rummen: Rum[] }) => {
  const traditioner = traditionerForVandring(rummen, allaKallor, allaTraditioner)
  const delar = [
    ...traditioner.map((tradition) => tradition.namn),
    `ca ${vandringLastid(rummen)} min sammanlagt`,
  ]
  return <p className={styles.antal}>{delar.join(' · ')}</p>
}

/** Den centrala frågan — vandringens hjärta. Visas bara när den är publicerad;
 * annars nås utkastfrågan via biblioteket, inte härifrån. */
const Fragedel = ({ vandring }: { vandring: Vandring }) => {
  const [fråga] = publiceradeVia([vandring.centralFråga], hittaFraga)
  if (!fråga) return null
  return (
    <Sektion rubrik="Fråga">
      <ToLink to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
        <Rad titel={fråga.text} />
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
  const plats = rummen.find((ettRum) => ettRum.id === vandringsplatser[vandring.id])
  return (
    <Sektion rubrik="Rummen">
      {plats && (
        <Link
          to="/rum/$slug"
          params={{ slug: plats.slug }}
          search={{ vandring: vandring.slug }}
          className={styles.rad}
        >
          <Rad titel="Fortsätt där du stannade" sub={plats.titel} />
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
                <Rad titel={ettRum.titel} sub={`${ettRum.lästidMinuter} min`} />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Sektion>
  )
}

/** Vandringens översikt (paths.md, Path Overview): titel, stilla metadata,
 * introduktion, central fråga och rummen i redaktionell ordning. Ingen
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
      <Sidhuvud kicker="Vandring" titel={vandring.titel} status={vandring.status} />
      <Metarad rummen={rummen} />
      <Beskrivning text={vandring.introduktion} />
      <Fragedel vandring={vandring} />
      <Rumdel vandring={vandring} rummen={rummen} />
    </div>
  )
}
