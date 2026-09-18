import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSecurityGuard } from './utils/securityGuard';
import { runClientDatabaseMigration } from './services/dbMigrationService';

// Run automated client schema migration on boot (preserving user data, theme, and auth)
runClientDatabaseMigration();

// Initialize Client Security Shield (Anti-Inspection, Anti-Scraping, Hotkey Interceptor)
initSecurityGuard({
  enableHotkeyShield: true,
  enableContextMenuShield: true,
  enableAntiDrag: true,
  enableConsoleWatermark: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
