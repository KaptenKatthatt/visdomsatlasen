import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { ReadMode } from '../content/model'
import { mergaImport, type PersonligaSamlingar, type PersonligExport } from './dataflytt'
import { hittaRumViaId } from './innehall'
import {
  chapterKey,
  migreraAnteckningar,
  migreraSparade,
  uppdateradAnteckning,
  type Anteckning,
  type ChapterBookmark,
  type SparadPost,
  type Ursprung,
} from './personligt'
import { HISTORIKLANGD } from './rumsval'
import { readJson, writeJson } from './storage'
import {
  BG_OPTIONS,
  BG_PAPER,
  DARK_PAPER,
  FONT_OPTIONS,
  MAX_TEXT_STEP,
  MIN_TEXT_STEP,
  type BgChoice,
  type FontChoice,
} from './theme'

const STORAGE_KEY = 'visdomsatlasen'

type LastRead = { id: string; mode: ReadMode }

const nu = (): string => new Date().toISOString()

// Klassar en anteckningsnyckel vid migrering: kända rum-id:n blir `rum`, allt
// annat (topic-id ur gamla appen, oidentifierbart) hamnar i `amne` — texten
// bevaras alltid, oavsett om ursprunget kan slås upp.
const klassificeraUrsprung = (id: string): Ursprung => (hittaRumViaId(id) ? 'rum' : 'amne')

type AtlasState = {
  // null = inget manuellt val: temat följer systemets färgschema, även när
  // det ändras senare. Först en toggle fryser valet i localStorage.
  dark: boolean | null
  font: FontChoice
  textStep: number
  bg: BgChoice
  bookmarks: Record<string, boolean>
  chapterBookmarks: Record<string, ChapterBookmark>
  // Anteckningar (notes-and-saved.md): privata reflektioner kopplade till sitt
  // ursprung (rum/topic). Nyckel = ursprungId — en anteckning per plats. Privat:
  // rör aldrig rumsvalet, publik sök, AI eller analytics.
  anteckningar: Record<string, Anteckning>
  lastRead: LastRead | null
  // Sparade reflektionsrum (rum-id → post med sparat-datum). Skilt från
  // bookmarks: rum sparas hela, bokmärken märker kapitelpositioner i biblioteket.
  sparadeRum: Record<string, SparadPost>
  // Sparade vandringar (vandring-id → post). Aldrig förlopp eller completion —
  // bara att läsaren vill kunna återvända (notes-and-saved.md, Saved Paths).
  sparadeVandringar: Record<string, SparadPost>
  // De senast öppnade rummen (nyast först, max HISTORIKLANGD). Finns bara
  // för att rumsvalet ska undvika omedelbar upprepning — ingen aktivitetslogg.
  senastLastaRum: string[]
  // Senast öppnade rum per vandring (vandring-id → rum-id). Enbart orientering
  // så läsaren kan återvända dit hen stannade (paths.md, Returning to a Path) —
  // aldrig förlopp, procent eller påminnelse.
  vandringsplatser: Record<string, string>
}

type AtlasActions = {
  toggleDark: () => void
  setFont: (font: FontChoice) => void
  stepText: (delta: 1 | -1) => void
  setBg: (bg: BgChoice) => void
  toggleBookmark: (id: string) => void
  toggleChapterBookmark: (bookmark: ChapterBookmark) => void
  recordRead: (id: string, mode: ReadMode) => void
  registreraLastRum: (id: string) => void
  registreraVandringsplats: (vandringId: string, rumId: string) => void
  vaxlaSparatRum: (id: string) => void
  vaxlaSparadVandring: (id: string) => void
  sattAnteckning: (typ: Ursprung, ursprungId: string, text: string) => void
  taBortAnteckning: (ursprungId: string) => void
  rensaSenastBesokt: () => void
  importeraPersonligt: (importen: PersonligExport) => void
  rensaPersonligt: () => void
}

// Utåt är dark alltid det effektiva värdet (manuellt val eller systemets).
type AtlasStore = Omit<AtlasState, 'dark'> & { dark: boolean } & AtlasActions

const systemPrefersDark = (): boolean =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

const clampStep = (step: number): number =>
  Math.min(MAX_TEXT_STEP, Math.max(MIN_TEXT_STEP, Math.round(step)))

// Vad `readJson` ger tillbaka innan migrering: samlingsfälten kan bära gammal
// form (boolean-sparadeRum, string-notes) från en tidigare version.
type SavedRaw = Partial<Omit<AtlasState, 'sparadeRum' | 'anteckningar'>> & {
  sparadeRum?: unknown
  sparadeVandringar?: unknown
  anteckningar?: unknown
  notes?: unknown
}

// Samlingsfälten behöver bara falla tillbaka på tomt — ingen värdevalidering av
// bokmärken/senast läst, till skillnad från temafälten. Sparade poster och
// anteckningar migreras däremot tyst och förlustfritt från äldre former.
const restoredCollections = (
  saved: SavedRaw,
): Pick<
  AtlasState,
  | 'bookmarks'
  | 'chapterBookmarks'
  | 'anteckningar'
  | 'lastRead'
  | 'sparadeRum'
  | 'sparadeVandringar'
  | 'senastLastaRum'
  | 'vandringsplatser'
