// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Cinco Layout Tests
 * Tests UI layout requirements using bounding boxes as specified in mcp/acceptance.yml
 */

// Use local server if available, otherwise use GitHub Pages
const BASE_URL = process.env.BASE_URL || 'http://localhost:3005/index.html';

// Viewport configurations
const VIEWPORTS = {
  mobile: { width: 390, height: 844, name: 'mobile' },
  tablet: { width: 820, height: 1180, name: 'tablet' },
  desktop: { width: 1280, height: 800, name: 'desktop' },
};

// Start a Cinco game (AI mode for quick testing)
async function startCincoGame(page) {
  // Capture all console messages for debugging
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (error) => {
    consoleMessages.push(`[pageerror] ${error.message}`);
  });

  // Navigate directly to Cinco page (faster than going through hub)
  await page.goto(BASE_URL.replace('index.html', 'games/cinco.html'));
  await page.waitForLoadState('networkidle');

  // Wait a bit for JavaScript to initialize
  await page.waitForTimeout(2000);

  // Wait for mode screen
  await page.waitForSelector('#aiModeBtn', { state: 'visible', timeout: 10000 });

  // Click AI mode button with force
  await page.locator('#aiModeBtn').click({ force: true });

  // Wait a bit for game to start
  await page.waitForTimeout(3000);

  // Try to wait for game screen
  try {
    await page.waitForSelector('#gameScreen.active', { state: 'visible', timeout: 15000 });
  } catch (e) {
    // Log console messages for debugging
    console.log('Console messages:', consoleMessages.join('\n'));
    throw e;
  }

  // Wait for table
  await page.waitForSelector('[data-testid="cinco-table"]', { state: 'visible', timeout: 5000 });
}

test.describe('Cinco Functional Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await startCincoGame(page);
  });

  test('game loads from hub and shows visible table area', async ({ page }) => {
    const table = page.locator('[data-testid="cinco-table"]');
    await expect(table).toBeVisible();
    const box = await table.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('draw pile and discard pile are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="cinco-draw-pile"]')).toBeVisible();
    await expect(page.locator('[data-testid="cinco-discard-pile"]')).toBeVisible();
  });

  test('player hand is visible and shows multiple cards', async ({ page }) => {
    const playerHand = page.locator('[data-testid="cinco-player-hand"]');
    await expect(playerHand).toBeVisible();

    // Wait for cards to render
    await page.waitForSelector('[data-testid="cinco-player-hand"] .cinco-card', { timeout: 5000 });

    const cards = await playerHand.locator('.cinco-card').count();
    expect(cards).toBeGreaterThan(1);
  });

  test('turn indicator is visible', async ({ page }) => {
    const turnIndicator = page.locator('[data-testid="cinco-turn-indicator"]');
    await expect(turnIndicator).toBeVisible();
  });

  test('at least one valid action can be taken (draw or play)', async ({ page }) => {
    // Either the draw pile is clickable or there are playable cards
    const drawPile = page.locator('[data-testid="cinco-draw-pile"]');
    const playableCards = page.locator('[data-testid="cinco-player-hand"] .cinco-card.playable');

    const drawVisible = await drawPile.isVisible();
    const playableCount = await playableCards.count();

    expect(drawVisible || playableCount > 0).toBe(true);
  });
});

test.describe('Cinco UI Layout Requirements', () => {
  // Test layout at each viewport
  for (const [viewportKey, viewport] of Object.entries(VIEWPORTS)) {
    test.describe(`${viewport.name} viewport (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await startCincoGame(page);
      });

      test('draw pile is centered in the table area (within 8%)', async ({ page }) => {
        const table = page.locator('[data-testid="cinco-table"]');
        const drawPile = page.locator('[data-testid="cinco-draw-pile"]');

        const tableBox = await table.boundingBox();
        const drawBox = await drawPile.boundingBox();

        expect(tableBox).not.toBeNull();
        expect(drawBox).not.toBeNull();

        const tableCenterX = tableBox.x + tableBox.width / 2;
        const drawCenterX = drawBox.x + drawBox.width / 2;

        const offset = Math.abs(tableCenterX - drawCenterX);
        const allowedOffset = tableBox.width * 0.08;

        expect(offset).toBeLessThanOrEqual(allowedOffset);
      });

      test('discard pile is near draw pile (< 35% of table width)', async ({ page }) => {
        const table = page.locator('[data-testid="cinco-table"]');
        const drawPile = page.locator('[data-testid="cinco-draw-pile"]');
        const discardPile = page.locator('[data-testid="cinco-discard-pile"]');

        const tableBox = await table.boundingBox();
        const drawBox = await drawPile.boundingBox();
        const discardBox = await discardPile.boundingBox();

        expect(tableBox).not.toBeNull();
        expect(drawBox).not.toBeNull();
        expect(discardBox).not.toBeNull();

        const drawCenterX = drawBox.x + drawBox.width / 2;
        const drawCenterY = drawBox.y + drawBox.height / 2;
        const discardCenterX = discardBox.x + discardBox.width / 2;
        const discardCenterY = discardBox.y + discardBox.height / 2;

        const distance = Math.sqrt(
          Math.pow(discardCenterX - drawCenterX, 2) + Math.pow(discardCenterY - drawCenterY, 2)
        );
        const maxDistance = tableBox.width * 0.35;

        expect(distance).toBeLessThan(maxDistance);
      });

      test('table occupies sufficient viewport height', async ({ page }) => {
        const table = page.locator('[data-testid="cinco-table"]');
        const tableBox = await table.boundingBox();

        expect(tableBox).not.toBeNull();

        const minHeightPercent = viewportKey === 'desktop' ? 0.65 : 0.55;
        const requiredHeight = viewport.height * minHeightPercent;

        expect(tableBox.height).toBeGreaterThanOrEqual(requiredHeight);
      });

      test('no clipped gameplay UI - elements fully inside viewport', async ({ page }) => {
        const drawPile = page.locator('[data-testid="cinco-draw-pile"]');
        const discardPile = page.locator('[data-testid="cinco-discard-pile"]');
        const playerHand = page.locator('[data-testid="cinco-player-hand"]');

        const viewportWidth = viewport.width;
        const viewportHeight = viewport.height;

        for (const [name, element] of [
          ['draw-pile', drawPile],
          ['discard-pile', discardPile],
          ['player-hand', playerHand],
        ]) {
          const box = await element.boundingBox();
          expect(box, `${name} bounding box should exist`).not.toBeNull();

          // Check element is fully inside viewport
          expect(box.x, `${name} left edge in viewport`).toBeGreaterThanOrEqual(0);
          expect(box.y, `${name} top edge in viewport`).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, `${name} right edge in viewport`).toBeLessThanOrEqual(viewportWidth);
          expect(box.y + box.height, `${name} bottom edge in viewport`).toBeLessThanOrEqual(viewportHeight);
        }
      });

      if (viewportKey === 'mobile') {
        test('player hand height is at least 16% of viewport height', async ({ page }) => {
          const playerHand = page.locator('[data-testid="cinco-player-hand"]');
          const box = await playerHand.boundingBox();

          expect(box).not.toBeNull();

          const minHeight = viewport.height * 0.16;
          expect(box.height).toBeGreaterThanOrEqual(minHeight);
        });
      }
    });
  }
});
