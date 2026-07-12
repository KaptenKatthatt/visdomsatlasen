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

// Bibliotekets mål är alla slug-adresserade — en karta räcker, och ett nytt
// mål är en rad här plus unionsmedlemmen i model.ts.
const BIBLIOTEKSPATH = {
  rum: '/rum/$slug',
  tema: '/bibliotek/tema/$slug',
  kallpost: '/bibliotek/kalla/$slug',
  fraga: '/bibliotek/fraga/$slug',
} as const

type BibliotekTo = Extract<To, { kind: keyof typeof BIBLIOTEKSPATH }>
const arBibliotekTo = (to: To): to is BibliotekTo => to.kind in BIBLIOTEKSPATH

const BibliotekLink = ({ to, ...shared }: Props & { to: BibliotekTo }) => (
  <Link to={BIBLIOTEKSPATH[to.kind]} params={{ slug: to.slug }} {...shared} />
)

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
