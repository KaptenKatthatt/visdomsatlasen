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

// Översätt ett block rader (en rad in → en rad ut).
const translateBlock = async (lines: string[]): Promise<string[]> => {
  const raw = await callOllama(buildPrompt(lines))
  return raw
    .split('\n')
    .map((line) => line.replace(/^\s*\d+[.)]\s?/, '').trim())
    .filter((line) => line.length > 0)
}

/**
 * Översätter rader till svenska. Returnerar `null` om ingen översättning skedde
 * — antingen för att den är avstängd, eller för att anropet misslyckades / gav
 * fel radantal. Anroparen behåller då originaltexten och markerar verket som
 * ej översatt, så engelska aldrig märks som färdig svensk översättning.
 */
export const translateLines = async (lines: string[]): Promise<string[] | null> => {
  if (!translationEnabled() || lines.length === 0) return null
  try {
    const out = await translateBlock(lines)
    return out.length === lines.length ? out : null
  } catch {
    return null
  }
}
