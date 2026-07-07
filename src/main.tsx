import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
// Latin-subset räcker för svenskan (å/ä/ö) och håller PWA:ns precache liten;
// enstaka glyfer utanför subsetet faller tillbaka på Georgia/system.
import '@fontsource/eb-garamond/latin-400.css'
import '@fontsource/eb-garamond/latin-500.css'
import '@fontsource/eb-garamond/latin-600.css'
import '@fontsource/eb-garamond/latin-400-italic.css'
import '@fontsource/eb-garamond/latin-500-italic.css'
import '@fontsource/literata/latin-400.css'
import '@fontsource/literata/latin-500.css'
import '@fontsource/literata/latin-600.css'
import '@fontsource/literata/latin-400-italic.css'
import '@fontsource/literata/latin-500-italic.css'
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-500.css'
import '@fontsource/source-sans-3/latin-600.css'
import '@fontsource/source-sans-3/latin-400-italic.css'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import '@fontsource/atkinson-hyperlegible/latin-400-italic.css'
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
