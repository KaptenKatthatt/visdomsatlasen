import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { NotesSheet } from '../components/NotesSheet'
import { ReadingSettingsButton } from '../components/ReadingSettingsButton'
import { TopBar } from '../components/TopBar'
import type { Source, SourcePassage, Room, Path } from '../content/editorial/schema'
import { roomsForPath } from '../lib/library'
import {
  allRooms,
  useLabel,
  findSource,
  findPassage,
  findRoom,
  findTheme,
  findPathBySlug,
  sourceName,
  uncertainties,
  paragraphs,
} from '../lib/content'
import { useAtlas } from '../lib/store'
import { report } from '../lib/telemetry'
import { useSidtitel } from '../lib/useSidtitel'
import { NotFoundNote } from './NotFoundNote'
import styles from './RumPage.module.css'

/** En rad i rummets kolofon: spärrade versaler med nedåtpil. Öppnas på place
 * och leder aldrig bort — pilen lovar fördjupning här, inte förflyttning. */
const Kolofonrad = ({
  label,
  öppen,
  onVaxla,
  detaljId,
  children,
}: {
  label: string
  öppen: boolean
  onVaxla: () => void
  detaljId: string
  children: React.ReactNode
}) => (
  <div>
    <button
      type="button"
      className={styles.kolofonrad}
      aria-expanded={öppen}
      aria-controls={detaljId}
      onClick={onVaxla}
    >
      {label} <span aria-hidden>{öppen ? '▴' : '▾'}</span>
    </button>
    <div id={detaljId} hidden={!öppen} className={styles.detalj}>
      {children}
    </div>
  </div>
)

// Bibliografiraden: verk, reference och härkomst (language · dating) i en följd.
const sourceRow = (source: Source, reference: string | undefined): string => {
  const title = [source.title, reference].filter(Boolean).join(', ')
  const origin = [source.originalLanguage, source.approximateDating].filter(Boolean).join(' · ')
  return [title, origin].filter(Boolean).join(' · ')
}

// Editionsraden syns bara när en passage anger edition (source-and-context.md,
// Translation Policy): edition och, för egen translation, ansvarig hand.
const editionsrad = (passage: SourcePassage | undefined): string | undefined => {
  if (!passage?.edition) return undefined
  const translation = passage.translator ? ` · translation ${passage.translator}` : ''
  return `Edition: ${passage.edition}${translation}`
}

type SourceRelation = Room['sources'][number]

// Relationerna grupperade per källpost i frontmatterordning, så att ett rum
// med flera nedslag i samma verk (t.ex. två bibelställen) får ett block med
// en osäkerhetsdeklaration och en »Om texten«-länk — inte upprepade.
const groupBySource = (relationer: SourceRelation[]): [Source, SourceRelation[]][] => {
  const grupper: [Source, SourceRelation[]][] = []
  for (const relation of relationer) {
    const befintlig = grupper.find(([source]) => source.id === relation.source)
    if (befintlig) {
      befintlig[1].push(relation)
      continue
    }
    const source = findSource(relation.source)
    if (source) grupper.push([source, [relation]])
  }
  return grupper
}

// En källas rader i detaljen: bibliografi + use + edition per relation,
// därefter källans osäkerhet en gång och länken till källsidan.
const Kallblock = ({ source, relationer }: { source: Source; relationer: SourceRelation[] }) => {
  const rows = [
    ...relationer.flatMap((relation) => {
      const passage = relation.passage ? findPassage(relation.passage) : undefined
      return [
        sourceRow(source, passage?.reference ?? relation.reference),
        useLabel[relation.use],
        editionsrad(passage),
      ]
    }),
    ...uncertainties(source),
  ].filter((rad): rad is string => Boolean(rad))
  return (
    <div className={styles.kallblock}>
      {rows.map((rad, i) => (
        <p key={`${rad}-${i}`} className={styles.detaljrad}>
          {rad}
        </p>
      ))}
      <Link to="/bibliotek/kalla/$slug" params={{ slug: source.slug }} className={styles.detaljlank}>
        Om texten
      </Link>
    </div>
  )
}

/** Källdetaljen bakom namnet: verk, reference, bruksdeklaration och ärlig
 * osäkerhet — synligt först på begäran (source-and-context.md, Source
 * Visibility). Håller sig bibliografisk; källans ord och full passagetext
 * bor på källsidan, dit »Om texten« leder efter ett medvetet val. Rum med
 * flera sources visar alla relationer, grupperade per källpost. */
