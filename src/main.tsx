import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PortfolioProvider } from './context/PortfolioContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PortfolioProvider>
      <App />
    </PortfolioProvider>
  </StrictMode>,
);
