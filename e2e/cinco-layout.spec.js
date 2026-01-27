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

  test('card transforms follow classic playing-card layout', async ({ page }) => {
    await page.waitForSelector('[data-testid="cinco-player-hand"] .card', { timeout: 5000 });

    const firstCard = page.locator('[data-testid="cinco-player-hand"] .card').first();

    // 1. .value must have transform: none (upright center)
    const valueTransform = await firstCard.locator('.value').evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    expect(
      valueTransform === 'none' || valueTransform === 'matrix(1, 0, 0, 1, 0, 0)',
      `.value transform should be none, got: ${valueTransform}`
    ).toBeTruthy();

    // 2. .corner (top-left) must have transform: none
    const cornerTopTransform = await firstCard.locator('.corner:not(.bottom)').evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    expect(
      cornerTopTransform === 'none' || cornerTopTransform === 'matrix(1, 0, 0, 1, 0, 0)',
      `.corner top-left transform should be none, got: ${cornerTopTransform}`
    ).toBeTruthy();

    // 3. .corner.bottom must NOT be none (must include rotate(180deg))
    const cornerBotTransform = await firstCard.locator('.corner.bottom').evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    expect(cornerBotTransform, '.corner.bottom should have a transform').not.toBe('none');
    // rotate(180deg) → matrix(-1, ~0, ~0, -1, 0, 0)
    const matrixMatch = cornerBotTransform.match(/matrix\(([^)]+)\)/);
    expect(matrixMatch, '.corner.bottom should be a matrix').toBeTruthy();
    if (matrixMatch) {
      const vals = matrixMatch[1].split(',').map(Number);
      // a ≈ -1, d ≈ -1 confirms rotate(180deg)
      expect(vals[0]).toBeCloseTo(-1, 1);
      expect(vals[3]).toBeCloseTo(-1, 1);
    }

    // 4. .cardFace must have transform: none
    const faceTransform = await firstCard.locator('.cardFace').evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    expect(
      faceTransform === 'none' || faceTransform === 'matrix(1, 0, 0, 1, 0, 0)',
      `.cardFace transform should be none, got: ${faceTransform}`
    ).toBeTruthy();

    // 5. .corner must have position: absolute (never relative)
    const cornerPosition = await firstCard.locator('.corner:not(.bottom)').evaluate((el) => {
      return window.getComputedStyle(el).position;
    });
    expect(cornerPosition, '.corner must be position: absolute').toBe('absolute');

    const cornerBotPosition = await firstCard.locator('.corner.bottom').evaluate((el) => {
      return window.getComputedStyle(el).position;
    });
    expect(cornerBotPosition, '.corner.bottom must be position: absolute').toBe('absolute');

    // 6. Fan rotation on .card elements must be <= +/-8 degrees
    const cards = page.locator('[data-testid="cinco-player-hand"] .card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const t = await cards.nth(i).evaluate((el) => window.getComputedStyle(el).transform);
      if (t && t !== 'none') {
        const m = t.match(/matrix\(([^,]+),\s*([^,]+)/);
        if (m) {
          const deg = Math.abs(Math.atan2(parseFloat(m[2]), parseFloat(m[1])) * (180 / Math.PI));
          expect(deg, `Card ${i} fan rotation should be <= 8deg`).toBeLessThanOrEqual(8.5);
        }
      }
    }
  });

  test('UI elements have fully opaque backgrounds (no see-through)', async ({ page }) => {
    // Helper to check if a color has full opacity
    const checkOpacity = async (selector, name) => {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);

      if (isVisible) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            opacity: computed.opacity,
            backgroundColor: computed.backgroundColor,
          };
        });

        // Check element opacity is 1
        expect(parseFloat(styles.opacity), `${name} opacity should be 1`).toBe(1);

        // Check background color is not transparent (alpha = 1 or no alpha)
        const bg = styles.backgroundColor;
        if (bg && bg.includes('rgba')) {
          const alphaMatch = bg.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
          if (alphaMatch) {
            const alpha = parseFloat(alphaMatch[1]);
            expect(alpha, `${name} background alpha should be 1`).toBe(1);
          }
        }
        // rgb() without alpha means fully opaque - that's fine
      }
    };

    // Check zone (player zone is always visible)
    await checkOpacity('.zone.player', '.zone');

    // Check turn banner
    await checkOpacity('#turnBanner', '.turnBanner');

    // Check hint bar (may need to select a card first to make it visible)
    // The hintBar exists but may have opacity: 0 for visibility toggle - skip alpha check
    const hintBar = page.locator('#cincoHint');
    if (await hintBar.isVisible()) {
      const bgColor = await hintBar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      if (bgColor && bgColor.includes('rgba')) {
        const alphaMatch = bgColor.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
        if (alphaMatch) {
          expect(parseFloat(alphaMatch[1]), '.hintBar background alpha should be 1').toBe(1);
        }
      }
    }

    // Check a card (player cards should be visible)
    await page.waitForSelector('[data-testid="cinco-player-hand"] .card', { timeout: 5000 });
    await checkOpacity('[data-testid="cinco-player-hand"] .card', '.card');
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
