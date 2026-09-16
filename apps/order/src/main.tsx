import { brand } from '@coffee/brand';
import '@coffee/brand/theme.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './StoreContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider><App /></StoreProvider>
  </StrictMode>,
)

document.title = brand.name + ' · order';
