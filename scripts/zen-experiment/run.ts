#!/usr/bin/env node
// Kör zen-översättningsexperimentet mot Hermes-gatewayen (Ollama).
// Läser passager ur docs/research/zen-experiment/passages/, kör flöde A–D för
// varje tillgänglig modell och skriver råresultat till .../results/.
// Körningen är återupptagbar: befintliga resultatfiler hoppas över.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chat, listaModeller, probaModell, visaModell } from './ollama'
import { promptA, promptB1, promptB2, promptC1, promptC2, promptD, systemEn, systemSv } from './prompter'
import { lasPassager, type Passage, type Resultat, type Steg } from './typer'

const ROT = 'docs/research/zen-experiment'

// Kandidater per familj i prioritetsordning; första körbara tagg per familj väljs.
// Coder-varianter utesluts medvetet. gemma4 är dagens produktionsbaslinje (ingest).
const KANDIDATER: Record<string, string[]> = {
  qwen: ['qwen3.6:235b-cloud', 'qwen3.6:cloud', 'qwen3.6:35b-cloud', 'qwen3:235b-cloud', 'qwen3.5:cloud', 'qwen3:cloud'],
  deepseek: ['deepseek-v3.2:cloud', 'deepseek-v3.2:671b-cloud', 'deepseek-v3.1:671b-cloud', 'deepseek-v3:671b-cloud', 'deepseek-r1:671b-cloud'],
  // Coder-varianten sist: väljs bara om ingen generalistmodell finns (redovisas i rapporten).
  alternativ: ['glm-5.1:cloud', 'glm-5.2:cloud', 'glm-4.6:cloud', 'kimi-k2.6:cloud', 'kimi-k2.7:cloud', 'kimi-k2:1t-cloud', 'minimax-m3:cloud', 'kimi-k2.7-code:cloud'],
  baslinje: ['gemma4:31b-cloud', 'gpt-oss:120b-cloud'],
}

const resultatFil = (passageId: string, modell: string, flode: Resultat['flode']): string =>
  join(ROT, 'results', `${passageId}--${modell.replace(/[:/]/g, '_')}--${flode}.json`)

const sparaResultat = (resultat: Resultat): void => {
  const fil = resultatFil(resultat.passageId, resultat.modell, resultat.flode)
  writeFileSync(fil, `${JSON.stringify(resultat, null, 2)}\n`)
  console.log(`  klar: ${fil} (${resultat.steg.reduce((sum, steg) => sum + steg.ms, 0)} ms)`)
}

const steg = async (namn: string, modell: string, system: string, prompt: string, maxTokens = 4096): Promise<Steg> => {
  const svar = await chat(modell, system, prompt, maxTokens)
  return { namn, system, prompt, svar: svar.text, ms: svar.ms }
}

const flodeA = async (passage: Passage, modell: string): Promise<Steg[]> => [
  await steg('direkt', modell, systemSv, promptA(passage)),
]

const flodeB = async (passage: Passage, modell: string): Promise<Steg[]> => {
  const engelsk = await steg('engelsk-arbetsoversattning', modell, systemEn, promptB1(passage), 3072)
  const svensk = await steg('svensk-fran-original-plus-engelska', modell, systemSv, promptB2(passage, engelsk.svar))
  return [engelsk, svensk]
}

const flodeC = async (passage: Passage, modell: string): Promise<Steg[]> => {
  const analys = await steg('analys', modell, systemSv, promptC1(passage))
  const svensk = await steg('svensk-fran-analys', modell, systemSv, promptC2(passage, analys.svar))
  return [analys, svensk]
}

const lasSvar = (passage: Passage, modell: string, flode: Resultat['flode']): string | null => {
  const fil = resultatFil(passage.id, modell, flode)
  if (!existsSync(fil)) return null
  const resultat = JSON.parse(readFileSync(fil, 'utf8')) as Resultat
  return resultat.steg.at(-1)?.svar ?? null
}

