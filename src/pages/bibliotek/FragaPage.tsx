import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Fraga } from '../../content/redaktion/schema'
import { kallorForFraga, publiceradeVia, rumForFraga } from '../../lib/bibliotek'
import {
  allaKallor,
  allaRum,
  hittaFraga,
  hittaFragaViaSlug,
  hittaTema,
  kallnamn,
} from '../../lib/innehall'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Rad, Rumslista, Sektion, Sidhuvud } from './Biblioteksdelar'

const Temadel = ({ fråga }: { fråga: Fraga }) => {
  const teman = publiceradeVia(fråga.teman, hittaTema)
  if (teman.length === 0) return null
  return (
    <Sektion rubrik="Teman">
      {teman.map((tema) => (
        <ToLink key={tema.id} to={{ kind: 'tema', slug: tema.slug }} className={styles.rad}>
          <Rad titel={tema.etikett} />
        </ToLink>
      ))}
    </Sektion>
  )
}

const Kalldel = ({ fråga }: { fråga: Fraga }) => {
  const källor = kallorForFraga(fråga.id, allaRum, allaKallor)
  if (källor.length === 0) return null
  return (
    <Sektion rubrik="Källor">
      {källor.map((källa) => (
        <ToLink key={källa.id} to={{ kind: 'kallpost', slug: källa.slug }} className={styles.rad}>
          <Rad titel={källa.titel} sub={kallnamn(källa)} />
        </ToLink>
      ))}
    </Sektion>
  )
}

const Narliggande = ({ fråga }: { fråga: Fraga }) => {
  const frågor = publiceradeVia(fråga.relateradeFrågor ?? [], hittaFraga)
  if (frågor.length === 0) return null
  return (
    <Sektion rubrik="Närliggande frågor">
      {frågor.map((relaterad) => (
        <ToLink
          key={relaterad.id}
          to={{ kind: 'fraga', slug: relaterad.slug }}
          className={styles.rad}
        >
          <Rad titel={relaterad.text} />
        </ToLink>
      ))}
    </Sektion>
  )
}

/** Frågesida (library.md, Questions): beskrivning, rum, teman och
 * källmaterial. En plats att välja från — aldrig en automatisk lässekvens.
 * TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const FragaPage = ({ slug }: { slug: string }) => {
  const fråga = hittaFragaViaSlug(slug)
  if (!fråga) return <NotFoundNote subject="Frågan" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Fråga" titel={fråga.text} status={fråga.status} />
      <Beskrivning text={fråga.beskrivning} />
      <Sektion rubrik="Rum">
        <Rumslista
          rum={rumForFraga(fråga.id, allaRum)}
          tomtBesked="Det finns inga färdiga rum kring frågan ännu."
        />
      </Sektion>
      <Temadel fråga={fråga} />
      <Kalldel fråga={fråga} />
      <Narliggande fråga={fråga} />
    </div>
  )
}
