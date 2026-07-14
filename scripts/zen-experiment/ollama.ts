// Ollama-transport för experimentet. Samma gateway (Hermes) som server/ingest/translate.ts,
// men via /api/chat och med basadress i OLLAMA_HOST i stället för full URL.

const bas = (): string => process.env['OLLAMA_HOST'] ?? 'http://127.0.0.1:11434'

// Ta bort ett eventuellt <think>-block (även oavslutat) innan svaret används.
const stripThink = (text: string): string =>
  text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<think>[\s\S]*$/g, '')
    .trim()

type ChatRespons = { message?: { content?: string } }

const chatEnGang = async (modell: string, system: string, prompt: string, maxTokens: number): Promise<string> => {
  const respons = await fetch(`${bas()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modell,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      stream: false,
      options: { temperature: 0.2, num_predict: maxTokens },
    }),
    signal: AbortSignal.timeout(600000),
  })
  if (!respons.ok) throw new Error(`Ollama ${respons.status}: ${await respons.text()}`)
  const data = (await respons.json()) as ChatRespons
  return stripThink(data.message?.content ?? '')
}

export type ChatSvar = { text: string; ms: number }

// Ett chatt-anrop med två omförsök (backoff). Tomt svar räknas som fel: resonerande
// modeller kan bränna hela tokenbudgeten på ett <think>-block som stripThink tar bort
// (hände i körning 3 med num_predict 4096). Höjt i steg: 4096→16384→20480→32768, eftersom
// de resonerande flaggskeppen (deepseek-v4-pro, qwen3.5:397b, glm-5.2) trunkerade de
// analystunga C-flödena och notrika B-flödena även vid 20480.
export const chat = async (modell: string, system: string, prompt: string, maxTokens = 32768): Promise<ChatSvar> => {
  let senasteFel: unknown = null
  for (let forsok = 0; forsok < 3; forsok++) {
    const start = Date.now()
    try {
      const text = await chatEnGang(modell, system, prompt, maxTokens)
      if (text.length === 0) throw new Error('tomt svar efter think-strippning')
      return { text, ms: Date.now() - start }
    } catch (fel) {
      senasteFel = fel
      await new Promise((klar) => setTimeout(klar, 2000 * (forsok + 1)))
    }
  }
  throw new Error(`chat(${modell}) gav upp: ${senasteFel instanceof Error ? senasteFel.message : String(senasteFel)}`)
}

type TagsRespons = { models?: { name?: string }[] }

// Modeller som gatewayen redan känner till (pullade cloud-modeller syns här).
export const listaModeller = async (): Promise<string[]> => {
  const respons = await fetch(`${bas()}/api/tags`, { signal: AbortSignal.timeout(30000) })
  if (!respons.ok) throw new Error(`Ollama /api/tags ${respons.status}`)
  const data = (await respons.json()) as TagsRespons
  return (data.models ?? []).map((modell) => modell.name ?? '').filter((namn) => namn.length > 0)
}

// Cloud-modeller måste pullas (registreras hos daemonen) innan API-anrop fungerar —
// CLI:t auto-pullar men API:t ger 404 (docs.ollama.com/cloud). Pull av en cloud-modell
// hämtar bara ett manifest, ingen vikt-nedladdning och ingen GPU-kvot.
const pullModell = async (modell: string): Promise<void> => {
  const respons = await fetch(`${bas()}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modell, stream: false }),
    signal: AbortSignal.timeout(120000),
  })
  if (!respons.ok) throw new Error(`Ollama /api/pull ${respons.status}`)
}

// Minimalt prob-anrop: pulla först, kör sedan ett pyttelitet chatt-anrop.
export const probaModell = async (modell: string): Promise<boolean> => {
  try {
    await pullModell(modell)
    await chatEnGang(modell, 'Svara med ett ord.', 'Säg ja.', 8)
    return true
  } catch {
    return false
  }
}

// Modellens metadata (bl.a. kontextlängd) för dokumentation i rapporten.
export const visaModell = async (modell: string): Promise<Record<string, unknown>> => {
  const respons = await fetch(`${bas()}/api/show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modell }),
    signal: AbortSignal.timeout(30000),
  })
  if (!respons.ok) return { fel: `Ollama /api/show ${respons.status}` }
  return (await respons.json()) as Record<string, unknown>
}
