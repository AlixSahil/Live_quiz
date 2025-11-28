import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle SPA redirect from 404.html for GitHub Pages
const redirect = sessionStorage.getItem('redirect');
if (redirect) {
  sessionStorage.removeItem('redirect');
  const path = redirect.replace('/Live_quiz', '');
  if (path && path !== '/') {
    window.history.replaceState(null, '', '/Live_quiz' + path);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
