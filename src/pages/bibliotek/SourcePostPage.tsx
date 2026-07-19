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
import styles from './Library.module.css'
import { Description, RoomList, Section, Sidhuvud } from './LibraryParts'

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

// Honest uncertainty in plain text (source-and-context.md, Uncertainty): an
// attributed voice is presented as attributed, never as certain attribution.
const upphovsrad = (source: Source): string | undefined => {
  if (source.attributedAuthor === undefined) return source.author
  const nedtecknare = source.author ? `, nedtecknad av ${source.author}` : ''
  const name = `${source.attributedAuthor}${nedtecknare}`
  return source.attribution === 'attributed' ? `Tillskrivs ${name}` : name
}

const MetaRow = ({ label, value }: { label: string; value?: string }) =>
  value === undefined || value === '' ? null : (
    <p className={styles.metaRow}>
      <span className={styles.metaLabel}>{label}</span>
      {value}
    </p>
  )

const SourceMeta = ({ source }: { source: Source }) => {
  const traditionNames = publishedThrough(source.traditions ?? [], findTradition).map(
    (tradition) => tradition.name,
  )
  return (
    <div className={styles.metaBlock}>
      <MetaRow label="Upphov" value={upphovsrad(source)} />
      <MetaRow label="Tradition" value={traditionNames.join(', ')} />
      <MetaRow
        label="Tillkomst"
        value={[source.approximateDating, source.place].filter(Boolean).join(' · ')}
      />
      <MetaRow label="Originalspråk" value={source.originalLanguage} />
      <MetaRow label="Rättigheter" value={RATTIGHETSETIKETT[source.rights]} />
    </div>
  )
}

// The passage's meta row: translation, edition and year, quietly joined.
const passagemeta = (passage: SourcePassage): string =>
  [
    passage.translator && `Översättning: ${passage.translator}`,
    passage.edition,
    passage.publicationYear,
  ]
    .filter(Boolean)
    .join(' · ')

/** A source passage: exact reference, the source's words as a semantic block quote
 * (originalText and/or translation) and bibliographic provenance. The source's
 * words are kept clearly separate from editorial prose (source-and-context.md). */
const Passageblock = ({ passage }: { passage: SourcePassage }) => {
  const meta = passagemeta(passage)
  return (
    <div className={styles.passage}>
      <p className={styles.passageRef}>{passage.reference}</p>
      {passage.originalText && (
        <blockquote className={styles.passageText}>
          {paragraphs(passage.originalText).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </blockquote>
      )}
      {passage.translation && (
        <blockquote className={styles.passageText}>
          {paragraphs(passage.translation).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </blockquote>
      )}
      {meta && <p className={styles.passageMeta}>{meta}</p>}
      {passage.url && (
        <a className={styles.passageLink} href={passage.url} target="_blank" rel="noreferrer">
          Källa på nätet
        </a>
      )}
    </div>
  )
}

/** Source entry (library.md, Sources): factual metadata, linked rooms and the way
 * into the library reader when the full text is there. No authority prose.
 * TopBar without onBack ⇒ history step back — the library location is preserved. */
export const SourcePostPage = ({ slug }: { slug: string }) => {
  const source = findSourceBySlug(slug)
  if (!source) return <NotFoundNote subject="Källan" />
  const uncertainty = uncertainties(source)
  const passages = passagesForSource(source.id, allPassages)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker={TYPETIKETT[source.type]} title={source.title} status={source.status}>
        {source.originalTitle && <p className={styles.originalTitle}>{source.originalTitle}</p>}
      </Sidhuvud>
      <SourceMeta source={source} />
      <Description text={source.description} />
      {uncertainty.length > 0 && (
        <Section heading="Osäkerhet">
          {uncertainty.map((row) => (
            <p key={row} className={styles.description}>
              {row}
            </p>
          ))}
        </Section>
      )}
      {passages.length > 0 && (
        <Section heading="Passager">
          {passages.map((passage) => (
            <Passageblock key={passage.id} passage={passage} />
          ))}
        </Section>
      )}
      {source.libraryWork !== undefined && (
        <Section heading="Hela texten">
          <Link
            to="/bibliotek/verk/$workId"
            params={{ workId: source.libraryWork }}
            className={styles.row}
          >
            <span className={styles.rowTitle}>Läs hela texten</span>
            <span className={styles.chev}>›</span>
          </Link>
        </Section>
      )}
      <Section heading="Rum ur denna source">
        <RoomList
          rooms={roomsForSource(source.id, allRooms)}
          emptyMessage="Det finns inga färdiga rum ur källan ännu."
        />
      </Section>
    </div>
  )
}
