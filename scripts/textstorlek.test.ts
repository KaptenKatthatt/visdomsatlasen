import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Textgolvet, i rem. Ingen text i appen får sättas mindre än så — se
 * kommentaren vid `html { font-size: 100% }` i global.css. */
const GOLV = 1

const rot = join(import.meta.dirname, '..')
const src = join(rot, 'src')

/** Alla CSS-filer under src/ — globala stilar och sidornas moduler. Läses från
 * disk i stället för via import.meta.glob, eftersom Vite annars kompilerar
 * CSS-modulerna till klassnamnsobjekt i stället för att lämna ut källan. */
const cssFiler = (katalog: string): string[] =>
  readdirSync(katalog, { withFileTypes: true }).flatMap((post) => {
    const sokvag = join(katalog, post.name)
    if (post.isDirectory()) return cssFiler(sokvag)
    return post.name.endsWith('.css') ? [sokvag] : []
  })

/** En font-size-deklaration: filens sökväg, radnumret och det skrivna värdet. */
type Deklaration = { fil: string; rad: number; varde: string }

const deklarationer = (fil: string): Deklaration[] =>
  readFileSync(fil, 'utf8')
    .split('\n')
    .flatMap((rad, index) => {
      const varde = /font-size:\s*([^;}]+)/.exec(rad)?.[1]
      return varde === undefined ? [] : [{ fil: relative(rot, fil), rad: index + 1, varde: varde.trim() }]
    })

const alla = (): Deklaration[] => cssFiler(src).flatMap(deklarationer)

/** rem-tal i ett värde — 0.875rem, 1.0625rem, … `100%` och `inherit` ger []. */
const remTal = (varde: string): number[] =>
  [...varde.matchAll(/(-?\d*\.?\d+)rem/g)].map((traff) => Number(traff[1]))

const beskriv = ({ fil, rad, varde }: Deklaration): string => `${fil}:${rad} — font-size: ${varde}`

describe('textgolvet', () => {
  it('läser in appens CSS', () => {
    expect(cssFiler(src).length).toBeGreaterThan(20)
    expect(alla().length).toBeGreaterThan(80)
  })

  // Rena rem-värden: minsta talet i deklarationen är det som kan bli för litet.
  // (`calc()` och `max()` hanteras av testet under — de innehåller mellanskillnader
  // som 0.1875rem och ska inte läsas som teckengrader.)
  it('sätter ingen font-size under golvet', () => {
    const forSma = alla().filter((deklaration) => {
      if (/calc\(|max\(|min\(|clamp\(/.test(deklaration.varde)) return false
      const tal = remTal(deklaration.varde)
      return tal.length > 0 && Math.min(...tal) < GOLV
    })
    expect(forSma.map(beskriv)).toEqual([])
  })

  // Uttryck som räknar ned från läsarens brödtextgrad (--rs) faller under golvet
  // vid det minsta lässtorlekssteget (--rs: 1rem). De måste klämmas med max().
  it('klämmer nedräkningar från --rs mot golvet', () => {
    const oklamda = alla().filter(
      (deklaration) =>
        /calc\(\s*var\(--rs[^)]*\)\s*-/.test(deklaration.varde) &&
        !deklaration.varde.startsWith(`max(${GOLV}rem`),
    )
    expect(oklamda.map(beskriv)).toEqual([])
  })
})
