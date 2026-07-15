import { useEffect } from 'react'

/**
 * Gör skalets övriga barn (main och nav) inerta medan ett ark är öppet, så
 * att bakgrunden varken kan fokuseras eller läsas av skärmläsare bakom den
 * modala dialogen. Arkets eget överlägg märks med data-overlay och lämnas
 * åtkomligt. Återställer vid stängning; barn som redan var inerta rörs inte.
 */
export const useInertBakgrund = (skal: HTMLElement | null): void => {
  useEffect(() => {
    if (!skal) return
    const berörda = Array.from(skal.children).filter(
      (barn): barn is HTMLElement =>
        barn instanceof HTMLElement &&
        !barn.hasAttribute('data-overlay') &&
        !barn.hasAttribute('inert'),
    )
    for (const barn of berörda) barn.setAttribute('inert', '')
    return () => {
      for (const barn of berörda) barn.removeAttribute('inert')
    }
  }, [skal])
}
