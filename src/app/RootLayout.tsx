import { Outlet, useRouterState } from '@tanstack/react-router'
import { Suspense, useState } from 'react'
import { Felgrans } from '../components/Felgrans'
import { NavTabs } from '../components/NavTabs'
import { Sidladdning } from '../components/Sidladdning'
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
          <a href="#innehall" className="srOnlyFokuserbar">
            Hoppa till innehåll
          </a>
          <main id="innehall" tabIndex={-1}>
            {/* Nyckeln per route nollställer felgränsen vid navigation, så ett
                enstaka chunk-fel inte fastnar när läsaren går vidare (fas 14). */}
            <Felgrans key={pathname}>
              <Suspense fallback={<Sidladdning />}>
                <Outlet />
              </Suspense>
            </Felgrans>
          </main>
          {showNav && <NavTabs />}
        </ShellContext.Provider>
      </div>
    </div>
  )
}
