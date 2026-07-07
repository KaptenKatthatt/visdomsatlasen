import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { ReadMode } from '../content/model'
import { readJson, writeJson } from './storage'

const STORAGE_KEY = 'visdomsatlasen'

type LastRead = { id: string; mode: ReadMode }

type AtlasState = {
  dark: boolean
  bookmarks: Record<string, boolean>
  notes: Record<string, string>
  lastRead: LastRead | null
}

type AtlasStore = AtlasState & {
  toggleDark: () => void
  toggleBookmark: (id: string) => void
  setNote: (id: string, text: string) => void
  recordRead: (id: string, mode: ReadMode) => void
}

// Utan sparat val följer temat systemets inställning (matchMedia). Ett manuellt
// val sparas sedan i localStorage och tar över.
const systemPrefersDark = (): boolean =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

const initialState = (): AtlasState =>
  readJson<AtlasState>(STORAGE_KEY, {
    dark: systemPrefersDark(),
    bookmarks: {},
    notes: {},
    lastRead: null,
  })

const AtlasContext = createContext<AtlasStore | null>(null)

export const AtlasProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AtlasState>(initialState)

  useEffect(() => {
    writeJson(STORAGE_KEY, state)
  }, [state])

  // Speglar temat på <html> (bakgrund utanför skalet) och i webbläsarens chrome
  // (theme-color), så PWA:n och statusfältet följer med när temat växlar.
  useEffect(() => {
    document.documentElement.dataset.dark = state.dark ? 'true' : 'false'
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', state.dark ? '#1c1813' : '#faf6ed')
  }, [state.dark])

  const toggleDark = useCallback(
    () => setState((s) => ({ ...s, dark: !s.dark })),
    [],
  )
  const toggleBookmark = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        bookmarks: { ...s.bookmarks, [id]: !s.bookmarks[id] },
      })),
    [],
  )
  const setNote = useCallback(
    (id: string, text: string) =>
      setState((s) => ({ ...s, notes: { ...s.notes, [id]: text } })),
    [],
  )
  const recordRead = useCallback(
    (id: string, mode: ReadMode) =>
      setState((s) => ({ ...s, lastRead: { id, mode } })),
    [],
  )

  return (
    <AtlasContext.Provider
      value={{ ...state, toggleDark, toggleBookmark, setNote, recordRead }}
    >
      {children}
    </AtlasContext.Provider>
  )
}

export const useAtlas = (): AtlasStore => {
  const store = useContext(AtlasContext)
  if (!store) throw new Error('useAtlas must be used inside AtlasProvider')
  return store
}
