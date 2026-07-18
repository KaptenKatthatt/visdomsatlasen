import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
// Standardtypsnittet EB Garamond laddas i startbunten — det är läsytans och
// gränssnittets förval. De kombinerade @fontsource-filerna registrerar varje
// subset (latin, latin-ext, grekiska …) med unicode-range, så webbläsaren
// hämtar bara de delar texten faktiskt använder. De tre valbara typsnitten
// (Literata, Source Sans, Atkinson) laddas först när läsaren väljer dem, via
// laddaFont i fonter.ts, så start-CSS:en inte bär fyra familjer i onödan (fas 13).
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/500-italic.css'
import { router } from './app/router'
import { AtlasProvider } from './lib/store'
import { installeraGlobalaFelfangare } from './lib/telemetri'
import './styles/global.css'

registerSW()
// Fas 14: fånga globala, annars osynliga fel (okaught-fel, avvisade promises)
// och logga dem lugnt till konsolen. Ingen tredjepart, inget engagemang.
installeraGlobalaFelfangare()

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
