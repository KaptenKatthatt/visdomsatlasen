// Reads the editorial markdown under src/content/ with fs and parses it with the same
// functions the app uses. Shared by the content gate (validate-content.ts) and the
// build-time export (export-content.ts): Vite's import.meta.glob is not available under tsx.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { z } from 'zod'
import { parsePostFile, parseRoomFile, type ContentFile, type Parsed } from '../../src/content/editorial/parse'
import {
  questionSchema,
  sourceSchema,
  sourcePassageSchema,
  personSchema,
  themeSchema,
  traditionSchema,
  pathSchema,
  type ContentSet,
} from '../../src/content/editorial/schema'

const readMarkdownFiles = (root: string, directory: string): ContentFile[] => {
  const dir = path.join(root, directory)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => ({
      filePath: `src/content/${directory}/${name}`,
      rawText: readFileSync(path.join(dir, name), 'utf-8'),
    }))
}

/** Every editorial record under `root` (default src/content), plus the per-file parse errors. */
export const loadContentSet = (
  root: string = path.join(process.cwd(), 'src', 'content'),
): { set: ContentSet; errors: string[] } => {
  const errors: string[] = []
  const collect = <T>(files: ContentFile[], parse: (file: ContentFile) => Parsed<T>): T[] =>
    files.flatMap((file) => {
      const parsed = parse(file)
      errors.push(...parsed.errors)
      return parsed.value ? [parsed.value] : []
    })
  const records = <T>(directory: string, schema: z.ZodType<T>): T[] =>
    collect(readMarkdownFiles(root, directory), (file) => parsePostFile(schema, file))

  const set: ContentSet = {
    rooms: collect(readMarkdownFiles(root, 'rooms'), parseRoomFile),
    themes: records('themes', themeSchema),
    questions: records('questions', questionSchema),
    paths: records('paths', pathSchema),
    sources: records('sources', sourceSchema),
    passages: records('passages', sourcePassageSchema),
    traditions: records('traditions', traditionSchema),
    people: records('people', personSchema),
  }
  return { set, errors }
}
