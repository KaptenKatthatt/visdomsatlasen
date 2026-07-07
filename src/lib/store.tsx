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
import { readJson, writeJson } from './storage'
import {
  BG_CHOICES,
  BG_PAPER,
  DARK_PAPER,
  FONT_CHOICES,
  MAX_TEXT_STEP,
  MIN_TEXT_STEP,
  type BgChoice,
  type FontChoice,
} from './theme'

const STORAGE_KEY = 'visdomsatlasen'

type LastRead = { id: string; mode: ReadMode }

type AtlasState = {
  dark: boolean
  font: FontChoice
  textStep: number
  bg: BgChoice
  bookmarks: Record<string, boolean>
  notes: Record<string, string>
  lastRead: LastRead | null
}

type AtlasActions = {
  toggleDark: () => void
  setFont: (font: FontChoice) => void
  stepText: (delta: 1 | -1) => void
  setBg: (bg: BgChoice) => void
  toggleBookmark: (id: string) => void
  setNote: (id: string, text: string) => void
  recordRead: (id: string, mode: ReadMode) => void
}

type AtlasStore = AtlasState & AtlasActions

// Utan sparat val följer temat systemets inställning (matchMedia). Ett manuellt
// val sparas sedan i localStorage och tar över.
const systemPrefersDark = (): boolean =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

const clampStep = (step: number): number =>
  Math.min(MAX_TEXT_STEP, Math.max(MIN_TEXT_STEP, Math.round(step)))

// Äldre sparad state saknar de nya fälten, och korrupt JSON får inte läcka in
// i CSS-attributen — merga över defaults och validera varje värde.
const initialState = (): AtlasState => {
  const saved = readJson<Partial<AtlasState>>(STORAGE_KEY, {})
  return {
    dark: typeof saved.dark === 'boolean' ? saved.dark : systemPrefersDark(),
    font: FONT_CHOICES.find((f) => f === saved.font) ?? 'garamond',
    textStep: typeof saved.textStep === 'number' ? clampStep(saved.textStep) : 3,
    bg: BG_CHOICES.find((b) => b === saved.bg) ?? 'kram',
    bookmarks: saved.bookmarks ?? {},
    notes: saved.notes ?? {},
    lastRead: saved.lastRead ?? null,
  }
}

type SetAtlasState = Dispatch<SetStateAction<AtlasState>>

const useAtlasActions = (setState: SetAtlasState): AtlasActions => {
  const toggleDark = useCallback(
    () => setState((s) => ({ ...s, dark: !s.dark })),
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
  const toggleBookmark = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        bookmarks: { ...s.bookmarks, [id]: !s.bookmarks[id] },
      })),
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
  return { toggleDark, setFont, stepText, setBg, toggleBookmark, setNote, recordRead }
}

// Speglar temat på <html> (bakgrund utanför skalet) och i webbläsarens chrome
// (theme-color), så PWA:n och statusfältet följer med när temat växlar.
const useThemeMirror = (state: AtlasState): void => {
  useEffect(() => {
    writeJson(STORAGE_KEY, state)
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.dark = state.dark ? 'true' : 'false'
    document.documentElement.dataset.bg = state.bg
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', state.dark ? DARK_PAPER : BG_PAPER[state.bg])
  }, [state.dark, state.bg])
}

const AtlasContext = createContext<AtlasStore | null>(null)

export const AtlasProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AtlasState>(initialState)
  const actions = useAtlasActions(setState)
  useThemeMirror(state)

  return (
    <AtlasContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AtlasContext.Provider>
  )
}

export const useAtlas = (): AtlasStore => {
  const store = useContext(AtlasContext)
  if (!store) throw new Error('useAtlas must be used inside AtlasProvider')
  return store
}
