// Translation into Swedish via Ollama (Hermes gateway), the same transport as
// newsAggs llm.ts. Set TRANSLATE=off to skip it (e.g. local
// verification without Ollama) — the source text is then stored unchanged.

const ollamaUrl = (): string => process.env['OLLAMA_URL'] ?? 'http://127.0.0.1:11434/api/generate'
const ollamaModel = (): string => process.env['OLLAMA_MODEL'] ?? 'gemma4:31b-cloud'

const translationEnabled = (): boolean => process.env['TRANSLATE'] !== 'off'

// Remove any <think> block (even an unclosed one) before the response is used.
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

// A single Ollama call for a small block of lines. null if the call fails or
// returns the wrong number of lines (so no pairing is thrown off).
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
 * Translates lines into Swedish in small batches (so long paragraphs do not blow past
 * the model's token limit). If a batch fails, its source text is kept.
 * `translatedCount` = number of lines that actually changed — it captures both
 * batches that fell back and lines the model echoed untranslated, and is
 * the basis for the translation verification. With TRANSLATE=off nothing is translated.
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
