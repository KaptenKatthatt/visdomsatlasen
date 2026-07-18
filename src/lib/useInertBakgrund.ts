import { useEffect } from 'react'

/**
 * Makes the shell's other children (main and nav) inert while a sheet is open, so
 * that the background can neither be focused nor read by screen readers behind the
 * modal dialog. The sheet's own overlay is marked with data-overlay and left
 * accessible. Restores on closing; children that were already inert are untouched.
 */
export const useInertBakgrund = (skal: HTMLElement | null): void => {
  useEffect(() => {
    if (!skal) return
    const affected = Array.from(skal.children).filter(
      (barn): barn is HTMLElement =>
        barn instanceof HTMLElement &&
        !barn.hasAttribute('data-overlay') &&
        !barn.hasAttribute('inert'),
    )
    for (const barn of affected) barn.setAttribute('inert', '')
    return () => {
      for (const barn of affected) barn.removeAttribute('inert')
    }
  }, [skal])
}
