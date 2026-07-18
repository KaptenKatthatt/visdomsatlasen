// Validerar allt redaktionellt innehåll under src/content/ (roadmap fas 2):
// tolkning + schemavalidering per fil, sedan korsvalidering av relationer och
// publiceringskrav. Körs i `npm run check` — ogiltigt innehåll stoppar bygget.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'
import { parsePostFile, parseRoomFile, type ContentFile, type Parsed } from '../src/content/editorial/parse'
import {
  questionSchema,
  sourceSchema,
  sourcePassageSchema,
  personSchema,
  themeSchema,
  traditionSchema,
  pathSchema,
  type ContentSet,
} from '../src/content/editorial/schema'
import { validateContent } from '../src/content/editorial/validate'

const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content')

const readMarkdownFiles = (katalog: string): ContentFile[] => {
  const dir = path.join(CONTENT_ROOT, katalog)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => ({
      filePath: `src/content/${katalog}/${name}`,
      rawText: readFileSync(path.join(dir, name), 'utf-8'),
    }))
}

const allErrors: string[] = []

const collect = <T>(filer: ContentFile[], tolka: (fil: ContentFile) => Parsed<T>): T[] =>
  filer.flatMap((fil) => {
    const tolkning = tolka(fil)
    allErrors.push(...tolkning.errors)
    return tolkning.value ? [tolkning.value] : []
  })

const poster = <T>(katalog: string, schema: z.ZodType<T>): T[] =>
  collect(readMarkdownFiles(katalog), (fil) => parsePostFile(schema, fil))

const mängd: ContentSet = {
  rooms: collect(readMarkdownFiles('rooms'), parseRoomFile),
  themes: poster('themes', themeSchema),
  questions: poster('questions', questionSchema),
  paths: poster('paths', pathSchema),
  sources: poster('sources', sourceSchema),
  passages: poster('passages', sourcePassageSchema),
  traditions: poster('traditions', traditionSchema),
  people: poster('people', personSchema),
}

allErrors.push(...validateContent(mängd))

if (allErrors.length > 0) {
  console.error(`Innehållsvalidering: ${allErrors.length} fel\n`)
  for (const fel of allErrors) console.error(`  ✗ ${fel}`)
  process.exit(1)
}

const antal = Object.entries(mängd)
  .filter(([, poster]) => poster.length > 0)
  .map(([name, poster]) => `${name} ${poster.length}`)
  .join(', ')
console.log(`Innehållsvalidering OK (${antal || 'inget innehåll ännu'})`)
