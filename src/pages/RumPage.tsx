import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { NotesSheet } from '../components/NotesSheet'
import { ReadingSettingsButton } from '../components/ReadingSettingsButton'
import { TopBar } from '../components/TopBar'
import type { Kalla, Kallpassage, Rum, Vandring } from '../content/redaktion/schema'
import { rumForVandring } from '../lib/bibliotek'
import {
  allaRum,
  brukEtikett,
  hittaKalla,
  hittaPassage,
  hittaRum,
  hittaTema,
  hittaVandringViaSlug,
  kallnamn,
  osakerheter,
  stycken,
} from '../lib/innehall'
import { useAtlas } from '../lib/store'
import { NotFoundNote } from './NotFoundNote'
import styles from './RumPage.module.css'

/** En rad i rummets kolofon: spärrade versaler med nedåtpil. Öppnas på plats
 * och leder aldrig bort — pilen lovar fördjupning här, inte förflyttning. */
const Kolofonrad = ({
  etikett,
  öppen,
  onVaxla,
  detaljId,
  children,
}: {
  etikett: string
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
      {etikett} <span aria-hidden>{öppen ? '▴' : '▾'}</span>
    </button>
    <div id={detaljId} hidden={!öppen} className={styles.detalj}>
      {children}
    </div>
  </div>
)

// Bibliografiraden: verk, referens och härkomst (språk · datering) i en följd.
const kallrad = (källa: Kalla, referens: string | undefined): string => {
  const titel = [källa.titel, referens].filter(Boolean).join(', ')
  const härkomst = [källa.originalspråk, källa.ungefärligDatering].filter(Boolean).join(' · ')
  return [titel, härkomst].filter(Boolean).join(' · ')
}

// Editionsraden syns bara när en passage anger utgåva (source-and-context.md,
// Translation Policy): edition och, för egen översättning, ansvarig hand.
const editionsrad = (passage: Kallpassage | undefined): string | undefined => {
  if (!passage?.utgåva) return undefined
  const översättning = passage.översättare ? ` · översättning ${passage.översättare}` : ''
  return `Edition: ${passage.utgåva}${översättning}`
}

/** Källdetaljen bakom namnet: verk, referens, bruksdeklaration och ärlig
 * osäkerhet — synligt först på begäran (source-and-context.md, Source
 * Visibility). Håller sig bibliografisk; källans ord och full passagetext
 * bor på källsidan, dit »Om texten« leder efter ett medvetet val. */
const Kalldetalj = ({ rum }: { rum: Rum }) => {
  const relation = rum.källor.find((k) => k.primär) ?? rum.källor[0]
  const källa = relation ? hittaKalla(relation.källa) : undefined
  if (!relation || !källa) return null
  const passage = relation.passage ? hittaPassage(relation.passage) : undefined
  const rader = [
    kallrad(källa, passage?.referens ?? relation.referens),
    brukEtikett[relation.bruk],
    editionsrad(passage),
    ...osakerheter(källa),
  ].filter((rad): rad is string => Boolean(rad))
  return (
    <>
      {rader.map((rad) => (
        <p key={rad} className={styles.detaljrad}>
          {rad}
        </p>
      ))}
      <Link to="/bibliotek/kalla/$slug" params={{ slug: källa.slug }} className={styles.detaljlank}>
        Om texten
      </Link>
    </>
  )
}

const Rumsavslut = ({ rum }: { rum: Rum }) => {
  const { sparadeRum, vaxlaSparatRum, anteckningar, sattAnteckning, taBortAnteckning } = useAtlas()
  const [öppenRad, setÖppenRad] = useState<'källa' | 'bakgrund' | null>(null)
  const [anteckningÖppen, setAnteckningÖppen] = useState(false)
  const primärKälla = rum.källor.find((k) => k.primär) ?? rum.källor[0]
  const källa = primärKälla ? hittaKalla(primärKälla.källa) : undefined
  const sparat = !!sparadeRum[rum.id]
  const vaxla = (rad: 'källa' | 'bakgrund') =>
    setÖppenRad((nuvarande) => (nuvarande === rad ? null : rad))
  return (
    <>
      <div className={styles.streck} />
      <div className={styles.kolofon}>
        {källa && (
          <Kolofonrad
            etikett={kallnamn(källa)}
            öppen={öppenRad === 'källa'}
            onVaxla={() => vaxla('källa')}
            detaljId="kalldetalj"
          >
            <Kalldetalj rum={rum} />
          </Kolofonrad>
        )}
        {rum.historiskKontext && (
          <Kolofonrad
            etikett="Historisk bakgrund"
            öppen={öppenRad === 'bakgrund'}
            onVaxla={() => vaxla('bakgrund')}
            detaljId="bakgrundsdetalj"
          >
            {stycken(rum.historiskKontext).map((stycke, i) => (
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
          title={rum.titel}
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
const Vandringsfot = ({ vandring, rum }: { vandring: Vandring; rum: Rum }) => {
  const navigate = useNavigate()
  const ordning = rumForVandring(vandring, allaRum)
  const index = ordning.findIndex((ettRum) => ettRum.id === rum.id)
  if (index === -1) return null
  const nästa = ordning[index + 1]
  if (!nästa) {
    if (vandring.avslutandeReflektion === undefined) return null
    return (
      <div className={styles.vandringsslut}>
        {stycken(vandring.avslutandeReflektion).map((stycke, i) => (
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
        params={{ slug: nästa.slug }}
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
const useRumsminne = (rum: Rum | undefined, vandring: Vandring | undefined): void => {
  const { registreraLastRum, registreraVandringsplats } = useAtlas()
  const publiceratRumId = rum?.status === 'publicerad' ? rum.id : undefined
  const vandringsplatsId =
    vandring?.status === 'publicerad' &&
    publiceratRumId !== undefined &&
    vandring.rum.includes(publiceratRumId)
      ? vandring.id
      : undefined
  useEffect(() => {
    if (publiceratRumId !== undefined) registreraLastRum(publiceratRumId)
  }, [publiceratRumId, registreraLastRum])
  useEffect(() => {
    if (vandringsplatsId !== undefined && publiceratRumId !== undefined)
      registreraVandringsplats(vandringsplatsId, publiceratRumId)
  }, [vandringsplatsId, publiceratRumId, registreraVandringsplats])
}

/** Läsrummet (reading-room.md): en text, en tanke, ett naturligt slut.
 * Inga rekommendationer, inget nästa rum. Tröskeln öppnar hit via rumsvalet,
 * som bara väljer publicerade rum; utkast nås märkta via direkt länk och
 * fungerar som redaktionens granskningsvy. Sökparametern `vandringSlug` sätts
 * bara när rummet nås inifrån en vandring och styr vandringsfoten. */
export const RumPage = ({ slug, vandringSlug }: { slug: string; vandringSlug?: string }) => {
  const rum = hittaRum(slug)
  const vandring = vandringSlug !== undefined ? hittaVandringViaSlug(vandringSlug) : undefined
  useRumsminne(rum, vandring)
  if (!rum) return <NotFoundNote subject="Rummet" />
  const tema = hittaTema(rum.teman[0] ?? '')
  return (
    <div className="screenReader">
      <TopBar right={<ReadingSettingsButton />} />
      <section className={styles.sektion}>
        <header className={styles.huvud}>
          <div className="kicker">
            {tema?.etikett ?? ''}
            {rum.status !== 'publicerad' && ' · Utkast'}
          </div>
          <h1 className={styles.titel}>{rum.titel}</h1>
        </header>
        {stycken(rum.öppning).map((stycke, i) => (
          <p key={i} className={styles.stycke}>
            {stycke}
          </p>
        ))}
        <div className={`dots ${styles.paus}`}>···</div>
      </section>
      <section className={styles.sektion}>
        {stycken(rum.kärna).map((stycke, i) => (
          <p key={i} className={styles.stycke}>
            {stycke}
          </p>
        ))}
        <div className={`dots ${styles.paus}`}>···</div>
      </section>
      <p className={styles.tanke}>{rum.tankeAttBära}</p>
      <div className={styles.fragor}>
        {rum.reflektionsfrågor.map((fråga) => (
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
