import { expect, test } from '../fixtures';

test.describe('@slice-08 Ops', () => {
  test('XSS body does not execute when rendered on detail screen', async ({ brainq, seedEntity, page }) => {
    const e = await seedEntity({
      type: 'Note',
      title: 'XSS test',
      body: '<script>window.__pwn=1</script>',
    });
    await brainq.detail.open(e.id);
    const pwn = await page.evaluate(() => (window as unknown as { __pwn?: number }).__pwn);
    expect(pwn).toBeUndefined();
  });

  test('API down banner appears when /health returns 503', async ({ brainq, page }) => {
    await page.route('**/health', (route) =>
      route.fulfill({ status: 503, body: JSON.stringify({ status: 'down', db: 'unreachable' }) }),
    );
    await brainq.app.goto('/today');
    await expect(page.getByTestId('health-banner')).toBeVisible();
  });
});
