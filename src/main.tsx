import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
// De kombinerade @fontsource-filerna registrerar varje subset (latin,
// latin-ext, grekiska …) med unicode-range, så webbläsaren hämtar bara de
// delar texten faktiskt använder — biblioteket innehåller grekiska citat
// och pali-diakritiker som annars skulle falla tillbaka på Georgia.
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/500-italic.css'
import '@fontsource/literata/400.css'
import '@fontsource/literata/500.css'
import '@fontsource/literata/600.css'
import '@fontsource/literata/400-italic.css'
import '@fontsource/literata/500-italic.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/500.css'
import '@fontsource/source-sans-3/600.css'
import '@fontsource/source-sans-3/400-italic.css'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/atkinson-hyperlegible/400-italic.css'
import { router } from './app/router'
import { AtlasProvider } from './lib/store'
import './styles/global.css'

registerSW()

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
