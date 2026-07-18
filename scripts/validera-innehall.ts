// Validerar allt redaktionellt innehåll under src/content/ (roadmap fas 2):
// tolkning + schemavalidering per fil, sedan korsvalidering av relationer och
// publiceringskrav. Körs i `npm run check` — ogiltigt innehåll stoppar bygget.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'
import { tolkaPostfil, tolkaRumsfil, type ContentFile, type Parsed } from '../src/content/editorial/tolka'
import {
  fragaSchema,
  kallaSchema,
  kallpassageSchema,
  personSchema,
  temaSchema,
  traditionSchema,
  vandringSchema,
  type ContentSet,
} from '../src/content/editorial/schema'
import { valideraInnehall } from '../src/content/editorial/validera'

const INNEHALLSROT = path.join(process.cwd(), 'src', 'content')

const läsMarkdownfiler = (katalog: string): ContentFile[] => {
  const dir = path.join(INNEHALLSROT, katalog)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => ({
      sökväg: `src/content/${katalog}/${name}`,
      råtext: readFileSync(path.join(dir, name), 'utf-8'),
    }))
}

const allaFel: string[] = []

const samla = <T>(filer: ContentFile[], tolka: (fil: ContentFile) => Parsed<T>): T[] =>
  filer.flatMap((fil) => {
    const tolkning = tolka(fil)
    allaFel.push(...tolkning.fel)
    return tolkning.värde ? [tolkning.värde] : []
  })

const poster = <T>(katalog: string, schema: z.ZodType<T>): T[] =>
  samla(läsMarkdownfiler(katalog), (fil) => tolkaPostfil(schema, fil))

const mängd: ContentSet = {
  rum: samla(läsMarkdownfiler('rooms'), tolkaRumsfil),
  themes: poster('themes', temaSchema),
  frågor: poster('questions', fragaSchema),
  vandringar: poster('paths', vandringSchema),
  sources: poster('sources', kallaSchema),
  passager: poster('passages', kallpassageSchema),
  traditions: poster('traditions', traditionSchema),
  personer: poster('personer', personSchema),
}

allaFel.push(...valideraInnehall(mängd))

if (allaFel.length > 0) {
  console.error(`Innehållsvalidering: ${allaFel.length} fel\n`)
  for (const fel of allaFel) console.error(`  ✗ ${fel}`)
  process.exit(1)
}

const antal = Object.entries(mängd)
  .filter(([, poster]) => poster.length > 0)
  .map(([name, poster]) => `${name} ${poster.length}`)
  .join(', ')
console.log(`Innehållsvalidering OK (${antal || 'inget innehåll ännu'})`)
