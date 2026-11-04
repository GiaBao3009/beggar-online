import { test, expect } from '@playwright/test';

test.describe('3D Beggar Simulator - Emotion by Money & Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8443');
    const canvasContainer = page.locator('.beggar-canvas');
    await expect(canvasContainer).toBeVisible();
    await expect(canvasContainer).toHaveAttribute('data-character', 'ready', { timeout: 20000 });
  });

  test('1. Hero quick emotion buttons: Money-based triggers (5K laugh, 0D cry)', async ({ page }) => {
    const canvasContainer = page.locator('.beggar-canvas');
    const speechBubble = page.locator('.speech-bubble');

    // Bấm nút 5K - CỨU ĐÓI ở Hero toolbar
    const laughPill = page.locator('.hero-emotion-toolbar button').filter({ hasText: '5K - CỨU ĐÓI' });
    await expect(laughPill).toBeVisible();
    await laughPill.evaluate((b: HTMLElement) => b.click());

    await expect(canvasContainer).toHaveClass(/mood-happy/);
    await expect(speechBubble).toContainText('5K cũng quý');

    // Bấm nút 0Đ - BỎ ĐI (KHÓC) ở Hero toolbar
    const cryPill = page.locator('.hero-emotion-toolbar button').filter({ hasText: '0Đ - BỎ ĐI' });
    await expect(cryPill).toBeVisible();
    await cryPill.evaluate((b: HTMLElement) => b.click());

    await expect(canvasContainer).toHaveClass(/mood-sad/);
    await expect(speechBubble).toContainText('đói 3 ngày rồi');
  });

  test('2. Section 02 - ÔNG CŨNG CÓ CẢM XÚC: Tiền vào là cười, bỏ đi là khóc', async ({ page }) => {
    const canvasContainer = page.locator('.beggar-canvas');
    const speechBubble = page.locator('.speech-bubble');
    const section02 = page.locator('#chuyen-cua-ong');

    await section02.scrollIntoViewIfNeeded();
    await expect(section02).toBeVisible();

    // Bấm thẻ 0Đ: BỎ ĐI THẬT À...
    const cryCard = page.locator('.reaction-note').filter({ hasText: '0Đ: BỎ ĐI' });
    await expect(cryCard).toBeVisible();
    await cryCard.evaluate((b: HTMLElement) => b.click());
    await expect(canvasContainer).toHaveClass(/mood-sad/);
    await expect(speechBubble).toContainText('đói 3 ngày rồi');

    // Bấm thẻ 5.000Đ: 5K CŨNG QUÝ
    const laugh5kCard = page.locator('.reaction-note').filter({ hasText: '5.000Đ' });
    await expect(laugh5kCard).toBeVisible();
    await laugh5kCard.evaluate((b: HTMLElement) => b.click());
    await expect(canvasContainer).toHaveClass(/mood-happy/);
    await expect(speechBubble).toContainText('5K cũng quý');

    // Bấm thẻ 20.000Đ: CƠM BÌNH DÂN
    const laugh20kCard = page.locator('.reaction-note').filter({ hasText: '20.000Đ' });
    await expect(laugh20kCard).toBeVisible();
    await laugh20kCard.evaluate((b: HTMLElement) => b.click());
    await expect(canvasContainer).toHaveClass(/mood-happy/);
    await expect(speechBubble).toContainText('Có cơm ăn rồi');

    // Bấm thẻ 100.000Đ: ĐẠI GIA VỈA HÈ
    const richCard = page.locator('.reaction-note').filter({ hasText: '100.000Đ' });
    await expect(richCard).toBeVisible();
    await richCard.evaluate((b: HTMLElement) => b.click());
    await expect(canvasContainer).toHaveClass(/mood-rich/);
    await expect(speechBubble).toContainText('ĐẠI GIA ĐÂY RỒI');
  });

  test('3. Direct touch interaction on 3D beggar', async ({ page }) => {
    const canvasContainer = page.locator('.beggar-canvas');

    const box = await canvasContainer.boundingBox();
    if (box) {
      // Chạm vào đầu ông trên canvas
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.35);
      await page.waitForTimeout(300);
      await expect(canvasContainer).toBeVisible();
    }
  });
});
