import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 1. Keep your existing Speed Insights import
import { injectSpeedInsights } from '@vercel/speed-insights';
// 2. Add the new Analytics import
import { Analytics } from '@vercel/analytics/react';

injectSpeedInsights();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {/* 3. Add the component here */}
    <Analytics />
  </React.StrictMode>,
)