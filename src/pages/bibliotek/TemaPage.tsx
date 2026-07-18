import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { fragorForTema } from '../../lib/bibliotek'
import { allaFragor, allaRum, hittaTemaViaSlug } from '../../lib/innehall'
import { valbaraRum } from '../../lib/rumsval'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Rad, Rumslista, Sektion, Sidhuvud } from './Biblioteksdelar'

const Fragedel = ({ temaId }: { temaId: string }) => {
  const frågor = fragorForTema(temaId, allaFragor)
  if (frågor.length === 0) return null
  return (
    <Sektion rubrik="Frågor">
      {frågor.map((fråga) => (
        <ToLink key={fråga.id} to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
          <Rad title={fråga.text} />
        </ToLink>
      ))}
    </Sektion>
  )
}

/** Temasida (library.md, Themes): description, temats frågor och publicerade
 * rum. TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const TemaPage = ({ slug }: { slug: string }) => {
  const tema = hittaTemaViaSlug(slug)
  if (!tema) return <NotFoundNote subject="Temat" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Tema" title={tema.label} status={tema.status} />
      <Beskrivning text={tema.description} />
      <Fragedel temaId={tema.id} />
      <Sektion rubrik="Rum">
        <Rumslista
          rum={valbaraRum(tema.id, allaRum)}
          tomtBesked="Det finns inga färdiga rum här ännu."
        />
      </Sektion>
    </div>
  )
}
