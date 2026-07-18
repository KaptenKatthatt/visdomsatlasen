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

// The library's targets are all slug-addressed — one map is enough, and a new
// target is one line here plus the union member in model.ts.
const LIBRARY_PATH = {
  rum: '/rum/$slug',
  tema: '/bibliotek/tema/$slug',
  kallpost: '/bibliotek/kalla/$slug',
  personpost: '/bibliotek/person/$slug',
  fraga: '/bibliotek/fraga/$slug',
  vandring: '/bibliotek/vandring/$slug',
} as const

type LibraryTo = Extract<To, { kind: keyof typeof LIBRARY_PATH }>
const isLibraryTo = (to: To): to is LibraryTo => to.kind in LIBRARY_PATH

const LibraryLink = ({ to, ...shared }: Props & { to: LibraryTo }) => (
  <Link to={LIBRARY_PATH[to.kind]} params={{ slug: to.slug }} {...shared} />
)

/** Renders a router link for any content link target. */
export const ToLink = ({ to, className, style, children }: Props) => {
  const shared = { className, style, children }
  if (isLibraryTo(to)) return <LibraryLink to={to} {...shared} />
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
