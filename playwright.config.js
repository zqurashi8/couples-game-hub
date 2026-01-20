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
    // iPhone small (375x667)
    {
      name: 'iphone_small',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 667 },
      },
    },
    // iPhone modern (390x844)
    {
      name: 'iphone_modern',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
    // iPhone large (430x932)
    {
      name: 'iphone_large',
      use: {
        browserName: 'chromium',
        viewport: { width: 430, height: 932 },
      },
    },
    // Android small (360x800)
    {
      name: 'android_small',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 800 },
      },
    },
    // Android Ultra (480x1040)
    {
      name: 'android_ultra',
      use: {
        browserName: 'chromium',
        viewport: { width: 480, height: 1040 },
      },
    },
    // Tablet (768x1024)
    {
      name: 'tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
      },
    },
    // Desktop (1280x800)
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
      },
    },
    // Desktop large (1440x900)
    {
      name: 'desktop_large',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
