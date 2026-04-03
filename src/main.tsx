import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { migrateLegacyData } from './lib/storage';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';

migrateLegacyData();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