> => ({
  bookmarks: saved.bookmarks ?? {},
  chapterBookmarks: saved.chapterBookmarks ?? {},
  anteckningar: migreraAnteckningar(saved.notes, saved.anteckningar, klassificeraUrsprung, nu()),
  lastRead: saved.lastRead ?? null,
  sparadeRum: migreraSparade(saved.sparadeRum),
  sparadeVandringar: migreraSparade(saved.sparadeVandringar),
  senastLastaRum: saved.senastLastaRum ?? [],
  vandringsplatser: saved.vandringsplatser ?? {},
})

// Äldre sparad state saknar de nya fälten, och korrupt JSON får inte läcka in
// i CSS-attributen — merga över defaults och validera varje temavärde.
const initialState = (): AtlasState => {
  const saved = readJson<SavedRaw>(STORAGE_KEY, {})
  return {
    dark: typeof saved.dark === 'boolean' ? saved.dark : null,
    font: FONT_OPTIONS.find((o) => o.id === saved.font)?.id ?? 'garamond',
    textStep: typeof saved.textStep === 'number' ? clampStep(saved.textStep) : 3,
    bg: BG_OPTIONS.find((o) => o.id === saved.bg)?.id ?? 'kram',
    ...restoredCollections(saved),
  }
}

// Följer systemets färgschema live, så tema utan manuellt val byter med OS:et.
const useSystemDark = (): boolean => {
  const [sysDark, setSysDark] = useState(systemPrefersDark)
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSysDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return sysDark
}

type SetAtlasState = Dispatch<SetStateAction<AtlasState>>

// Handlingarna delas i tre hjälpare — utseende, samling (bibliotekets bokmärken
// och orienteringsminnet) och personligt (sparat, anteckningar, dataflytt) — så
// ingen av dem växer förbi komplexitetsgränsen.
type ThemeActions = Pick<AtlasActions, 'toggleDark' | 'setFont' | 'stepText' | 'setBg'>
type CollectionActions = Pick<
  AtlasActions,
  | 'toggleBookmark'
  | 'toggleChapterBookmark'
  | 'recordRead'
  | 'registreraLastRum'
  | 'registreraVandringsplats'
>
type PersonligtActions = Pick<
  AtlasActions,
  'vaxlaSparatRum' | 'vaxlaSparadVandring' | 'sattAnteckning' | 'taBortAnteckning' | 'rensaSenastBesokt'
>
type DataActions = Pick<AtlasActions, 'importeraPersonligt' | 'rensaPersonligt'>

const useThemeActions = (setState: SetAtlasState): ThemeActions => {
  const toggleDark = useCallback(
    () => setState((s) => ({ ...s, dark: !(s.dark ?? systemPrefersDark()) })),
    [setState],
  )
  const setFont = useCallback(
    (font: FontChoice) => setState((s) => ({ ...s, font })),
    [setState],
  )
  const stepText = useCallback(
    (delta: 1 | -1) =>
      setState((s) => ({ ...s, textStep: clampStep(s.textStep + delta) })),
    [setState],
  )
  const setBg = useCallback(
    (bg: BgChoice) => setState((s) => ({ ...s, bg })),
    [setState],
  )
  return { toggleDark, setFont, stepText, setBg }
}

const useCollectionActions = (setState: SetAtlasState): CollectionActions => {
  const toggleBookmark = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        bookmarks: { ...s.bookmarks, [id]: !s.bookmarks[id] },
      })),
    [setState],
  )
  const toggleChapterBookmark = useCallback(
    (bookmark: ChapterBookmark) =>
      setState((s) => {
        const key = chapterKey(bookmark.workId, bookmark.bookSlug, bookmark.chapter)
        const next = { ...s.chapterBookmarks }
        if (next[key]) delete next[key]
        else next[key] = bookmark
        return { ...s, chapterBookmarks: next }
      }),
    [setState],
  )
  const recordRead = useCallback(
    (id: string, mode: ReadMode) =>
      setState((s) => ({ ...s, lastRead: { id, mode } })),
    [setState],
  )
  const registreraLastRum = useCallback(
    // Cappen speglar rumsvalets fönster men är bara lagringsstädning —
    // själva urvalsregeln (vad som räknas som nyligen) bor i rumsval.ts.
    (id: string) =>
      setState((s) => ({
        ...s,
        senastLastaRum: [id, ...s.senastLastaRum.filter((last) => last !== id)].slice(
          0,
          HISTORIKLANGD,
        ),
      })),
    [setState],
  )
  const registreraVandringsplats = useCallback(
    // Sista rummet vinner — ren orientering, ingen historik och inget förlopp.
    (vandringId: string, rumId: string) =>
      setState((s) => ({
        ...s,
        vandringsplatser: { ...s.vandringsplatser, [vandringId]: rumId },
      })),
    [setState],
  )
  return {
    toggleBookmark,
    toggleChapterBookmark,
    recordRead,
    registreraLastRum,
    registreraVandringsplats,
  }
}

