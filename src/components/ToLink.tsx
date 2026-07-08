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

/** Renders a router link for any content link target. */
export const ToLink = ({ to, className, style, children }: Props) => {
  const shared = { className, style, children }
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
