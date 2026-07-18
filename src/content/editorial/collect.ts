// Delad innehållsladdningsmekanik: gör om Vites glob-poster till filer och
// samlar de tolkade värdena (fel loggas lugnt i stället för att fälla appen —
// grinden har redan stoppat ogiltigt innehåll). Bor här, beroendefritt bortom
// tolka-typerna, så både innehall.ts och det lätta troskeldata.ts (fas 13) kan
// dela den utan att koppla ihop tröskeln med rummens datalager.
import type { ContentFile, Parsed } from './parse'

export const toFiles = (moduler: Record<string, string>): ContentFile[] =>
  Object.entries(moduler).map(([filePath, rawText]) => ({ filePath, rawText }))

export const collect = <T>(filer: ContentFile[], tolka: (fil: ContentFile) => Parsed<T>): T[] =>
  filer.flatMap((fil) => {
    const tolkning = tolka(fil)
    for (const fel of tolkning.errors) console.error('[innehåll]', fel)
    return tolkning.value ? [tolkning.value] : []
  })
