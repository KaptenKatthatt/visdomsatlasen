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
import { mergeImport, type PersonalCollections, type PersonalExport } from './dataTransfer'
import { loadFont } from './fonts'
import {
  chapterKey,
  migrateNotes,
  migrateSaved,
  updatedNote,
  type Note,
  type ChapterBookmark,
  type SavedItem,
  type Origin,
} from './personal'
import { HISTORIKLANGD } from './roomSelection'
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

// Klassar en anteckningsnyckel vid migrering: rum-id:n (prefixet `rum-`, som
// alla rum bär) blir `rum`, allt annat (topic-id ur gamla appen, oidentifierbart)
// hamnar i `amne` — texten bevaras alltid, oavsett ursprung. Prefixkollen håller
// storen fri från innehållssamlingen så startbunten slipper hela biblioteket (fas 13).
const classifyOrigin = (id: string): Origin => (id.startsWith('rum-') ? 'room' : 'topic')

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
  // ursprung (rum/topic). Nyckel = ursprungId — en anteckning per place. Privat:
  // rör aldrig rumsvalet, publik sök, AI eller analytics.
  notes: Record<string, Note>
  lastRead: LastRead | null
  // Sparade reflektionsrum (rum-id → post med sparat-datum). Skilt från
  // bookmarks: rum sparas hela, bokmärken märker kapitelpositioner i biblioteket.
  savedRooms: Record<string, SavedItem>
  // Sparade vandringar (vandring-id → post). Aldrig förlopp eller completion —
  // bara att läsaren vill kunna återvända (notes-and-saved.md, Saved Paths).
  savedPaths: Record<string, SavedItem>
  // De senast öppnade rummen (nyast först, max HISTORIKLANGD). Finns bara
  // för att rumsvalet ska undvika omedelbar upprepning — ingen aktivitetslogg.
  recentRooms: string[]
  // Senast öppnade rum per vandring (vandring-id → rum-id). Enbart orientering
  // så läsaren kan återvända dit hen stannade (paths.md, Returning to a Path) —
  // aldrig förlopp, procent eller påminnelse.
  pathPositions: Record<string, string>
}

type AtlasActions = {
  toggleDark: () => void
  setFont: (font: FontChoice) => void
  stepText: (delta: 1 | -1) => void
  setBg: (bg: BgChoice) => void
  toggleBookmark: (id: string) => void
  toggleChapterBookmark: (bookmark: ChapterBookmark) => void
  recordRead: (id: string, mode: ReadMode) => void
  registerLastRoom: (id: string) => void
  registerPathPosition: (pathId: string, roomId: string) => void
  toggleSavedRoom: (id: string) => void
  toggleSavedPath: (id: string) => void
  setNote: (type: Origin, ursprungId: string, text: string) => void
  removeNote: (ursprungId: string) => void
  clearRecentlyVisited: () => void
  importPersonal: (importen: PersonalExport) => void
  clearPersonal: () => void
}

// Utåt är dark alltid det effektiva värdet (manuellt val eller systemets).
type AtlasStore = Omit<AtlasState, 'dark'> & { dark: boolean } & AtlasActions

const systemPrefersDark = (): boolean =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

const clampStep = (step: number): number =>
  Math.min(MAX_TEXT_STEP, Math.max(MIN_TEXT_STEP, Math.round(step)))

// Vad `readJson` ger tillbaka innan migrering: samlingsfälten kan bära gammal
// form (boolean-savedRooms, string-notes) från en tidigare version. `notes`,
// `savedRooms` och `savedPaths` läses som `unknown` (migreras), och de svenska
// nycklarna en tidigare version skrev (anteckningar/sparadeRum/…) läses som
// fallback så äldre lagrad data fortfarande går att läsa in utan förlust.
export type SavedRaw = Partial<Omit<AtlasState, 'notes' | 'savedRooms' | 'savedPaths'>> & {
  notes?: unknown
  savedRooms?: unknown
  savedPaths?: unknown
  anteckningar?: unknown
  sparadeRum?: unknown
  sparadeVandringar?: unknown
  senastLastaRum?: string[]
  vandringsplatser?: Record<string, string>
}

// Anteckningar och sparat-poster migreras tyst och förlustfritt från äldre
// former — både gammal datastruktur och de svenska nycklarna (anteckningar/
// sparadeRum/sparadeVandringar) före engelsk-migreringen.
const restoredPersonal = (saved: SavedRaw): Pick<AtlasState, 'notes' | 'savedRooms' | 'savedPaths'> => ({
  notes: migrateNotes(saved.notes, saved.anteckningar ?? saved.notes, classifyOrigin, nu()),
  savedRooms: migrateSaved(saved.savedRooms ?? saved.sparadeRum),
  savedPaths: migrateSaved(saved.savedPaths ?? saved.sparadeVandringar),
})

// Orienteringsminnet: senast lästa rum och senast öppnat rum per vandring, med
// de svenska nycklarna (senastLastaRum/vandringsplatser) som fallback.
const restoredOrientation = (saved: SavedRaw): Pick<AtlasState, 'recentRooms' | 'pathPositions'> => ({
  recentRooms: saved.recentRooms ?? saved.senastLastaRum ?? [],
  pathPositions: saved.pathPositions ?? saved.vandringsplatser ?? {},
})

