// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Hub Smoke Tests
 * Tests navigation from hub to each game and back
 */

// Use local server if available, otherwise use GitHub Pages
const BASE_URL = process.env.BASE_URL || 'http://localhost:3005/index.html';

const GAMES_TO_TEST = [
  { title: 'Word Rush' },
  { title: 'Memory Match' },
  { title: 'Trivia Duel' },
  { title: 'Quick Draw' },
  { title: 'Math Dash' },
  { title: 'Memory Lane' },
  { title: 'Date Designer' },
  { title: 'Inside Our Space' },
  { title: 'Crossword Clash' },
  { title: 'Cinco' },
];

test.describe('Hub Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('pageerror', (error) => {
      console.error(`Page error: ${error.message}`);
    });
  });

  test('hub page loads and contains required elements', async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify page title
    await expect(page).toHaveTitle(/Couples Game Hub/i);

    // Verify main content
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Couples Game Hub');

    // Verify game grid exists
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible();

    // Verify all games are listed
    for (const game of GAMES_TO_TEST) {
      await expect(page.locator('.game-card h2', { hasText: game.title })).toBeVisible();
    }
  });

  test('can navigate to Cinco game and back', async ({ page }) => {
    await page.goto(BASE_URL);

    // Click on Cinco game card
    await page.locator('.game-card', { hasText: 'Cinco' }).click();

    // Verify we're on the Cinco page
    await expect(page).toHaveURL(/cinco\.html/);
    await expect(page.locator('[data-testid="cinco-root"]')).toBeVisible();

    // Navigate back to hub
    await page.locator('[data-testid="back-to-hub"]').click();

    // Verify we're back on hub
    await expect(page).toHaveURL(/index\.html/);
    await expect(page.locator('[data-testid="game-grid"]')).toBeVisible();
  });

  // Smoke test each game navigation
  for (const game of GAMES_TO_TEST) {
    test(`navigate to ${game.title} and return`, async ({ page }) => {
      await page.goto(BASE_URL);

      // Click on the game card
      await page.locator('.game-card', { hasText: game.title }).click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Verify we left the hub (URL changed)
      const currentUrl = page.url();
      expect(currentUrl).not.toBe(BASE_URL);

      // Navigate back (either via back-to-hub link or browser back)
      const backLink = page.locator('[data-testid="back-to-hub"], .back-link, a[href*="index.html"]');
      if (await backLink.isVisible()) {
        await backLink.first().click();
      } else {
        await page.goBack();
      }

      // Verify we're back at hub
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="game-grid"], .games-grid')).toBeVisible({ timeout: 10000 });
    });
  }
});
