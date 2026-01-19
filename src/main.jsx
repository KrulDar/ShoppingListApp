import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'

// Debug: Version Log
console.log('%c Shopping List App v1.2.0 - Debug Build ', 'background: #222; color: #bada55');
import i18n from './lib/i18n';
if (i18n) {
  i18n.on('languageChanged', (lng) => {
    console.log('🌐 i18n: Language changed to:', lng);
  })
}

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