// Flöde D: granskaren (en annan modell) jämför den granskade modellens A- och C-utdata.
const flodeD = async (passage: Passage, granskare: string, granskad: string): Promise<Steg[] | null> => {
  const svarA = lasSvar(passage, granskad, 'A')
  const svarC = lasSvar(passage, granskad, 'C')
  if (svarA === null || svarC === null) return null
  return [await steg(`granskar-${granskad}`, granskare, systemSv, promptD(passage, svarA, svarC))]
}

const korFlode = async (
  passage: Passage,
  modell: string,
  flode: Resultat['flode'],
  arbete: () => Promise<Steg[] | null>,
): Promise<void> => {
  if (existsSync(resultatFil(passage.id, modell, flode))) {
    console.log(`  hoppar över (finns): ${passage.id} ${modell} ${flode}`)
    return
  }
  try {
    const stegLista = await arbete()
    if (stegLista === null) {
      console.log(`  hoppar över (saknar underlag): ${passage.id} ${modell} ${flode}`)
      return
    }
    sparaResultat({ passageId: passage.id, modell, flode, steg: stegLista, skapad: new Date().toISOString() })
  } catch (fel) {
    console.error(`  FEL: ${passage.id} ${modell} ${flode}: ${fel instanceof Error ? fel.message : String(fel)}`)
  }
}

// Första körbara kandidaten i familjen; probstatus fylls på för dokumentation.
const probaFamilj = async (kandidater: string[], probstatus: Record<string, boolean>): Promise<string | null> => {
  for (const kandidat of kandidater) {
    const ok = await probaModell(kandidat)
    probstatus[kandidat] = ok
    console.log(`  prob ${kandidat}: ${ok ? 'körbar' : 'ej körbar'}`)
    if (ok) return kandidat
  }
  return null
}

const skrivModellDokumentation = async (valda: string[], probstatus: Record<string, boolean>, kanda: string[]): Promise<void> => {
  const metadata = await Promise.all(valda.map(async (modell) => [modell, await visaModell(modell)] as const))
  writeFileSync(
    join(ROT, 'results', 'modeller.json'),
    `${JSON.stringify({ datum: new Date().toISOString(), valda, probstatus, kanda, metadata: Object.fromEntries(metadata) }, null, 2)}\n`,
  )
}

// Prova kandidaterna och dokumentera exakt vad som var körbart på abonnemanget.
const valjModeller = async (): Promise<string[]> => {
  const kanda = await listaModeller().catch(() => [] as string[])
  console.log(`Gatewayens kända modeller: ${kanda.join(', ') || '(inga)'}`)
  const valda: string[] = []
  const probstatus: Record<string, boolean> = {}
  for (const [familj, kandidater] of Object.entries(KANDIDATER)) {
    const vald = await probaFamilj(kandidater, probstatus)
    if (vald !== null) valda.push(vald)
    else console.log(`  familj ${familj}: ingen körbar kandidat`)
  }
  await skrivModellDokumentation(valda, probstatus, kanda)
  return valda
}

const main = async (): Promise<void> => {
  mkdirSync(join(ROT, 'results'), { recursive: true })
  const passager = lasPassager(join(ROT, 'passages'))
  console.log(`${passager.length} passager inlästa`)
  const modeller = await valjModeller()
  if (modeller.length === 0) throw new Error('Ingen körbar modell hittades på gatewayen.')
  console.log(`Valda modeller: ${modeller.join(', ')}`)

  for (const passage of passager) {
    for (const modell of modeller) {
      console.log(`${passage.id} × ${modell}`)
      await korFlode(passage, modell, 'A', () => flodeA(passage, modell))
      await korFlode(passage, modell, 'B', () => flodeB(passage, modell))
      await korFlode(passage, modell, 'C', () => flodeC(passage, modell))
    }
    // Korsgranskning i ring: modell i granskas av modell i+1.
    for (let i = 0; i < modeller.length; i++) {
      const granskad = modeller[i]
      const granskare = modeller[(i + 1) % modeller.length]
      if (granskad === undefined || granskare === undefined || granskare === granskad) continue
      await korFlode(passage, granskad, 'D', () => flodeD(passage, granskare, granskad))
    }
  }
  console.log('Experimentet klart.')
}

main().catch((fel: unknown) => {
  console.error('[zen-experiment] misslyckades:', fel instanceof Error ? fel.message : String(fel))
  process.exit(1)
})
