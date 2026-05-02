import { expect, test } from '../fixtures';

test.describe('@slice-04 Semantic search', () => {
  test('semantic mode hits /api/search and ranks by closeness', async ({
    brainq,
    seedEntity,
    page,
  }) => {
    await seedEntity({
      type: 'Idea',
      title: 'Schema as a graph, stored relationally',
      body: 'typed entities + typed edges',
    });
    await seedEntity({
      type: 'Note',
      title: 'Standup',
      body: 'pgvector is fine up to 200k rows without IVF',
    });

    const apiCall = page.waitForResponse((r) => r.url().includes('/api/search'));
    await brainq.search.goto();
    await brainq.search.modeChip('semantic').click();
    await brainq.search.input().fill('graph database for personal notes');
    await apiCall;

    await expect(brainq.search.resultsLabel()).toHaveText(/closest in meaning/i);
    await expect(brainq.search.results().first()).toContainText('Schema as a graph');
  });

  test('structured mode does not hit /api/search', async ({ brainq, seedEntity, page }) => {
    await seedEntity({ type: 'Person', title: 'Iris Okafor' });
    let semanticCalls = 0;
    page.on('response', (r) => {
      if (r.url().includes('/api/search')) semanticCalls++;
    });

    await brainq.search.goto();
    await expect(brainq.search.modeChip('structured')).toHaveAttribute('aria-pressed', 'true');
    await brainq.search.input().fill('Iris');
    await expect(brainq.search.results()).toContainText('Iris');
    expect(semanticCalls).toBe(0);
  });

  test('empty query shows the suggestion list', async ({ brainq }) => {
    await brainq.search.goto();
    await expect(brainq.search.suggestion(0)).toBeVisible();
  });
});
