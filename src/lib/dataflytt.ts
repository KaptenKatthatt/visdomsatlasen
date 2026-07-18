// Export, import och sammanslagning av personlig data (notes-and-saved.md,
// Export/Import). Ren logik utan React/localStorage — allt round-trip:bart och
// enhetstestbart. JSON är kanoniskt (återimporterbart); Markdown är en läsbar
// spegel. Läsarens reflektioner ska aldrig låsas in i en implementation.
import { z } from 'zod'
import {
  chapterKey,
  sorteradeAnteckningar,
  sparadeIdITidsordning,
  type Note,
  type ChapterBookmark,
  type SavedItem,
  type Origin,
} from './personligt'

export const EXPORT_FORMAT = 'visdomsatlasen-personligt'

/** Den personliga delen av storen — det som exporteras, importeras och rensas. */
export type PersonalCollections = {
  anteckningar: Record<string, Note>
  sparadeRum: Record<string, SavedItem>
  sparadeVandringar: Record<string, SavedItem>
  bookmarks: Record<string, boolean>
  chapterBookmarks: Record<string, ChapterBookmark>
}

const anteckningSchema = z.object({
  ursprungTyp: z.enum(['rum', 'vandring', 'amne']),
  ursprungId: z.string(),
  text: z.string(),
  created: z.string(),
  updated: z.string(),
  title: z.string().optional(),
})

const sparadSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  sparadNar: z.string().nullable(),
})

const kapitelSchema = z.object({
  workId: z.string(),
  bookSlug: z.string(),
  chapter: z.number(),
  bookName: z.string(),
  savedAt: z.number(),
})

// Versionsfältet gör framtida format skiljbara; format-literalen gör att
// främmande filer avvisas i stället för att tolkas fel.
const exportSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.literal(1),
  exporterad: z.string(),
  anteckningar: z.array(anteckningSchema),
  sparadeRum: z.array(sparadSchema),
  sparadeVandringar: z.array(sparadSchema),
  bokmarken: z.object({ kapitel: z.array(kapitelSchema), amnen: z.array(z.string()) }),
})

export type PersonalExport = z.infer<typeof exportSchema>
type ExportSparad = z.infer<typeof sparadSchema>

const sparadPoster = (
  poster: Record<string, SavedItem>,
  titelFor: (id: string) => string | undefined,
): ExportSparad[] =>
  sparadeIdITidsordning(poster).map((id) => ({
    id,
    title: titelFor(id),
    sparadNar: poster[id]?.sparadNar ?? null,
  }))

/** Bygger en exportpost. `titelFor` slår upp läsbara titlar för anteckningarnas
 * ursprung och de sparade posterna, så exporten går att läsa fristående. */
export const tillExport = (
  samlingar: PersonalCollections,
  titelFor: (type: Origin, id: string) => string | undefined,
  nu: string,
): PersonalExport => ({
  format: EXPORT_FORMAT,
  version: 1,
  exporterad: nu,
  anteckningar: sorteradeAnteckningar(samlingar.anteckningar).map((post) => ({
    ...post,
    title: titelFor(post.ursprungTyp, post.ursprungId),
  })),
  sparadeRum: sparadPoster(samlingar.sparadeRum, (id) => titelFor('rum', id)),
  sparadeVandringar: sparadPoster(samlingar.sparadeVandringar, (id) => titelFor('vandring', id)),
  bokmarken: {
    kapitel: Object.values(samlingar.chapterBookmarks),
    amnen: Object.keys(samlingar.bookmarks).filter((id) => samlingar.bookmarks[id]),
  },
})

/** Tolkar en importfil. Fel format, fel version eller korrupt JSON → null, så
 * anroparen kan visa ett stilla felbesked utan att något går sönder. */
export const lasImport = (json: unknown): PersonalExport | null => {
  const resultat = exportSchema.safeParse(json)
  return resultat.success ? resultat.data : null
}

// Anteckningskonflikt: den nyast uppdaterade vinner (spec: konflikter löses säkert).
const mergaAnteckningar = (
  nuvarande: Record<string, Note>,
  importerade: PersonalExport['anteckningar'],
): Record<string, Note> => {
  const ut = { ...nuvarande }
  for (const post of importerade) {
    const befintlig = ut[post.ursprungId]
    if (befintlig !== undefined && befintlig.updated >= post.updated) continue
    ut[post.ursprungId] = {
      ursprungTyp: post.ursprungTyp,
      ursprungId: post.ursprungId,
      text: post.text,
      created: post.created,
      updated: post.updated,
    }
  }
  return ut
}

const mergaSparade = (
  nuvarande: Record<string, SavedItem>,
  importerade: ExportSparad[],
): Record<string, SavedItem> => {
  const ut = { ...nuvarande }
  for (const post of importerade) {
    if (ut[post.id] === undefined) ut[post.id] = { sparadNar: post.sparadNar }
  }
  return ut
}

const mergaBokmarken = (nuvarande: Record<string, boolean>, amnen: string[]): Record<string, boolean> => {
  const ut = { ...nuvarande }
  for (const id of amnen) ut[id] = true
  return ut
}

const mergaKapitel = (
  nuvarande: Record<string, ChapterBookmark>,
  kapitel: ChapterBookmark[],
): Record<string, ChapterBookmark> => {
  const ut = { ...nuvarande }
  for (const bokmarke of kapitel) ut[chapterKey(bokmarke.workId, bokmarke.bookSlug, bokmarke.chapter)] = bokmarke
  return ut
}

/** Slår ihop en import med nuvarande data (spec: lokala kopian förblir användbar,
 * konflikter löses säkert). Union av sparade poster och bokmärken; anteckningar
 * löses med nyast-vinner. Aldrig destruktivt mot befintlig data. */
export const mergaImport = (
  nuvarande: PersonalCollections,
  importen: PersonalExport,
): PersonalCollections => ({
  anteckningar: mergaAnteckningar(nuvarande.anteckningar, importen.anteckningar),
  sparadeRum: mergaSparade(nuvarande.sparadeRum, importen.sparadeRum),
  sparadeVandringar: mergaSparade(nuvarande.sparadeVandringar, importen.sparadeVandringar),
  bookmarks: mergaBokmarken(nuvarande.bookmarks, importen.bokmarken.amnen),
  chapterBookmarks: mergaKapitel(nuvarande.chapterBookmarks, importen.bokmarken.kapitel),
})

const anteckningTillMarkdown = (post: PersonalExport['anteckningar'][number]): string =>
  [
    `## ${post.title ?? 'Anteckning'}`,
    '',
    post.text,
    '',
    `_Skapad ${post.created} · updated ${post.updated}_`,
  ].join('\n')

/** Läsbar Markdown-spegel av exporten (spec föredrar öppna format). Inte
 * återimporterbar — JSON är round-trip-formatet. */
export const tillMarkdown = (exporten: PersonalExport): string => {
  const delar: string[] = ['# Visdomsatlasen — mina anteckningar och sparat', '']
  if (exporten.anteckningar.length > 0) {
    delar.push('# Anteckningar', '')
    for (const post of exporten.anteckningar) delar.push(anteckningTillMarkdown(post), '')
  }
  const sparade = [...exporten.sparadeRum, ...exporten.sparadeVandringar]
  if (sparade.length > 0) {
    delar.push('# Sparat', '')
    for (const post of sparade) delar.push(`- ${post.title ?? post.id}`)
    delar.push('')
  }
  return delar.join('\n')
}
