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

// Classifies a note key during migration: room ids (the `rum-` prefix, which
// all rooms carry) become `rum`, everything else (topic ids from the old app, unidentifiable)
// ends up in `amne` — the text is always preserved, whatever its origin. The prefix check keeps
// the store free of the content collection so the startup bundle avoids the whole library (phase 13).
const classifyOrigin = (id: string): Origin => (id.startsWith('rum-') ? 'room' : 'topic')

type AtlasState = {
  // null = no manual choice: the theme follows the system colour scheme, even when
  // it changes later. Only a toggle freezes the choice in localStorage.
  dark: boolean | null
  font: FontChoice
  textStep: number
  bg: BgChoice
  bookmarks: Record<string, boolean>
  chapterBookmarks: Record<string, ChapterBookmark>
  // Notes (notes-and-saved.md): private reflections tied to their
  // origin (room/topic). Key = ursprungId — one note per place. Private:
  // never touches room selection, public search, AI or analytics.
  notes: Record<string, Note>
  lastRead: LastRead | null
  // Saved reflection rooms (room id → entry with saved date). Distinct from
  // bookmarks: rooms are saved whole, bookmarks mark chapter positions in the library.
  savedRooms: Record<string, SavedItem>
  // Saved paths (path id → entry). Never progress or completion —
  // only that the reader wants to be able to return (notes-and-saved.md, Saved Paths).
  savedPaths: Record<string, SavedItem>
  // The most recently opened rooms (newest first, max HISTORIKLANGD). Exists only
  // so room selection avoids immediate repetition — not an activity log.
  recentRooms: string[]
  // The most recently opened room per path (path id → room id). Purely orientation
  // so the reader can return to where they stopped (paths.md, Returning to a Path) —
  // never progress, percentage or reminder.
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

// Externally, dark is always the effective value (a manual choice or the system's).
type AtlasStore = Omit<AtlasState, 'dark'> & { dark: boolean } & AtlasActions

const systemPrefersDark = (): boolean =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

const clampStep = (step: number): number =>
  Math.min(MAX_TEXT_STEP, Math.max(MIN_TEXT_STEP, Math.round(step)))

// What `readJson` returns before migration: the collection fields may carry an old
// shape (boolean savedRooms, string notes) from a previous version. `notes`,
// `savedRooms` and `savedPaths` are read as `unknown` (migrated), and the Swedish
// keys a previous version wrote (anteckningar/sparadeRum/…) are read as a
// fallback so older stored data can still be loaded without loss.
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

// Notes and saved entries are migrated silently and losslessly from older
// shapes — both the old data structure and the Swedish keys (anteckningar/
// sparadeRum/sparadeVandringar) from before the English migration.
const restoredPersonal = (saved: SavedRaw): Pick<AtlasState, 'notes' | 'savedRooms' | 'savedPaths'> => ({
  notes: migrateNotes(saved.notes, saved.anteckningar ?? saved.notes, classifyOrigin, nu()),
  savedRooms: migrateSaved(saved.savedRooms ?? saved.sparadeRum),
  savedPaths: migrateSaved(saved.savedPaths ?? saved.sparadeVandringar),
})

// The orientation memory: recently read rooms and the most recently opened room per path, with
// the Swedish keys (senastLastaRum/vandringsplatser) as a fallback.
const restoredOrientation = (saved: SavedRaw): Pick<AtlasState, 'recentRooms' | 'pathPositions'> => ({
  recentRooms: saved.recentRooms ?? saved.senastLastaRum ?? [],
  pathPositions: saved.pathPositions ?? saved.vandringsplatser ?? {},
})

// The collection fields only need to fall back to empty — no value validation of
// bookmarks/last read, unlike the theme fields.
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

// Older saved state lacks the new fields, and corrupt JSON must not leak into
// the CSS attributes — merge over defaults and validate each theme value.
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

// Follows the system colour scheme live, so a theme without a manual choice switches with the OS.
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

// The actions are split into three helpers — appearance, collection (the library's bookmarks
// and orientation memory) and personal (saved, notes, data transfer) — so
// none of them grows past the complexity limit.
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
    // The cap mirrors room selection's window but is only storage cleanup —
    // the selection rule itself (what counts as recent) lives in rumsval.ts.
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
    // The last room wins — pure orientation, no history and no progress.
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

// Toggle against a saved record: sets an entry with a date, or removes the key.
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
    // The note is its own entry and survives un-saving, so no warning
    // is needed (notes-and-saved.md: warn only when removal also deletes a note).
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
    // Clears only the orientation history. Harmless for room selection: without history
    // no repetition is avoided temporarily, never a wrong choice.
    () => setState((s) => ({ ...s, recentRooms: [] })),
    [setState],
  )
  return { toggleSavedRoom, toggleSavedPath, setNote, removeNote, clearRecentlyVisited }
}

/** Extracts the personal part of the store — shared by the import merge and by
 * the export in Settings (Your data), so the same five-field shape is built in one place. */
export const personalCollections = (s: PersonalCollections): PersonalCollections => ({
  notes: s.notes,
  savedRooms: s.savedRooms,
  savedPaths: s.savedPaths,
  bookmarks: s.bookmarks,
  chapterBookmarks: s.chapterBookmarks,
})

// Everything personal cleared; the appearance (dark/font/textStep/bg) is never touched. Clearing
// local data should behave predictably (notes-and-saved.md, Local Storage).
const emptyPersonal = {
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
    () => setState((s) => ({ ...s, ...emptyPersonal })),
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

// Mirrors the theme on <html> (background outside the shell) and in the browser chrome
// (theme-color), so the PWA and status bar follow along when the theme switches.
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

  // Registers an optional typeface's @font-face when it's chosen (and on mount
  // if a saved choice isn't the default typeface). Garamond is a no-op — already in
  // the startup bundle. Keeps the startup CSS small without anyone getting the wrong font (phase 13).
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
