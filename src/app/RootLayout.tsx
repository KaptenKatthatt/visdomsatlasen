import { Outlet, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { NavTabs } from '../components/NavTabs'
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
          <main>
            <Outlet />
          </main>
          {showNav && <NavTabs />}
        </ShellContext.Provider>
      </div>
    </div>
  )
}