const Kalldetalj = ({ rum }: { rum: Room }) => (
  <>
    {groupBySource(rum.sources).map(([source, relationer]) => (
      <Kallblock key={source.id} source={source} relationer={relationer} />
    ))}
  </>
)

// Kolofonens label: källans röst när rummet bygger på ett verk,
// »Källor« när det bygger på flera (första flerkällsrummet: Fas 12).
const kolofonetikett = (rum: Room, source: Source): string =>
  new Set(rum.sources.map((relation) => relation.source)).size > 1 ? 'Källor' : sourceName(source)

const Rumsavslut = ({ rum }: { rum: Room }) => {
  const { sparadeRum, vaxlaSparatRum, anteckningar, sattAnteckning, taBortAnteckning } = useAtlas()
  const [öppenRad, setÖppenRad] = useState<'source' | 'bakgrund' | null>(null)
  const [anteckningÖppen, setAnteckningÖppen] = useState(false)
  const primarySource = rum.sources.find((k) => k.primary) ?? rum.sources[0]
  const source = primarySource ? findSource(primarySource.source) : undefined
  const sparat = !!sparadeRum[rum.id]
  const toggle = (rad: 'source' | 'bakgrund') =>
    setÖppenRad((nuvarande) => (nuvarande === rad ? null : rad))
  return (
    <>
      <div className={styles.streck} />
      <div className={styles.kolofon}>
        {source && (
          <Kolofonrad
            label={kolofonetikett(rum, source)}
            öppen={öppenRad === 'source'}
            onVaxla={() => toggle('source')}
            detaljId="kalldetalj"
          >
            <Kalldetalj rum={rum} />
          </Kolofonrad>
        )}
        {rum.historicalContext && (
          <Kolofonrad
            label="Historisk bakgrund"
            öppen={öppenRad === 'bakgrund'}
            onVaxla={() => toggle('bakgrund')}
            detaljId="bakgrundsdetalj"
          >
            {paragraphs(rum.historicalContext).map((stycke, i) => (
              <p key={i} className={styles.detaljrad}>
                {stycke}
              </p>
            ))}
          </Kolofonrad>
        )}
      </div>
      <div className={styles.avslut}>
        <button
          type="button"
          className={styles.avslutshandling}
          aria-pressed={sparat}
          onClick={() => vaxlaSparatRum(rum.id)}
        >
          {sparat ? 'Sparad' : 'Spara'}
        </button>
        <button
          type="button"
          className={styles.avslutshandling}
          onClick={() => setAnteckningÖppen(true)}
        >
          Skriv ner en tanke
        </button>
      </div>
      {anteckningÖppen && (
        <NotesSheet
          title={rum.title}
          value={anteckningar[rum.id]?.text ?? ''}
          onChange={(text) => sattAnteckning('rum', rum.id, text)}
          onDelete={() => taBortAnteckning(rum.id)}
          onClose={() => setAnteckningÖppen(false)}
        />
      )}
    </>
  )
}

/** Vandringens fot: syns bara när rummet läses inom en vandring (sökparametern
 * `vandring`). Två likvärdiga, stilla val — aldrig autoplay, aldrig ett »rätt«
 * val (paths.md, Moving Between Stops). Sista rummet får den valfria avslutande
 * reflektionen i stället, utan gratulation eller förloppsmått. */
const Vandringsfot = ({ vandring, rum }: { vandring: Path; rum: Room }) => {
  const navigate = useNavigate()
  const order = roomsForPath(vandring, allRooms)
  const index = order.findIndex((ettRum) => ettRum.id === rum.id)
  if (index === -1) return null
  const next = order[index + 1]
  if (!next) {
    if (vandring.closingReflection === undefined) return null
    return (
      <div className={styles.vandringsslut}>
        {paragraphs(vandring.closingReflection).map((stycke, i) => (
          <p key={i} className={styles.vandringsslutStycke}>
            {stycke}
          </p>
        ))}
      </div>
    )
  }
  // »Stanna här« tömmer vandringskontexten: foten försvinner och rummet blir
  // fristående igen. Läsaren stannar kvar — inget navigeras bort.
  const stanna = () =>
    navigate({ to: '/rum/$slug', params: { slug: rum.slug }, search: {}, replace: true })
  return (
    <div className={styles.vandring}>
      <Link
        to="/rum/$slug"
        params={{ slug: next.slug }}
        search={{ vandring: vandring.slug }}
        className={styles.vandringshandling}
      >
        Fortsätt vandringen
      </Link>
      <button type="button" className={styles.vandringshandling} onClick={stanna}>
        Stanna här
      </button>
    </div>
  )
}

