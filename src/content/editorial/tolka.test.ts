import { describe, expect, it } from 'vitest'
import { tolkaPostfil, tolkaRumsfil } from './tolka'
import { temaSchema } from './schema'

const rumsMarkdown = `---
id: rum-det-du-inte-kan-styra
slug: det-du-inte-kan-styra
title: Det du inte kan styra
summary: En tanke om skillnaden mellan det som beror på dig och det som inte gör det.
primaryQuestion: fraga-vad-kan-du-styra
themes: [tema-lugn]
thoughtToCarry: Det som inte beror på dig behöver inte bäras av dig.
reflectionQuestions:
  - Vad händer när du försöker styra det som ligger utanför din makt?
sources:
  - source: kalla-enchiridion
    reference: avsnitt 1
    use: bearbetning
    primary: true
readingTimeMinutes: 4
status: utkast
created: 2026-07-09
updated: 2026-07-09
---

## Opening

Några meningar som öppnar rummet.

## Core

Själva kärntexten, flera stycken lång.

## Historical context

Valfri bakgrund.
`

describe('tolkaRumsfil', () => {
  it('tolkar frontmatter och sektioner till ett validerat rum', () => {
    const tolkning = tolkaRumsfil({ sökväg: 'rum/det-du-inte-kan-styra.md', råtext: rumsMarkdown })
    expect(tolkning.fel).toEqual([])
    expect(tolkning.värde?.id).toBe('rum-det-du-inte-kan-styra')
    expect(tolkning.värde?.opening).toContain('öppnar rummet')
    expect(tolkning.värde?.core).toContain('kärntexten')
    expect(tolkning.värde?.historicalContext).toContain('Valfri bakgrund')
    expect(tolkning.värde?.language).toBe('sv')
    expect(tolkning.värde?.sources[0]?.primary).toBe(true)
  })

  it('felar med sökväg och sektionsnamn när obligatoriskt saknas', () => {
    const utanKarna = rumsMarkdown.replace(/## Core[\s\S]*?(?=## Historical)/, '')
    const tolkning = tolkaRumsfil({ sökväg: 'rum/trasig.md', råtext: utanKarna })
    expect(tolkning.värde).toBeNull()
    expect(tolkning.fel.some((f) => f.includes('rum/trasig.md') && f.includes('Core'))).toBe(true)
  })

  it('felar begripligt på trasig frontmatter-yaml', () => {
    const tolkning = tolkaRumsfil({ sökväg: 'rum/yaml.md', råtext: '---\n: [ogiltig\n---\ntext' })
    expect(tolkning.värde).toBeNull()
    expect(tolkning.fel.length).toBeGreaterThan(0)
  })

  it('felar när frontmatter-avgränsare saknas', () => {
    const tolkning = tolkaRumsfil({ sökväg: 'rum/naken.md', råtext: 'bara text utan frontmatter' })
    expect(tolkning.värde).toBeNull()
    expect(tolkning.fel[0]).toContain('frontmatter')
  })
})

describe('tolkaPostfil', () => {
  it('tolkar frontmatter och låter kroppen bli description', () => {
    const råtext = `---
id: tema-lugn
slug: lugn
label: Lugn
status: utkast
---

Om det som stillnar när ingenting kräver något.
`
    const tolkning = tolkaPostfil(temaSchema, { sökväg: 'themes/lugn.md', råtext })
    expect(tolkning.fel).toEqual([])
    expect(tolkning.värde?.label).toBe('Lugn')
    expect(tolkning.värde?.description).toContain('stillnar')
  })

  it('lämnar beskrivningen tom när kroppen är tom', () => {
    const råtext = `---
id: tema-lugn
slug: lugn
label: Lugn
status: utkast
---
`
    const tolkning = tolkaPostfil(temaSchema, { sökväg: 'themes/lugn.md', råtext })
    expect(tolkning.fel).toEqual([])
    expect(tolkning.värde?.description).toBeUndefined()
  })

  it('samlar zod-fel med fältväg', () => {
    const råtext = `---
id: tema-lugn
slug: Lugn Med Mellanslag
label: Lugn
status: hemlig
---
`
    const tolkning = tolkaPostfil(temaSchema, { sökväg: 'themes/lugn.md', råtext })
    expect(tolkning.värde).toBeNull()
    expect(tolkning.fel.some((f) => f.includes('slug'))).toBe(true)
    expect(tolkning.fel.some((f) => f.includes('status'))).toBe(true)
  })
})
