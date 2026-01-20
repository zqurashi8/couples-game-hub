// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Cinco Layout Tests
 * Tests UI layout requirements using bounding boxes as specified in mcp/acceptance.yml
 */

const BASE_URL = process.env.BASE_URL || 'https://zqurashi8.github.io/couples-game-hub/index.html';

// Viewport configurations matching acceptance.yml
const VIEWPORTS = {
  iphone_small: { width: 375, height: 667, name: 'iphone_small', type: 'mobile' },
  iphone_modern: { width: 390, height: 844, name: 'iphone_modern', type: 'mobile' },
  iphone_large: { width: 430, height: 932, name: 'iphone_large', type: 'mobile' },
  android_small: { width: 360, height: 800, name: 'android_small', type: 'mobile' },
  android_ultra: { width: 480, height: 1040, name: 'android_ultra', type: 'mobile' },
  tablet: { width: 768, height: 1024, name: 'tablet', type: 'tablet' },
  desktop: { width: 1280, height: 800, name: 'desktop', type: 'desktop' },
  desktop_large: { width: 1440, height: 900, name: 'desktop_large', type: 'desktop' },
};

// Key viewports for layout testing (subset for faster tests)
const LAYOUT_TEST_VIEWPORTS = ['iphone_large', 'android_ultra', 'tablet', 'desktop'];

// Start a Cinco game (AI mode for quick testing)
async function startCincoGame(page) {
  const consoleMessages = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    consoleMessages.push(`[pageerror] ${error.message}`);
  });

  // Navigate directly to Cinco page
  await page.goto(BASE_URL.replace('index.html', 'games/cinco.html'));
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Wait for mode screen and click AI mode
  await page.waitForSelector('#aiModeBtn', { state: 'visible', timeout: 10000 });
  await page.locator('#aiModeBtn').click({ force: true });
  await page.waitForTimeout(2000);

  try {
    await page.waitForSelector('#gameScreen.active', { state: 'visible', timeout: 15000 });
  } catch (e) {
    if (consoleMessages.length > 0) {
      console.log('Console errors:', consoleMessages.join('\n'));
    }
    throw e;
  }

  await page.waitForSelector('[data-testid="cinco-table"]', { state: 'visible', timeout: 5000 });
}

test.describe('Cinco Functional Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await startCincoGame(page);
  });

  test('game loads and shows visible table area', async ({ page }) => {
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

  test('player hand shows multiple cards', async ({ page }) => {
    const playerHand = page.locator('[data-testid="cinco-player-hand"]');
    await expect(playerHand).toBeVisible();
    await page.waitForSelector('[data-testid="cinco-player-hand"] .cinco-card', { timeout: 5000 });
    const cards = await playerHand.locator('.cinco-card').count();
    expect(cards).toBeGreaterThan(1);
  });

  test('turn indicator is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="cinco-turn-indicator"]')).toBeVisible();
  });

  test('at least one valid action can be taken', async ({ page }) => {
    const drawVisible = await page.locator('[data-testid="cinco-draw-pile"]').isVisible();
    const playableCount = await page.locator('[data-testid="cinco-player-hand"] .cinco-card.playable').count();
    expect(drawVisible || playableCount > 0).toBe(true);
  });
});

test.describe('Cinco Accessibility & UX Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await startCincoGame(page);
  });

  test('turn indicator has aria-live for screen readers', async ({ page }) => {
    const turnIndicator = page.locator('[data-testid="cinco-turn-indicator"]');
    await expect(turnIndicator).toHaveAttribute('aria-live', 'polite');
    await expect(turnIndicator).toHaveAttribute('role', 'status');
  });

  test('disabled cards have sufficient opacity (>= 0.75)', async ({ page }) => {
    // Wait for cards to render
    await page.waitForSelector('[data-testid="cinco-player-hand"] .cinco-card', { timeout: 5000 });

    // Check if any disabled cards exist
    const disabledCards = page.locator('[data-testid="cinco-player-hand"] .cinco-card.disabled');
    const count = await disabledCards.count();

    if (count > 0) {
      // Get computed opacity of first disabled card
      const opacity = await disabledCards.first().evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).opacity);
      });
      expect(opacity).toBeGreaterThanOrEqual(0.75);
    }
  });

  test('cards meet minimum size (>= 60px wide)', async ({ page }) => {
    await page.waitForSelector('[data-testid="cinco-player-hand"] .cinco-card', { timeout: 5000 });

    const cards = page.locator('[data-testid="cinco-player-hand"] .cinco-card');
    const firstCard = cards.first();
    const box = await firstCard.boundingBox();

    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(60);
  });

  test('turn indicator text changes based on turn state', async ({ page }) => {
    const turnIndicator = page.locator('[data-testid="cinco-turn-indicator"]');
    const text = await turnIndicator.textContent();

    // Should contain either "Your Turn" or "Waiting" or similar
    expect(text).toMatch(/turn|waiting|thinking/i);
  });
});

