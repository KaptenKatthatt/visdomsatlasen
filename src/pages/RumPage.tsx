import { useState } from 'react'
import { NotesSheet } from '../components/NotesSheet'
import { ReadingSettingsButton } from '../components/ReadingSettingsButton'
import { TopBar } from '../components/TopBar'
import type { Rum } from '../content/redaktion/schema'
import { brukEtikett, hittaKalla, hittaRum, hittaTema, kallnamn, stycken } from '../lib/innehall'
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

/** Källdetaljen bakom namnet: verk, referens och bruksdeklaration —
 * synligt först på begäran (source-and-context.md, Source Visibility). */
const Kalldetalj = ({ rum }: { rum: Rum }) => {
  const relation = rum.källor.find((k) => k.primär) ?? rum.källor[0]
  const källa = relation ? hittaKalla(relation.källa) : undefined
  if (!relation || !källa) return null
  const meta = [källa.originalspråk, källa.ungefärligDatering].filter(Boolean).join(' · ')
  return (
    <>
      <p className={styles.detaljrad}>
        {källa.titel}
        {relation.referens ? `, ${relation.referens}` : ''}
        {meta ? ` · ${meta}` : ''}
      </p>
      <p className={styles.detaljrad}>{brukEtikett[relation.bruk]}</p>
      {källa.beskrivning && <p className={styles.detaljrad}>{källa.beskrivning}</p>}
    </>
  )
}

const Rumsavslut = ({ rum }: { rum: Rum }) => {
  const { sparadeRum, vaxlaSparatRum, notes, setNote } = useAtlas()
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
          value={notes[rum.id] ?? ''}
          onChange={(text) => setNote(rum.id, text)}
          onClose={() => setAnteckningÖppen(false)}
        />
      )}
    </>
  )
}

/** Läsrummet (reading-room.md): en text, en tanke, ett naturligt slut.
 * Inga rekommendationer, inget nästa rum. Rutten nås ännu inte från något
 * gränssnitt (tröskeln kommer i fas 4); rum som inte är publicerade märks
 * som utkast tills rumsvalet (fas 5) filtrerar på status. */
export const RumPage = ({ slug }: { slug: string }) => {
  const rum = hittaRum(slug)
  if (!rum) return <NotFoundNote subject="Rummet" />
  const tema = hittaTema(rum.teman[0] ?? '')
  return (
    <div className="screenReader">
      <TopBar right={<ReadingSettingsButton />} />
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
      {stycken(rum.kärna).map((stycke, i) => (
        <p key={i} className={styles.stycke}>
          {stycke}
        </p>
      ))}
      <div className={`dots ${styles.paus}`}>···</div>
      <p className={styles.tanke}>{rum.tankeAttBära}</p>
      <div className={styles.fragor}>
        {rum.reflektionsfrågor.map((fråga) => (
          <p key={fråga} className={styles.fraga}>
            {fråga}
          </p>
        ))}
      </div>
      <Rumsavslut rum={rum} />
    </div>
  )
}
