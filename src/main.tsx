import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PortfolioProvider } from './context/PortfolioContext';
import { AppUIProvider } from './context/AppUIContext';
import { AppModalsProvider } from './context/AppModalsContext';
import './index.css';
import './styles/theme.css';
import './styles/design-system.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PortfolioProvider>
      <AppModalsProvider>
        <AppUIProvider>
          <App />
        </AppUIProvider>
      </AppModalsProvider>
    </PortfolioProvider>
  </StrictMode>,
);
