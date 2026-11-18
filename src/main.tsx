import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './assets-theme.css';
import './glass-theme.css';
import './refined-theme.css';
import './today-todos.css';
import './ledger.css';
import './futures.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
