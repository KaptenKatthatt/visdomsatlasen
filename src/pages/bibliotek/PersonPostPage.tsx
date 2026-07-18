import { TopBar } from '../../components/TopBar'
import { findPersonBySlug } from '../../lib/content'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Sidhuvud } from './Biblioteksdelar'

/** Person page in the library (library.md, People and Authors): a reference point,
 * not an entry — a portrait in calm prose, without authority claims. Separate from
 * the legacy person pages under /person (the old app's people.ts).
 * TopBar without onBack ⇒ history step back — the library location is preserved. */
export const PersonPostPage = ({ slug }: { slug: string }) => {
  const person = findPersonBySlug(slug)
  if (!person) return <NotFoundNote subject="Personen" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Person" title={person.name} status={person.status}>
        {person.years !== undefined && <p className={styles.artal}>{person.years}</p>}
      </Sidhuvud>
      <Beskrivning text={person.description} />
    </div>
  )
}