test.describe('Cinco UI Layout Requirements', () => {
  for (const viewportKey of LAYOUT_TEST_VIEWPORTS) {
    const viewport = VIEWPORTS[viewportKey];

    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await startCincoGame(page);
      });

      test('draw pile is horizontally centered (within 8%)', async ({ page }) => {
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

      test('discard pile is near draw pile (< 35% table width)', async ({ page }) => {
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

      test('table uses sufficient viewport height', async ({ page }) => {
        const table = page.locator('[data-testid="cinco-table"]');
        const tableBox = await table.boundingBox();

        expect(tableBox).not.toBeNull();

        // Desktop needs 65%, mobile/tablet needs 55%
        const minPercent = viewport.type === 'desktop' ? 0.65 : 0.55;
        const requiredHeight = viewport.height * minPercent;

        expect(tableBox.height).toBeGreaterThanOrEqual(requiredHeight);
      });

      test('gameplay UI is not clipped', async ({ page }) => {
        const elements = [
          ['cinco-draw-pile', page.locator('[data-testid="cinco-draw-pile"]')],
          ['cinco-discard-pile', page.locator('[data-testid="cinco-discard-pile"]')],
          ['cinco-player-hand', page.locator('[data-testid="cinco-player-hand"]')],
        ];

        for (const [name, element] of elements) {
          const box = await element.boundingBox();
          expect(box, `${name} should exist`).not.toBeNull();
          expect(box.x, `${name} left`).toBeGreaterThanOrEqual(0);
          expect(box.y, `${name} top`).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, `${name} right`).toBeLessThanOrEqual(viewport.width);
          expect(box.y + box.height, `${name} bottom`).toBeLessThanOrEqual(viewport.height);
        }
      });

      // Strengthened tests for iphone_large and android_ultra
      if (viewportKey === 'iphone_large' || viewportKey === 'android_ultra') {
        test('table is vertically centered (within 12%)', async ({ page }) => {
          const table = page.locator('[data-testid="cinco-table"]');
          const tableBox = await table.boundingBox();

          expect(tableBox).not.toBeNull();

          const viewportCenterY = viewport.height / 2;
          const tableCenterY = tableBox.y + tableBox.height / 2;
          const offset = Math.abs(viewportCenterY - tableCenterY);
          const allowedOffset = viewport.height * 0.12;

          expect(offset).toBeLessThanOrEqual(allowedOffset);
        });

        test('player hand is anchored near bottom (within 6%)', async ({ page }) => {
          const playerHand = page.locator('[data-testid="cinco-player-hand"]');
          const box = await playerHand.boundingBox();

          expect(box).not.toBeNull();

          const handBottom = box.y + box.height;
          const gapFromBottom = viewport.height - handBottom;
          const maxGap = viewport.height * 0.06;

          expect(gapFromBottom).toBeLessThanOrEqual(maxGap);
        });

        test('player hand is tall enough (>= 18%)', async ({ page }) => {
          const playerHand = page.locator('[data-testid="cinco-player-hand"]');
          const box = await playerHand.boundingBox();

          expect(box).not.toBeNull();

          const minHeight = viewport.height * 0.18;
          expect(box.height).toBeGreaterThanOrEqual(minHeight);
        });

        test('table uses at least 60% viewport height', async ({ page }) => {
          const table = page.locator('[data-testid="cinco-table"]');
          const tableBox = await table.boundingBox();

          expect(tableBox).not.toBeNull();

          const minHeight = viewport.height * 0.60;
          expect(tableBox.height).toBeGreaterThanOrEqual(minHeight);
        });
      }

      // Mobile-specific tests
      if (viewport.type === 'mobile') {
        test('player hand height >= 16% viewport', async ({ page }) => {
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
