import { Outlet, useRouterState } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { NavTabs } from '../components/NavTabs'
import { PageLoading } from '../components/PageLoading'
import { ShellContext } from '../lib/shell'
import { useAtlas } from '../lib/store'

const NAVLESS_PREFIXES = ['/las', '/kalla', '/sok', '/kapitel', '/bibliotek-sok', '/rum']

export const RootLayout = () => {
  const { dark, font, textStep, bg } = useAtlas()
  const [shell, setShell] = useState<HTMLElement | null>(null)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showNav = !NAVLESS_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  return (
    <div
      className="desk"
      data-dark={dark ? 'true' : 'false'}
      data-font={font}
      data-size={String(textStep)}
      data-bg={bg}
    >
      <div className="shell" ref={setShell}>
        <ShellContext.Provider value={shell}>
          <a href="#innehall" className="srOnlyFocusable">
            Hoppa till innehåll
          </a>
          <main id="innehall" tabIndex={-1}>
            {/* The per-route key resets the error boundary on navigation, so a
                single chunk error doesn't stick when the reader moves on (phase 14). */}
            <ErrorBoundary key={pathname}>
              <Suspense fallback={<PageLoading />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
          {showNav && <NavTabs />}
        </ShellContext.Provider>
      </div>
    </div>
  )
}
