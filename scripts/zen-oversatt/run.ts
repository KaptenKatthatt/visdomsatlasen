#!/usr/bin/env node
// Produktionskörning av den rekommenderade översättningspipelinen
// (docs/research/zen-oversattningsflode.md §6) för de fyra utvalda zenpassagerna.
// Per passage: flöde C (analys -> svensk translation ur analysen) med
// primärmodellen, sedan korsmodellsgranskning av C-översättningen. Leveranskontroll
// per steg: om det svenska steget trunkerar (saknar rubriker) görs omförsök och,
// i sista hand, ett direkt A-flöde som reserv (rapportens rekommendation).
// Återupptagbar: klara passager (radata/<id>.json finns) hoppas över.
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chat, probaModell, visaModell, listaModeller } from '../zen-experiment/ollama'
import { promptA, promptC1, promptC2, promptGranska, systemSv } from '../zen-experiment/prompter'
import { lasPassager, type Passage, type Steg } from '../zen-experiment/typer'

const PASSAGER = 'docs/research/zen-experiment/passages'
const RADATA = 'docs/oversattningar/radata'
const MAL = ['p1-hakuin-zazen-wasan', 'p2-mumonkan-fall7', 'p3-dogen-genjokoan', 'p5-dogen-uji']

// Primärmodell (translator) och granskare enligt rapportens §1: glm-5.2 översätter,
// deepseek-v4-pro granskar (gemma4 som leveranssäker reserv). Första körbara väljs.
const OVERSATTARE = ['glm-5.2:cloud', 'glm-5.1:cloud', 'deepseek-v4-pro:cloud']
const GRANSKARE = ['deepseek-v4-pro:cloud', 'gemma4:31b-cloud', 'glm-5.2:cloud']

const SVENSKA_RUBRIKER = [
  '## ORDAGRANN ÖVERSÄTTNING',
  '## LÄSBAR ÖVERSÄTTNING',
  '## TVETYDIGHETER',
  '## TERMINOLOGIBESLUT',
  '## KONFIDENS',
]

type Flode = 'C' | 'A-reserv'

type Oversattning = {
  passageId: string
  oversattare: string
  flode: Flode
  steg: Steg[]
  granskare: string
  granskning: Steg | null
  created: string
}

const harAllaRubriker = (text: string, rubriker: string[]): boolean =>
  rubriker.every((rubrik) => text.includes(rubrik))

const chatSteg = async (name: string, modell: string, prompt: string): Promise<Steg> => {
  const svar = await chat(modell, systemSv, prompt)
  return { name, system: systemSv, prompt, svar: svar.text, ms: svar.ms }
}

// Flöde C med leveranskontroll: analysera, översätt, och om den svenska texten saknar
// någon begärd rubrik (tecken på trunkering) görs ett omförsök; håller den inte heller
// då faller vi tillbaka på det leveranssäkraste direkta A-flödet och märker det.
const oversattPassage = async (passage: Passage, oversattare: string): Promise<{ flode: Flode; steg: Steg[] }> => {
  const analys = await chatSteg('analys', oversattare, promptC1(passage))
  for (let forsok = 0; forsok < 2; forsok++) {
    const svensk = await chatSteg('svensk-fran-analys', oversattare, promptC2(passage, analys.svar))
    if (harAllaRubriker(svensk.svar, SVENSKA_RUBRIKER)) return { flode: 'C', steg: [analys, svensk] }
    console.log(`  leveranskontroll: svenskt steg ofullständigt (försök ${forsok + 1})`)
  }
  console.log('  faller tillbaka på flöde A (direkt) efter trunkerat C-flöde')
  const direkt = await chatSteg('direkt-reserv', oversattare, promptA(passage))
  return { flode: 'A-reserv', steg: [analys, direkt] }
}

const korPassage = async (passage: Passage, oversattare: string, granskare: string): Promise<void> => {
  const fil = join(RADATA, `${passage.id}.json`)
  if (existsSync(fil)) {
    console.log(`  hoppar över (finns): ${passage.id}`)
    return
  }
  const { flode, steg } = await oversattPassage(passage, oversattare)
  const svensk = steg.at(-1)?.svar ?? ''
  const granskning = await chatSteg(`granskning-av-${oversattare}`, granskare, promptGranska(passage, svensk))
  const resultat: Oversattning = {
    passageId: passage.id,
    oversattare,
    flode,
    steg,
    granskare,
    granskning,
    created: new Date().toISOString(),
  }
  writeFileSync(fil, `${JSON.stringify(resultat, null, 2)}\n`)
  console.log(`  klar: ${fil} (flöde ${flode})`)
}

const valjModell = async (kandidater: string[], probstatus: Record<string, boolean>): Promise<string | null> => {
  for (const kandidat of kandidater) {
    const ok = await probaModell(kandidat)
    probstatus[kandidat] = ok
    console.log(`  prob ${kandidat}: ${ok ? 'körbar' : 'ej körbar'}`)
    if (ok) return kandidat
  }
  return null
}

const skrivModellDokumentation = async (
  oversattare: string,
  granskare: string,
  probstatus: Record<string, boolean>,
  kanda: string[],
): Promise<void> => {
  const valda = [...new Set([oversattare, granskare])]
  const metadata = await Promise.all(valda.map(async (modell) => [modell, await visaModell(modell)] as const))
  writeFileSync(
    join(RADATA, 'modeller.json'),
    `${JSON.stringify(
      { datum: new Date().toISOString(), oversattare, granskare, probstatus, kanda, metadata: Object.fromEntries(metadata) },
      null,
      2,
    )}\n`,
  )
}

const main = async (): Promise<void> => {
  mkdirSync(RADATA, { recursive: true })
  const passager = lasPassager(PASSAGER).filter((passage) => MAL.includes(passage.id))
  console.log(`${passager.length} målpassager inlästa: ${passager.map((passage) => passage.id).join(', ')}`)

  const kanda = await listaModeller().catch(() => [] as string[])
  console.log(`Gatewayens kända modeller: ${kanda.join(', ') || '(inga)'}`)
  const probstatus: Record<string, boolean> = {}
  const oversattare = await valjModell(OVERSATTARE, probstatus)
  const granskare = await valjModell(GRANSKARE, probstatus)
  if (oversattare === null) throw new Error('Ingen körbar översättarmodell hittades på gatewayen.')
  if (granskare === null) throw new Error('Ingen körbar granskarmodell hittades på gatewayen.')
  console.log(`Översättare: ${oversattare} · granskare: ${granskare}`)
  await skrivModellDokumentation(oversattare, granskare, probstatus, kanda)

  for (const passage of passager) {
    console.log(`${passage.id}`)
    try {
      await korPassage(passage, oversattare, granskare)
    } catch (fel) {
      console.error(`  FEL: ${passage.id}: ${fel instanceof Error ? fel.message : String(fel)}`)
    }
  }
  console.log('Produktionskörningen klar.')
}

main().catch((fel: unknown) => {
  console.error('[zen-oversatt] misslyckades:', fel instanceof Error ? fel.message : String(fel))
  process.exit(1)
})
