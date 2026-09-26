// Writes the published editorial content to dist/atlas-content.json at build time
// (`npm run export:content`, last step of `npm run build`). The server reads the file
// when POST /api/export/hackytel builds the bundle for Hackytel's tablet. Invalid
// content stops here as it does in the content gate: a bundle is never built from it.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { exportContent } from '../src/content/editorial/export'
import { validateContent } from '../src/content/editorial/validate'
import { loadContentSet } from './lib/contentSet'

const { set, errors } = loadContentSet()
const allErrors = [...errors, ...validateContent(set)]
if (allErrors.length > 0) {
  console.error(`Export: ${allErrors.length} fel i innehållet, ingen fil skriven\n`)
  for (const error of allErrors) console.error(`  ✗ ${error}`)
  process.exit(1)
}

const content = exportContent(set)
const target = path.join(process.cwd(), 'dist', 'atlas-content.json')
mkdirSync(path.dirname(target), { recursive: true })
writeFileSync(target, `${JSON.stringify(content)}\n`, 'utf-8')
console.log(
  `Export OK: ${target} (rum ${content.rooms.length}, vandringar ${content.paths.length}, källor ${content.sources.length})`,
)
