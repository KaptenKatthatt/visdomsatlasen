import { createContext, useContext } from 'react'

/** The shell element (.shell), set by RootLayout via ref. Portal target for
 * bottom sheets opened from within the topbar — its backdrop-filter otherwise
 * makes it the containing block for fixed-positioned overlays. */
export const ShellContext = createContext<HTMLElement | null>(null)

export const useShell = (): HTMLElement | null => useContext(ShellContext)
