import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress specific dev-mode noise while keeping real warnings/errors
if (import.meta.env.DEV) {
    const originalWarn = console.warn
    console.warn = (...args) => {
        const msg = String(args[0] ?? '')
        if (
            msg.includes('Download the React DevTools') ||
            msg.includes('Lit is in dev mode')
        ) {
            return
        }
        originalWarn.apply(console, args)
    }
}

createRoot(document.getElementById('root')).render(
    <App />
)
