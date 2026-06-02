import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AudioProvider } from './contexts/AudioContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AudioProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AudioProvider>
  </StrictMode>,
)
