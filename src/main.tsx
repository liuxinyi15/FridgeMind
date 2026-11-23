import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppStateProvider } from './state/AppState';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><AppStateProvider><App /></AppStateProvider></BrowserRouter></StrictMode>,
);
