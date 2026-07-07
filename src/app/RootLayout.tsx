import { Outlet, useRouterState } from '@tanstack/react-router'
import { NavTabs } from '../components/NavTabs'
import { useAtlas } from '../lib/store'

const NAVLESS_PREFIXES = ['/las', '/kalla', '/sok', '/kapitel', '/bibliotek-sok']

export const RootLayout = () => {
  const { dark, font, textStep, bg } = useAtlas()
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
      <div className="shell">
        <main>
          <Outlet />
        </main>
        {showNav && <NavTabs />}
      </div>
    </div>
  )
}
