import { Link } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import type { Kalla } from '../../content/redaktion/schema'
import { publiceradeVia, rumForKalla } from '../../lib/bibliotek'
import { allaRum, hittaKallaViaSlug, hittaTradition } from '../../lib/innehall'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Rumslista, Sektion, Sidhuvud } from './Biblioteksdelar'

const TYPETIKETT: Record<Kalla['typ'], string> = {
  'bok': 'Bok',
  'skrift': 'Skrift',
  'brev': 'Brev',
  'tal': 'Tal',
  'dikt': 'Dikt',
  'inskrift': 'Inskrift',
  'muntlig-tradition': 'Muntlig tradition',
  'historiskt-dokument': 'Historiskt dokument',
  'fragment': 'Fragment',
  'annat': 'Källa',
}

const RATTIGHETSETIKETT: Record<Kalla['rättigheter'], string> = {
  'public-domain': 'Fri att återge (public domain)',
  'licensierad': 'Licensierad',
  'skyddad': 'Upphovsrättsskyddad',
  'okänd': 'Oklar rättighetsstatus',
}

// Ärlig osäkerhet i klartext (source-and-context.md, Uncertainty): en
// tillskriven röst presenteras som tillskriven, aldrig som säkert upphov.
const upphovsrad = (källa: Kalla): string | undefined => {
  if (källa.tillskrivenFörfattare === undefined) return källa.författare
  const nedtecknare = källa.författare ? `, nedtecknad av ${källa.författare}` : ''
  const namn = `${källa.tillskrivenFörfattare}${nedtecknare}`
  return källa.upphov === 'tillskrivet' ? `Tillskrivs ${namn}` : namn
}

const Metarad = ({ etikett, värde }: { etikett: string; värde?: string }) =>
  värde === undefined || värde === '' ? null : (
    <p className={styles.metarad}>
      <span className={styles.metaetikett}>{etikett}</span>
      {värde}
    </p>
  )

const Kallmeta = ({ källa }: { källa: Kalla }) => {
  const traditionsnamn = publiceradeVia(källa.traditioner ?? [], hittaTradition).map(
    (tradition) => tradition.namn,
  )
  return (
    <div className={styles.metablock}>
      <Metarad etikett="Upphov" värde={upphovsrad(källa)} />
      <Metarad etikett="Tradition" värde={traditionsnamn.join(', ')} />
      <Metarad
        etikett="Tillkomst"
        värde={[källa.ungefärligDatering, källa.plats].filter(Boolean).join(' · ')}
      />
      <Metarad etikett="Originalspråk" värde={källa.originalspråk} />
      <Metarad etikett="Rättigheter" värde={RATTIGHETSETIKETT[källa.rättigheter]} />
    </div>
  )
}

/** Källpost (library.md, Sources): saklig metadata, kopplade rum och vägen
 * in i biblioteksläsaren när hela texten finns där. Ingen auktoritetsprosa.
 * TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const KallaPostPage = ({ slug }: { slug: string }) => {
  const källa = hittaKallaViaSlug(slug)
  if (!källa) return <NotFoundNote subject="Källan" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker={TYPETIKETT[källa.typ]} titel={källa.titel} status={källa.status}>
        {källa.originaltitel && <p className={styles.originaltitel}>{källa.originaltitel}</p>}
      </Sidhuvud>
      <Kallmeta källa={källa} />
      <Beskrivning text={källa.beskrivning} />
      {källa.biblioteksverk !== undefined && (
        <Sektion rubrik="Hela texten">
          <Link
            to="/bibliotek/verk/$workId"
            params={{ workId: källa.biblioteksverk }}
            className={styles.rad}
          >
            <span className={styles.radTitel}>Läs hela texten</span>
            <span className={styles.chev}>›</span>
          </Link>
        </Sektion>
      )}
      <Sektion rubrik="Rum ur denna källa">
        <Rumslista
          rum={rumForKalla(källa.id, allaRum)}
          tomtBesked="Det finns inga färdiga rum ur källan ännu."
        />
      </Sektion>
    </div>
  )
}
