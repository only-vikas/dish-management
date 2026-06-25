import React from 'react'
import ReactDOM from 'react-dom/client'
import { Dashboard } from './features/dishes/Dashboard'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>,
)
