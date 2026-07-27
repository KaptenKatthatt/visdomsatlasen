import type { ReactNode } from 'react'

/** The ordered list a path's stops are hung on — the path overview's full trail
 * and the reading room's short stretch of it alike. It exists to own one thing
 * in one place: the sequence has to survive its own styling.
 *
 * `role="list"` is not redundant in practice. `list-style: none` makes WebKit
 * drop the list semantics, and VoiceOver then stops announcing »lista, 4 objekt«.
 * With rows, chevrons and reading times gone, the `<ol>` is the only thing
 * carrying the order, so the role is restored explicitly (paths.md,
 * Accessibility). The trail line and its markers are pseudo-elements on the
 * caller's classes and never reach the screen reader. */
export const Trail = ({
  className,
  children,
}: {
  className: string | undefined
  children: ReactNode
}) => (
  // Not redundant: see the doc comment above.
  /* eslint-disable-next-line jsx-a11y/no-redundant-roles */
  <ol className={className} role="list">
    {children}
  </ol>
)
