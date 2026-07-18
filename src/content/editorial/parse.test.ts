import { describe, expect, it } from 'vitest'
import { parsePostFile, parseRoomFile } from './parse'
import { themeSchema } from './schema'

const roomMarkdown = `---
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
    referens: avsnitt 1
    use: adaptation
    primary: true
readingTimeMinutes: 4
status: draft
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
    const tolkning = parseRoomFile({ filePath: 'rum/det-du-inte-kan-styra.md', rawText: roomMarkdown })
    expect(tolkning.errors).toEqual([])
    expect(tolkning.value?.id).toBe('rum-det-du-inte-kan-styra')
    expect(tolkning.value?.opening).toContain('öppnar rummet')
    expect(tolkning.value?.core).toContain('kärntexten')
    expect(tolkning.value?.historicalContext).toContain('Valfri bakgrund')
    expect(tolkning.value?.language).toBe('sv')
    expect(tolkning.value?.sources[0]?.primary).toBe(true)
  })

  it('felar med filePath och sektionsnamn när obligatoriskt saknas', () => {
    const withoutKarna = roomMarkdown.replace(/## Core[\s\S]*?(?=## Historical)/, '')
    const tolkning = parseRoomFile({ filePath: 'rum/trasig.md', rawText: withoutKarna })
    expect(tolkning.value).toBeNull()
    expect(tolkning.errors.some((f) => f.includes('rum/trasig.md') && f.includes('Core'))).toBe(true)
  })

  it('felar begripligt på trasig frontmatter-yaml', () => {
    const tolkning = parseRoomFile({ filePath: 'rum/yaml.md', rawText: '---\n: [ogiltig\n---\ntext' })
    expect(tolkning.value).toBeNull()
    expect(tolkning.errors.length).toBeGreaterThan(0)
  })

  it('felar när frontmatter-avgränsare saknas', () => {
    const tolkning = parseRoomFile({ filePath: 'rum/naken.md', rawText: 'bara text utan frontmatter' })
    expect(tolkning.value).toBeNull()
    expect(tolkning.errors[0]).toContain('frontmatter')
  })
})

describe('tolkaPostfil', () => {
  it('tolkar frontmatter och låter kroppen bli beskrivning', () => {
    const rawText = `---
id: tema-lugn
slug: lugn
label: Lugn
status: draft
---

Om det som stillnar när ingenting kräver något.
`
    const tolkning = parsePostFile(themeSchema, { filePath: 'themes/lugn.md', rawText })
    expect(tolkning.errors).toEqual([])
    expect(tolkning.value?.label).toBe('Lugn')
    expect(tolkning.value?.description).toContain('stillnar')
  })

  it('lämnar beskrivningen tom när kroppen är tom', () => {
    const rawText = `---
id: tema-lugn
slug: lugn
label: Lugn
status: draft
---
`
    const tolkning = parsePostFile(themeSchema, { filePath: 'themes/lugn.md', rawText })
    expect(tolkning.errors).toEqual([])
    expect(tolkning.value?.description).toBeUndefined()
  })

  it('samlar zod-fel med fältväg', () => {
    const rawText = `---
id: tema-lugn
slug: Lugn Med Mellanslag
label: Lugn
status: hemlig
---
`
    const tolkning = parsePostFile(themeSchema, { filePath: 'themes/lugn.md', rawText })
    expect(tolkning.value).toBeNull()
    expect(tolkning.errors.some((f) => f.includes('slug'))).toBe(true)
    expect(tolkning.errors.some((f) => f.includes('status'))).toBe(true)
  })
})
