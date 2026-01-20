// @ts-check
import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://zqurashi8.github.io/couples-game-hub/index.html';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Mobile viewport (390x844)
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
    // Tablet viewport (820x1180)
    {
      name: 'tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 820, height: 1180 },
      },
    },
    // Desktop viewport (1280x800)
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
