import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Question } from '../../content/editorial/schema'
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

const Temadel = ({ fråga }: { fråga: Question }) => {
  const themes = publiceradeVia(fråga.themes, hittaTema)
  if (themes.length === 0) return null
  return (
    <Sektion rubrik="Teman">
      {themes.map((tema) => (
        <ToLink key={tema.id} to={{ kind: 'tema', slug: tema.slug }} className={styles.rad}>
          <Rad title={tema.label} />
        </ToLink>
      ))}
    </Sektion>
  )
}

const Kalldel = ({ fråga }: { fråga: Question }) => {
  const sources = kallorForFraga(fråga.id, allaRum, allaKallor)
  if (sources.length === 0) return null
  return (
    <Sektion rubrik="Källor">
      {sources.map((source) => (
        <ToLink key={source.id} to={{ kind: 'kallpost', slug: source.slug }} className={styles.rad}>
          <Rad title={source.title} sub={kallnamn(source)} />
        </ToLink>
      ))}
    </Sektion>
  )
}

const Narliggande = ({ fråga }: { fråga: Question }) => {
  const frågor = publiceradeVia(fråga.relatedQuestions ?? [], hittaFraga)
  if (frågor.length === 0) return null
  return (
    <Sektion rubrik="Närliggande frågor">
      {frågor.map((relaterad) => (
        <ToLink
          key={relaterad.id}
          to={{ kind: 'fraga', slug: relaterad.slug }}
          className={styles.rad}
        >
          <Rad title={relaterad.text} />
        </ToLink>
      ))}
    </Sektion>
  )
}

/** Frågesida (library.md, Questions): description, rum, themes och
 * källmaterial. En place att välja från — aldrig en automatisk lässekvens.
 * TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const FragaPage = ({ slug }: { slug: string }) => {
  const fråga = hittaFragaViaSlug(slug)
  if (!fråga) return <NotFoundNote subject="Frågan" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Fråga" title={fråga.text} status={fråga.status} />
      <Beskrivning text={fråga.description} />
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