// Samlingsfälten behöver bara falla tillbaka på tomt — ingen värdevalidering av
// bokmärken/senast läst, till skillnad från temafälten.
export const restoredCollections = (
  saved: SavedRaw,
): Pick<
  AtlasState,
  | 'bookmarks'
  | 'chapterBookmarks'
  | 'notes'
  | 'lastRead'
  | 'savedRooms'
  | 'savedPaths'
  | 'recentRooms'
  | 'pathPositions'
> => ({
  bookmarks: saved.bookmarks ?? {},
  chapterBookmarks: saved.chapterBookmarks ?? {},
  lastRead: saved.lastRead ?? null,
  ...restoredPersonal(saved),
  ...restoredOrientation(saved),
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
  | 'registerLastRoom'
  | 'registerPathPosition'
>
type PersonligtActions = Pick<
  AtlasActions,
  'toggleSavedRoom' | 'toggleSavedPath' | 'setNote' | 'removeNote' | 'clearRecentlyVisited'
>
type DataActions = Pick<AtlasActions, 'importPersonal' | 'clearPersonal'>

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
  const registerLastRoom = useCallback(
    // Cappen speglar rumsvalets fönster men är bara lagringsstädning —
    // själva urvalsregeln (vad som räknas som nyligen) bor i rumsval.ts.
    (id: string) =>
      setState((s) => ({
        ...s,
        recentRooms: [id, ...s.recentRooms.filter((last) => last !== id)].slice(
          0,
          HISTORIKLANGD,
        ),
      })),
    [setState],
  )
  const registerPathPosition = useCallback(
    // Sista rummet vinner — ren orientering, ingen historik och inget förlopp.
    (pathId: string, roomId: string) =>
      setState((s) => ({
        ...s,
        pathPositions: { ...s.pathPositions, [pathId]: roomId },
      })),
    [setState],
  )
  return {
    toggleBookmark,
    toggleChapterBookmark,
    recordRead,
    registerLastRoom,
    registerPathPosition,
  }
}

// Toggle mot ett sparat-record: sätter post med datum, eller tar bort nyckeln.
const toggleSaved = (
  items: Record<string, SavedItem>,
  id: string,
): Record<string, SavedItem> => {
  const next = { ...items }
  if (next[id]) delete next[id]
  else next[id] = { savedWhen: nu() }
  return next
}

const usePersonligtActions = (setState: SetAtlasState): PersonligtActions => {
  const toggleSavedRoom = useCallback(
    // Anteckningen är en egen post och överlever av-sparning, så ingen varning
    // behövs (notes-and-saved.md: varning bara när borttag även raderar anteckning).
    (id: string) => setState((s) => ({ ...s, savedRooms: toggleSaved(s.savedRooms, id) })),
    [setState],
  )
  const toggleSavedPath = useCallback(
    (id: string) => setState((s) => ({ ...s, savedPaths: toggleSaved(s.savedPaths, id) })),
    [setState],
  )
  const setNote = useCallback(
    (type: Origin, ursprungId: string, text: string) =>
      setState((s) => ({
        ...s,
        notes: {
          ...s.notes,
          [ursprungId]: updatedNote(s.notes[ursprungId], type, ursprungId, text, nu()),
        },
      })),
    [setState],
  )
  const removeNote = useCallback(
    (ursprungId: string) =>
      setState((s) => {
        const next = { ...s.notes }
        delete next[ursprungId]
        return { ...s, notes: next }
      }),
    [setState],
  )
  const clearRecentlyVisited = useCallback(
    // Tömmer bara orienteringshistoriken. Ofarligt för rumsvalet: utan historik
    // undviks ingen upprepning tillfälligt, aldrig ett fel val.
    () => setState((s) => ({ ...s, recentRooms: [] })),
    [setState],
  )
  return { toggleSavedRoom, toggleSavedPath, setNote, removeNote, clearRecentlyVisited }
}

/** Plockar ut den personliga delen av storen — delas av importmerge och av
 * exporten i Inställningar (Dina data), så samma femfältiga form byggs på ett ställe. */
export const personalCollections = (s: PersonalCollections): PersonalCollections => ({
  notes: s.notes,
  savedRooms: s.savedRooms,
  savedPaths: s.savedPaths,
  bookmarks: s.bookmarks,
  chapterBookmarks: s.chapterBookmarks,
})

// Allt personligt tömt; utseendet (dark/font/textStep/bg) rörs aldrig. Rensning
// av lokal data ska bete sig förutsägbart (notes-and-saved.md, Local Storage).
const tomtPersonligt = {
  notes: {},
  savedRooms: {},
  savedPaths: {},
  bookmarks: {},
  chapterBookmarks: {},
  lastRead: null,
  recentRooms: [],
  pathPositions: {},
} satisfies Partial<AtlasState>

const useDataActions = (setState: SetAtlasState): DataActions => {
  const importPersonal = useCallback(
    (importen: PersonalExport) =>
      setState((s) => ({ ...s, ...mergeImport(personalCollections(s), importen) })),
    [setState],
  )
  const clearPersonal = useCallback(
    () => setState((s) => ({ ...s, ...tomtPersonligt })),
    [setState],
  )
  return { importPersonal, clearPersonal }
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

  // Registrerar ett valbart typsnitts @font-face när det väljs (och på montering
  // om ett sparat val inte är standardtypsnittet). Garamond är no-op — redan i
  // startbunten. Håller start-CSS:en liten utan att någon får fel font (fas 13).
  useEffect(() => {
    loadFont(state.font)
  }, [state.font])
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
