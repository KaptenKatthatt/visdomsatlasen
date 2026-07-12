import { Link } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import type { To } from '../content/model'

type Props = {
  to: To
  className?: string
  style?: CSSProperties
  children: ReactNode
}

const screenPath = (id: string) => {
  if (id === 'tidslinje') return '/tidslinje' as const
  if (id === 'personer') return '/personer' as const
  if (id === 'sok') return '/sok' as const
  return '/utforska' as const
}

// Bibliotekets mål hålls i en egen gren så huvudswitchen inte växer förbi
// komplexitetsgränsen när fler redaktionella sidor tillkommer.
type BibliotekTo = Extract<To, { kind: 'rum' | 'tema' }>
const BIBLIOTEKSMAL = new Set<string>(['rum', 'tema'])
const arBibliotekTo = (to: To): to is BibliotekTo => BIBLIOTEKSMAL.has(to.kind)

const BibliotekLink = ({ to, ...shared }: Props & { to: BibliotekTo }) => {
  switch (to.kind) {
    case 'rum':
      return <Link to="/rum/$slug" params={{ slug: to.slug }} {...shared} />
    case 'tema':
      return <Link to="/bibliotek/tema/$slug" params={{ slug: to.slug }} {...shared} />
  }
}

/** Renders a router link for any content link target. */
export const ToLink = ({ to, className, style, children }: Props) => {
  const shared = { className, style, children }
  if (arBibliotekTo(to)) return <BibliotekLink to={to} {...shared} />
  switch (to.kind) {
    case 'topic':
      return <Link to="/amne/$id" params={{ id: to.id }} {...shared} />
    case 'person':
      return <Link to="/person/$id" params={{ id: to.id }} {...shared} />
    case 'source':
      return <Link to="/kalla/$id" params={{ id: to.id }} {...shared} />
    case 'las':
      return (
        <Link to="/las/$id/$mode" params={{ id: to.id, mode: to.mode }} {...shared} />
      )
    case 'kapitel':
      return (
        <Link
          to="/kapitel/$workId/$bookSlug/$chapter"
          params={{ workId: to.workId, bookSlug: to.bookSlug, chapter: String(to.chapter) }}
          {...shared}
        />
      )
    case 'screen':
      return <Link to={screenPath(to.id)} {...shared} />
  }
}
