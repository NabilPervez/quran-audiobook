import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/literata';
import '@fontsource/amiri-quran/arabic-400.css';
import './pwa/install';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
