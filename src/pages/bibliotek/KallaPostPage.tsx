import { Link } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import type { Kalla, Kallpassage } from '../../content/editorial/schema'
import { passagerForKalla, publiceradeVia, rumForKalla } from '../../lib/bibliotek'
import {
  allaPassager,
  allaRum,
  hittaKallaViaSlug,
  hittaTradition,
  osakerheter,
  stycken,
} from '../../lib/innehall'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Rumslista, Sektion, Sidhuvud } from './Biblioteksdelar'

const TYPETIKETT: Record<Kalla['type'], string> = {
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

const RATTIGHETSETIKETT: Record<Kalla['rights'], string> = {
  'public-domain': 'Fri att återge (public domain)',
  'licensierad': 'Licensierad',
  'skyddad': 'Upphovsrättsskyddad',
  'okänd': 'Oklar rättighetsstatus',
}

// Ärlig osäkerhet i klartext (source-and-context.md, Uncertainty): en
// tillskriven röst presenteras som tillskriven, aldrig som säkert attribution.
const upphovsrad = (source: Kalla): string | undefined => {
  if (source.attributedAuthor === undefined) return source.author
  const nedtecknare = source.author ? `, nedtecknad av ${source.author}` : ''
  const name = `${source.attributedAuthor}${nedtecknare}`
  return source.attribution === 'tillskrivet' ? `Tillskrivs ${name}` : name
}

const Metarad = ({ label, värde }: { label: string; värde?: string }) =>
  värde === undefined || värde === '' ? null : (
    <p className={styles.metarad}>
      <span className={styles.metaetikett}>{label}</span>
      {värde}
    </p>
  )

const Kallmeta = ({ source }: { source: Kalla }) => {
  const traditionsnamn = publiceradeVia(source.traditions ?? [], hittaTradition).map(
    (tradition) => tradition.name,
  )
  return (
    <div className={styles.metablock}>
      <Metarad label="Upphov" värde={upphovsrad(source)} />
      <Metarad label="Tradition" värde={traditionsnamn.join(', ')} />
      <Metarad
        label="Tillkomst"
        värde={[source.approximateDating, source.place].filter(Boolean).join(' · ')}
      />
      <Metarad label="Originalspråk" värde={source.originalLanguage} />
      <Metarad label="Rättigheter" värde={RATTIGHETSETIKETT[source.rights]} />
    </div>
  )
}

// Passagens metarad: translation, edition och år, stilla sammanfogade.
const passagemeta = (passage: Kallpassage): string =>
  [
    passage.translator && `Översättning: ${passage.translator}`,
    passage.edition,
    passage.publicationYear,
  ]
    .filter(Boolean)
    .join(' · ')

/** En källpassage: exakt reference, källans ord som semantiskt blockcitat
 * (originalText och/eller translation) och bibliografisk härkomst. Källans
 * ord hålls tydligt åtskilda från redaktionell prosa (source-and-context.md). */
const Passageblock = ({ passage }: { passage: Kallpassage }) => {
  const meta = passagemeta(passage)
  return (
    <div className={styles.passage}>
      <p className={styles.passagref}>{passage.reference}</p>
      {passage.originalText && (
        <blockquote className={styles.passagetext}>
          {stycken(passage.originalText).map((stycke, i) => (
            <p key={i}>{stycke}</p>
          ))}
        </blockquote>
      )}
      {passage.translation && (
        <blockquote className={styles.passagetext}>
          {stycken(passage.translation).map((stycke, i) => (
            <p key={i}>{stycke}</p>
          ))}
        </blockquote>
      )}
      {meta && <p className={styles.passagmeta}>{meta}</p>}
      {passage.url && (
        <a className={styles.passaglank} href={passage.url} target="_blank" rel="noreferrer">
          Källa på nätet
        </a>
      )}
    </div>
  )
}

/** Källpost (library.md, Sources): saklig metadata, kopplade rum och vägen
 * in i biblioteksläsaren när hela texten finns där. Ingen auktoritetsprosa.
 * TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const KallaPostPage = ({ slug }: { slug: string }) => {
  const source = hittaKallaViaSlug(slug)
  if (!source) return <NotFoundNote subject="Källan" />
  const osäkerhet = osakerheter(source)
  const passager = passagerForKalla(source.id, allaPassager)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker={TYPETIKETT[source.type]} title={source.title} status={source.status}>
        {source.originalTitle && <p className={styles.originalTitle}>{source.originalTitle}</p>}
      </Sidhuvud>
      <Kallmeta source={source} />
      <Beskrivning text={source.description} />
      {osäkerhet.length > 0 && (
        <Sektion rubrik="Osäkerhet">
          {osäkerhet.map((rad) => (
            <p key={rad} className={styles.description}>
              {rad}
            </p>
          ))}
        </Sektion>
      )}
      {passager.length > 0 && (
        <Sektion rubrik="Passager">
          {passager.map((passage) => (
            <Passageblock key={passage.id} passage={passage} />
          ))}
        </Sektion>
      )}
      {source.libraryWork !== undefined && (
        <Sektion rubrik="Hela texten">
          <Link
            to="/bibliotek/verk/$workId"
            params={{ workId: source.libraryWork }}
            className={styles.rad}
          >
            <span className={styles.radTitel}>Läs hela texten</span>
            <span className={styles.chev}>›</span>
          </Link>
        </Sektion>
      )}
      <Sektion rubrik="Rum ur denna source">
        <Rumslista
          rum={rumForKalla(source.id, allaRum)}
          tomtBesked="Det finns inga färdiga rum ur källan ännu."
        />
      </Sektion>
    </div>
  )
}
