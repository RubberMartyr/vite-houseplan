import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root container #root was not found in the document.')
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
