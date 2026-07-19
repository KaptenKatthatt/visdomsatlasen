import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
// The default typeface EB Garamond loads in the startup bundle — it is the default
// for the reading surface and the interface. The combined @fontsource files register
// each subset (latin, latin-ext, greek …) with a unicode-range, so the browser
// fetches only the parts the text actually uses. The three optional typefaces
// (Literata, Source Sans, Atkinson) load only when the reader chooses them, via
// laddaFont in fonter.ts, so the startup CSS doesn't carry four families needlessly (phase 13).
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/500-italic.css'
import { router } from './app/router'
import { AtlasProvider } from './lib/store'
import { installGlobalErrorHandlers } from './lib/telemetry'
import './styles/global.css'

registerSW()
// Phase 14: catch global, otherwise invisible errors (uncaught errors, rejected
// promises) and log them calmly to the console. No third party, no engagement.
installGlobalErrorHandlers()

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AtlasProvider>
        <RouterProvider router={router} />
      </AtlasProvider>
    </StrictMode>,
  )
}
