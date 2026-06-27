import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env.local por si se corre manualmente en local apuntando a staging
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Resultados separados para no pisar los locales
  outputDir: 'test-results-staging',
  reporter: [
    ['html', { outputFolder: 'playwright-report-staging' }]
  ],
  use: {
    // Acá está la magia: Usamos la variable de entorno que GitHub/Vercel nos pasen
    // Si no pasan nada (ej: lo corrés local), falla seguro pidiendo la URL
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://play-balance.vercel.app',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  // 🚫 NO HAY WEBSERVER. Playwright asume que la web ya está viva en la nube.
});
