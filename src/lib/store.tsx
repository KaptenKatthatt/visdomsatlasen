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

// Ett bokmärke i biblioteket: pekar på ett kapitel och bär med sig boknamnet
// så Samling kan rendera raden utan ett extra API-anrop.
type ChapterBookmark = {
  workId: string
  bookSlug: string
  chapter: number
  bookName: string
  savedAt: number
}

/** Nyckel för ett kapitelbokmärke — samma form som bok-id:t plus kapitel. */
export const chapterKey = (workId: string, bookSlug: string, chapter: number): string =>
  `${workId}/${bookSlug}:${chapter}`

type AtlasState = {
  // null = inget manuellt val: temat följer systemets färgschema, även när
  // det ändras senare. Först en toggle fryser valet i localStorage.
  dark: boolean | null
  font: FontChoice
  textStep: number
  bg: BgChoice
  bookmarks: Record<string, boolean>
  chapterBookmarks: Record<string, ChapterBookmark>
  notes: Record<string, string>
  lastRead: LastRead | null
  // Sparade reflektionsrum (rum-id → sparat). Skilt från bookmarks: rum
  // sparas hela, bokmärken märker kapitelpositioner i biblioteket.
  sparadeRum: Record<string, boolean>
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
  setNote: (id: string, text: string) => void
  recordRead: (id: string, mode: ReadMode) => void
  vaxlaSparatRum: (id: string) => void
  registreraLastRum: (id: string) => void
  registreraVandringsplats: (vandringId: string, rumId: string) => void
}

// Utåt är dark alltid det effektiva värdet (manuellt val eller systemets).
type AtlasStore = Omit<AtlasState, 'dark'> & { dark: boolean } & AtlasActions

const systemPrefersDark = (): boolean =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

const clampStep = (step: number): number =>
  Math.min(MAX_TEXT_STEP, Math.max(MIN_TEXT_STEP, Math.round(step)))

// Samlingsfälten (bokmärken, anteckningar, senast läst) behöver bara falla
// tillbaka på tomt — ingen värdevalidering, till skillnad från temafälten.
const restoredCollections = (
  saved: Partial<AtlasState>,
): Pick<
  AtlasState,
  | 'bookmarks'
  | 'chapterBookmarks'
  | 'notes'
  | 'lastRead'
  | 'sparadeRum'
  | 'senastLastaRum'
  | 'vandringsplatser'
> => ({
  bookmarks: saved.bookmarks ?? {},
  chapterBookmarks: saved.chapterBookmarks ?? {},
  notes: saved.notes ?? {},
  lastRead: saved.lastRead ?? null,
  sparadeRum: saved.sparadeRum ?? {},
  senastLastaRum: saved.senastLastaRum ?? [],
  vandringsplatser: saved.vandringsplatser ?? {},
})

// Äldre sparad state saknar de nya fälten, och korrupt JSON får inte läcka in
// i CSS-attributen — merga över defaults och validera varje temavärde.
const initialState = (): AtlasState => {
  const saved = readJson<Partial<AtlasState>>(STORAGE_KEY, {})
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

// Utseendehandlingarna (tema, typsnitt, textstorlek, bakgrund) hålls skilda
// från samlingshandlingarna så ingen av hjälparna växer förbi komplexitetsgränsen.
type ThemeActions = Pick<AtlasActions, 'toggleDark' | 'setFont' | 'stepText' | 'setBg'>
type CollectionActions = Omit<AtlasActions, keyof ThemeActions>

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
  const setNote = useCallback(
    (id: string, text: string) =>
      setState((s) => ({ ...s, notes: { ...s.notes, [id]: text } })),
    [setState],
  )
  const recordRead = useCallback(
    (id: string, mode: ReadMode) =>
      setState((s) => ({ ...s, lastRead: { id, mode } })),
    [setState],
  )
  const vaxlaSparatRum = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        sparadeRum: { ...s.sparadeRum, [id]: !s.sparadeRum[id] },
      })),
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
    setNote,
    recordRead,
    vaxlaSparatRum,
    registreraLastRum,
    registreraVandringsplats,
  }
}

const useAtlasActions = (setState: SetAtlasState): AtlasActions => ({
  ...useThemeActions(setState),
  ...useCollectionActions(setState),
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
