// Shared content-loading machinery: turns Vite's glob entries into files and
// collects the parsed values (errors are logged calmly rather than crashing the
// app — the gate has already stopped invalid content). Lives here, dependency-free
// beyond the parse types, so both innehall.ts and the lightweight troskeldata.ts
// (phase 13) can share it without coupling the threshold to the rooms' data layer.
import type { ContentFile, Parsed } from './parse'

export const toFiles = (moduler: Record<string, string>): ContentFile[] =>
  Object.entries(moduler).map(([filePath, rawText]) => ({ filePath, rawText }))

export const collect = <T>(filer: ContentFile[], tolka: (fil: ContentFile) => Parsed<T>): T[] =>
  filer.flatMap((fil) => {
    const tolkning = tolka(fil)
    for (const fel of tolkning.errors) console.error('[innehåll]', fel)
    return tolkning.value ? [tolkning.value] : []
  })
