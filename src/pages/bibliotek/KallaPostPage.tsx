import { Link } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import type { Source, SourcePassage } from '../../content/editorial/schema'
import { passagesForSource, publishedThrough, roomsForSource } from '../../lib/library'
import {
  allPassages,
  allRooms,
  findSourceBySlug,
  findTradition,
  uncertainties,
  paragraphs,
} from '../../lib/content'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Rumslista, Section, Sidhuvud } from './Biblioteksdelar'

const TYPETIKETT: Record<Source['type'], string> = {
  'book': 'Bok',
  'writing': 'Skrift',
  'letter': 'Brev',
  'speech': 'Tal',
  'poem': 'Dikt',
  'inscription': 'Inskrift',
  'oral-tradition': 'Muntlig tradition',
  'historical-document': 'Historiskt dokument',
  'fragment': 'Fragment',
  'other': 'Källa',
}

const RATTIGHETSETIKETT: Record<Source['rights'], string> = {
  'public-domain': 'Fri att återge (public domain)',
  'licensed': 'Licensierad',
  'protected': 'Upphovsrättsskyddad',
  'unknown': 'Oklar rättighetsstatus',
}

// Ärlig osäkerhet i klartext (source-and-context.md, Uncertainty): en
// tillskriven röst presenteras som tillskriven, aldrig som säkert attribution.
const upphovsrad = (source: Source): string | undefined => {
  if (source.attributedAuthor === undefined) return source.author
  const nedtecknare = source.author ? `, nedtecknad av ${source.author}` : ''
  const name = `${source.attributedAuthor}${nedtecknare}`
  return source.attribution === 'attributed' ? `Tillskrivs ${name}` : name
}

const Metarad = ({ label, värde }: { label: string; värde?: string }) =>
  värde === undefined || värde === '' ? null : (
    <p className={styles.metarad}>
      <span className={styles.metaetikett}>{label}</span>
      {värde}
    </p>
  )

const Kallmeta = ({ source }: { source: Source }) => {
  const traditionsnamn = publishedThrough(source.traditions ?? [], findTradition).map(
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
const passagemeta = (passage: SourcePassage): string =>
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
const Passageblock = ({ passage }: { passage: SourcePassage }) => {
  const meta = passagemeta(passage)
  return (
    <div className={styles.passage}>
      <p className={styles.passagref}>{passage.reference}</p>
      {passage.originalText && (
        <blockquote className={styles.passagetext}>
          {paragraphs(passage.originalText).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </blockquote>
      )}
      {passage.translation && (
        <blockquote className={styles.passagetext}>
          {paragraphs(passage.translation).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
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
  const source = findSourceBySlug(slug)
  if (!source) return <NotFoundNote subject="Källan" />
  const uncertainty = uncertainties(source)
  const passager = passagesForSource(source.id, allPassages)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker={TYPETIKETT[source.type]} title={source.title} status={source.status}>
        {source.originalTitle && <p className={styles.originalTitle}>{source.originalTitle}</p>}
      </Sidhuvud>
      <Kallmeta source={source} />
      <Beskrivning text={source.description} />
      {uncertainty.length > 0 && (
        <Section rubrik="Osäkerhet">
          {uncertainty.map((rad) => (
            <p key={rad} className={styles.description}>
              {rad}
            </p>
          ))}
        </Section>
      )}
      {passager.length > 0 && (
        <Section rubrik="Passager">
          {passager.map((passage) => (
            <Passageblock key={passage.id} passage={passage} />
          ))}
        </Section>
      )}
      {source.libraryWork !== undefined && (
        <Section rubrik="Hela texten">
          <Link
            to="/bibliotek/verk/$workId"
            params={{ workId: source.libraryWork }}
            className={styles.rad}
          >
            <span className={styles.radTitel}>Läs hela texten</span>
            <span className={styles.chev}>›</span>
          </Link>
        </Section>
      )}
      <Section rubrik="Rum ur denna source">
        <Rumslista
          rum={roomsForSource(source.id, allRooms)}
          tomtBesked="Det finns inga färdiga rum ur källan ännu."
        />
      </Section>
    </div>
  )
}
