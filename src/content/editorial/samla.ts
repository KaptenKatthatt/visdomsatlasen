// Delad innehållsladdningsmekanik: gör om Vites glob-poster till filer och
// samlar de tolkade värdena (fel loggas lugnt i stället för att fälla appen —
// grinden har redan stoppat ogiltigt innehåll). Bor här, beroendefritt bortom
// tolka-typerna, så både innehall.ts och det lätta troskeldata.ts (fas 13) kan
// dela den utan att koppla ihop tröskeln med rummens datalager.
import type { Innehallsfil, Tolkning } from './tolka'

export const tillFiler = (moduler: Record<string, string>): Innehallsfil[] =>
  Object.entries(moduler).map(([sökväg, råtext]) => ({ sökväg, råtext }))

export const samla = <T>(filer: Innehallsfil[], tolka: (fil: Innehallsfil) => Tolkning<T>): T[] =>
  filer.flatMap((fil) => {
    const tolkning = tolka(fil)
    for (const fel of tolkning.fel) console.error('[innehåll]', fel)
    return tolkning.värde ? [tolkning.värde] : []
  })
