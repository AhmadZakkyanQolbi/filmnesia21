import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

const helmetContext = {}

const rootElement = document.getElementById('root')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider context={helmetContext}>
      <App />
    </HelmetProvider>
  </React.StrictMode>
)

if (import.meta.env.DEV) {
  console.log('🎬 Filmnesia 21 v1.0.0')
  console.log('✨ Built with React + Vite')
  console.log('📺 Streaming entertainment democratized')
}