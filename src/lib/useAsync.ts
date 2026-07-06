import { useEffect, useState } from 'react'

export type AsyncState<T> = { data: T | null; error: string | null; loading: boolean }

/** Liten datahämtningshook: laddar om när `deps` ändras, avbryter gammalt svar. */
export const useAsync = <T>(run: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> => {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true })

  useEffect(() => {
    let alive = true
    setState({ data: null, error: null, loading: true })
    run()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch(
        (err: unknown) =>
          alive &&
          setState({
            data: null,
            error: err instanceof Error ? err.message : 'Något gick fel',
            loading: false,
          }),
      )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
