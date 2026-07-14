// Typer och inläsning för zen-översättningsexperimentet (docs/research/zen-experiment).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

const passageSchema = z.object({
  id: z.string(),
  titel: z.string(),
  forfattare: z.string(),
  verk: z.string(),
  datum: z.string(),
  sprak: z.string(),
  svarighetsgrad: z.string(),
  urvalsskal: z.string(),
  original: z.string(),
  kalla: z.object({
    utgava: z.string(),
    transkription: z.string(),
    lankar: z.array(z.string()),
  }),
  pdMotivering: z.string(),
  transkriptionsanmarkningar: z.string(),
})

export type Passage = z.infer<typeof passageSchema>

export type Steg = { namn: string; system: string; prompt: string; svar: string; ms: number }

export type Resultat = {
  passageId: string
  modell: string
  flode: 'A' | 'B' | 'C' | 'D'
  steg: Steg[]
  skapad: string
}

export const lasPassager = (katalog: string): Passage[] =>
  readdirSync(katalog)
    .filter((fil) => fil.endsWith('.json'))
    .sort()
    .map((fil) => passageSchema.parse(JSON.parse(readFileSync(join(katalog, fil), 'utf8'))))
