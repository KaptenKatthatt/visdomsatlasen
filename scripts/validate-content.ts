// Validerar allt redaktionellt innehåll under src/content/ (roadmap fas 2):
// tolkning + schemavalidering per fil, sedan korsvalidering av relationer och
// publiceringskrav. Körs i `npm run check` — ogiltigt innehåll stoppar bygget.
import { validateContent } from '../src/content/editorial/validate'
import { loadContentSet } from './lib/contentSet'

const { set, errors } = loadContentSet()
const allErrors = [...errors, ...validateContent(set)]

if (allErrors.length > 0) {
  console.error(`Innehållsvalidering: ${allErrors.length} fel\n`)
  for (const error of allErrors) console.error(`  ✗ ${error}`)
  process.exit(1)
}

const count = Object.entries(set)
  .filter(([, records]) => records.length > 0)
  .map(([name, records]) => `${name} ${records.length}`)
  .join(', ')
console.log(`Innehållsvalidering OK (${count || 'inget innehåll ännu'})`)