/** Skriver orienteringsminnet: senast lästa rum (så rumsvalet undviker
 * omedelbar upprepning) och senast öppnade rum i vandringen (så läsaren kan
 * återvända). Bara publicerat registreras — utkast som förhandsgranskas via
 * direkt länk ska varken tränga ut publicerade rum ur det lilla fönstret eller
 * skriva vandringsminne (paths.md: minnet är orientering, aldrig förlopp). */
const useRumsminne = (rum: Room | undefined, vandring: Path | undefined): void => {
  const { registreraLastRum, registreraVandringsplats } = useAtlas()
  const publishedRoomId = rum?.status === 'published' ? rum.id : undefined
  const pathPositionId =
    vandring?.status === 'published' &&
    publishedRoomId !== undefined &&
    vandring.rum.includes(publishedRoomId)
      ? vandring.id
      : undefined
  useEffect(() => {
    if (publishedRoomId !== undefined) registreraLastRum(publishedRoomId)
  }, [publishedRoomId, registreraLastRum])
  useEffect(() => {
    if (pathPositionId !== undefined && publishedRoomId !== undefined)
      registreraVandringsplats(pathPositionId, publishedRoomId)
  }, [pathPositionId, publishedRoomId, registreraVandringsplats])
}

/** Fas 14: fångar brutna källrelationer — ett rum som pekar på en source eller
 * passage som inte kan slås upp. Build-grinden (check:content) ska hindra det
 * för publicerat innehåll, så detta är ett skyddsnät mot drift/regressions.
 * Loggar bara id:n, aldrig text. */
const useRelationskontroll = (rum: Room | undefined): void => {
  useEffect(() => {
    if (!rum) return
    for (const relation of rum.sources) {
      if (!findSource(relation.source))
        report({ type: 'bruten-kallalank', från: rum.id, till: relation.source })
      else if (relation.passage !== undefined && !findPassage(relation.passage))
        report({
          type: 'ogiltig-innehallsrelation',
          slag: 'passage',
          från: rum.id,
          reference: relation.passage,
        })
    }
  }, [rum])
}

/** Läsrummet (reading-room.md): en text, en tanke, ett naturligt slut.
 * Inga rekommendationer, inget nästa rum. Tröskeln öppnar hit via rumsvalet,
 * som bara väljer publicerade rum; utkast nås märkta via direkt länk och
 * fungerar som redaktionens granskningsvy. Sökparametern `vandringSlug` sätts
 * bara när rummet nås inifrån en vandring och styr vandringsfoten. */
export const RumPage = ({ slug, vandringSlug }: { slug: string; vandringSlug?: string }) => {
  const rum = findRoom(slug)
  const vandring = vandringSlug !== undefined ? findPathBySlug(vandringSlug) : undefined
  useRumsminne(rum, vandring)
  useRelationskontroll(rum)
  useSidtitel(rum?.title)
  if (!rum) return <NotFoundNote subject="Rummet" />
  const tema = findTheme(rum.themes[0] ?? '')
  return (
    <div className="screenReader">
      <TopBar right={<ReadingSettingsButton />} />
      <section className={styles.sektion}>
        <header className={styles.huvud}>
          <div className="kicker">
            {tema?.label ?? ''}
            {rum.status !== 'published' && ' · Utkast'}
          </div>
          <h1 className={styles.title}>{rum.title}</h1>
        </header>
        {paragraphs(rum.opening).map((stycke, i) => (
          <p key={i} className={styles.stycke}>
            {stycke}
          </p>
        ))}
        <div className={`dots ${styles.paus}`}>···</div>
      </section>
      <section className={styles.sektion}>
        {paragraphs(rum.core).map((stycke, i) => (
          <p key={i} className={styles.stycke}>
            {stycke}
          </p>
        ))}
        <div className={`dots ${styles.paus}`}>···</div>
      </section>
      <p className={styles.tanke}>{rum.thoughtToCarry}</p>
      <div className={styles.fragor}>
        {rum.reflectionQuestions.map((fråga) => (
          <p key={fråga} className={styles.fraga}>
            {fråga}
          </p>
        ))}
      </div>
      <Rumsavslut rum={rum} />
      {vandring !== undefined && <Vandringsfot vandring={vandring} rum={rum} />}
    </div>
  )
}
