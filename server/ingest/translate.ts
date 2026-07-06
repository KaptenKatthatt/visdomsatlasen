// Översättning till svenska via Ollama (Hermes-gateway), samma transport som
// newsAggs llm.ts. Sätt TRANSLATE=off för att hoppa över (t.ex. lokal
// verifiering utan Ollama) — då lagras källtexten oförändrad.

const ollamaUrl = (): string => process.env['OLLAMA_URL'] ?? 'http://127.0.0.1:11434/api/generate'
const ollamaModel = (): string => process.env['OLLAMA_MODEL'] ?? 'gemma4:31b-cloud'

const translationEnabled = (): boolean => process.env['TRANSLATE'] !== 'off'

// Ta bort ett eventuellt <think>-block (även oavslutat) innan svaret används.
const stripThink = (text: string): string =>
  text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<think>[\s\S]*$/g, '')
    .trim()

const callOllama = async (prompt: string): Promise<string> => {
  const response = await fetch(ollamaUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel(),
      prompt,
      stream: false,
      options: { temperature: 0.2, num_predict: 3072 },
    }),
    signal: AbortSignal.timeout(180000),
  })
  if (!response.ok) throw new Error(`Ollama ${response.status}`)
  const data = (await response.json()) as { response?: string }
  return stripThink(data.response ?? '')
}

const buildPrompt = (lines: string[]): string => {
  const numbered = lines.map((line, i) => `${i + 1}. ${line}`).join('\n')
  return `Du översätter andlig litteratur till svenska. Översätt varje numrerad rad nedan. Behåll exakt samma numrering och lika många rader — en översatt rad per numrerad rad, inga tillägg, ingen kommentar.\n\n${numbered}`
}

// Ett Ollama-anrop för ett litet block rader. null om anropet misslyckas eller
// ger fel radantal (så inget par förskjuts).
const translateBlock = async (lines: string[]): Promise<string[] | null> => {
  try {
    const raw = await callOllama(buildPrompt(lines))
    const out = raw
      .split('\n')
      .map((line) => line.replace(/^\s*\d+[.)]\s?/, '').trim())
      .filter((line) => line.length > 0)
    return out.length === lines.length ? out : null
  } catch {
    return null
  }
}

export type Translation = { lines: string[]; translatedCount: number }

/**
 * Översätter rader till svenska i småbatchar (så långa stycken inte spränger
 * modellens tokengräns). Misslyckas en batch behålls dess källtext.
 * `translatedCount` = antal rader som faktiskt ändrades — det fångar både
 * batchar som föll tillbaka och rader modellen ekade oöversatta, och är
 * underlaget för översättningsverifieringen. Med TRANSLATE=off översätts inget.
 */
export const translateMany = async (lines: string[], batchSize = 8): Promise<Translation> => {
  if (!translationEnabled() || lines.length === 0) return { lines, translatedCount: 0 }
  const out: string[] = []
  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, i + batchSize)
    const done = await translateBlock(batch)
    out.push(...(done ?? batch))
  }
  const translatedCount = out.filter((line, i) => line !== lines[i]).length
  return { lines: out, translatedCount }
}