// Toggle mot ett sparat-record: sätter post med datum, eller tar bort nyckeln.
const vaxlaSparad = (
  poster: Record<string, SparadPost>,
  id: string,
): Record<string, SparadPost> => {
  const nästa = { ...poster }
  if (nästa[id]) delete nästa[id]
  else nästa[id] = { sparadNar: nu() }
  return nästa
}

const usePersonligtActions = (setState: SetAtlasState): PersonligtActions => {
  const vaxlaSparatRum = useCallback(
    // Anteckningen är en egen post och överlever av-sparning, så ingen varning
    // behövs (notes-and-saved.md: varning bara när borttag även raderar anteckning).
    (id: string) => setState((s) => ({ ...s, sparadeRum: vaxlaSparad(s.sparadeRum, id) })),
    [setState],
  )
  const vaxlaSparadVandring = useCallback(
    (id: string) =>
      setState((s) => ({ ...s, sparadeVandringar: vaxlaSparad(s.sparadeVandringar, id) })),
    [setState],
  )
  const sattAnteckning = useCallback(
    (typ: Ursprung, ursprungId: string, text: string) =>
      setState((s) => ({
        ...s,
        anteckningar: {
          ...s.anteckningar,
          [ursprungId]: uppdateradAnteckning(s.anteckningar[ursprungId], typ, ursprungId, text, nu()),
        },
      })),
    [setState],
  )
  const taBortAnteckning = useCallback(
    (ursprungId: string) =>
      setState((s) => {
        const nästa = { ...s.anteckningar }
        delete nästa[ursprungId]
        return { ...s, anteckningar: nästa }
      }),
    [setState],
  )
  const rensaSenastBesokt = useCallback(
    // Tömmer bara orienteringshistoriken. Ofarligt för rumsvalet: utan historik
    // undviks ingen upprepning tillfälligt, aldrig ett fel val.
    () => setState((s) => ({ ...s, senastLastaRum: [] })),
    [setState],
  )
  return { vaxlaSparatRum, vaxlaSparadVandring, sattAnteckning, taBortAnteckning, rensaSenastBesokt }
}

const personligaSamlingar = (s: AtlasState): PersonligaSamlingar => ({
  anteckningar: s.anteckningar,
  sparadeRum: s.sparadeRum,
  sparadeVandringar: s.sparadeVandringar,
  bookmarks: s.bookmarks,
  chapterBookmarks: s.chapterBookmarks,
})

// Allt personligt tömt; utseendet (dark/font/textStep/bg) rörs aldrig. Rensning
// av lokal data ska bete sig förutsägbart (notes-and-saved.md, Local Storage).
const tomtPersonligt = {
  anteckningar: {},
  sparadeRum: {},
  sparadeVandringar: {},
  bookmarks: {},
  chapterBookmarks: {},
  lastRead: null,
  senastLastaRum: [],
  vandringsplatser: {},
} satisfies Partial<AtlasState>

const useDataActions = (setState: SetAtlasState): DataActions => {
  const importeraPersonligt = useCallback(
    (importen: PersonligExport) =>
      setState((s) => ({ ...s, ...mergaImport(personligaSamlingar(s), importen) })),
    [setState],
  )
  const rensaPersonligt = useCallback(
    () => setState((s) => ({ ...s, ...tomtPersonligt })),
    [setState],
  )
  return { importeraPersonligt, rensaPersonligt }
}

const useAtlasActions = (setState: SetAtlasState): AtlasActions => ({
  ...useThemeActions(setState),
  ...useCollectionActions(setState),
  ...usePersonligtActions(setState),
  ...useDataActions(setState),
})

// Speglar temat på <html> (bakgrund utanför skalet) och i webbläsarens chrome
// (theme-color), så PWA:n och statusfältet följer med när temat växlar.
const useThemeMirror = (state: AtlasState, dark: boolean): void => {
  useEffect(() => {
    writeJson(STORAGE_KEY, state)
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.dark = dark ? 'true' : 'false'
    document.documentElement.dataset.bg = state.bg
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? DARK_PAPER : BG_PAPER[state.bg])
  }, [dark, state.bg])
}

const AtlasContext = createContext<AtlasStore | null>(null)

export const AtlasProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AtlasState>(initialState)
  const actions = useAtlasActions(setState)
  const systemDark = useSystemDark()
  const dark = state.dark ?? systemDark
  useThemeMirror(state, dark)

  return (
    <AtlasContext.Provider value={{ ...state, dark, ...actions }}>
      {children}
    </AtlasContext.Provider>
  )
}

export const useAtlas = (): AtlasStore => {
  const store = useContext(AtlasContext)
  if (!store) throw new Error('useAtlas must be used inside AtlasProvider')
  return store
}
