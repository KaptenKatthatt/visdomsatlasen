import { createContext, useContext } from 'react'

/** Skalelementet (.shell), satt av RootLayout via ref. Portalmål för
 * bottenark som öppnas inifrån topbaren — dess backdrop-filter gör den
 * annars till containing block för fixed-positionerade overlays. */
export const ShellContext = createContext<HTMLElement | null>(null)

export const useShell = (): HTMLElement | null => useContext(ShellContext)
