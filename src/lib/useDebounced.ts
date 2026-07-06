import { useEffect, useState } from 'react'

/** Fördröjer ett värde tills det varit oförändrat i `delayMs` (t.ex. sökfält). */
export const useDebounced = <T>(value: T, delayMs = 250): T => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}
