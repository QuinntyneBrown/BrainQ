import { expect, test } from '../fixtures';

test.describe('@slice-07 Tweaks', () => {
  test('changing theme writes data-theme on :root', async ({ brainq }) => {
    await brainq.app.goto('/today');
    await brainq.tweaks.toggle();
    await brainq.tweaks.theme('dark').click();
    expect((await brainq.tweaks.rootData()).theme).toBe('dark');
  });

  test('changing accent updates --bq-accent custom property', async ({ brainq }) => {
    await brainq.app.goto('/today');
    await brainq.tweaks.toggle();
    const before = (await brainq.tweaks.rootData()).accent;
    await brainq.tweaks.accent('moss').click();
    const after = (await brainq.tweaks.rootData()).accent;
    expect(after).not.toBe(before);
  });

  test('selections persist across reload', async ({ brainq, page }) => {
    await brainq.app.goto('/today');
    await brainq.tweaks.toggle();
    await brainq.tweaks.density('compact').click();
    await page.reload();
    expect((await brainq.tweaks.rootData()).density).toBe('compact');
  });
});
