import { expect, test } from '../fixtures';

test.describe('@slice-03 Detail + edges', () => {
  test('outbound + inbound edges render', async ({ brainq, seedGraph }) => {
    const { iris, seamsNote } = await seedGraph();
    await brainq.brain.goto();
    await brainq.detail.open(iris.id);
    await expect(brainq.detail.connections()).toContainText(seamsNote.title);

    await brainq.detail.back();
    await brainq.detail.open(seamsNote.id);
    await expect(brainq.detail.mentionedBy()).toContainText('Iris');
  });

  test('xl: neighborhood graph centers on open entity, click navigates', async ({
    brainq,
    seedGraph,
    page,
  }) => {
    const { iris, seamsNote } = await seedGraph();
    await page.setViewportSize({ width: 1440, height: 900 });
    await brainq.brain.goto();
    await brainq.detail.open(iris.id);
    await brainq.detail.graphNode(seamsNote.id).click();
    await expect(brainq.detail.title()).toContainText('seam');
  });

  test('delete removes entity and its edges, returns to list', async ({ brainq, seedEntity }) => {
    const note = await seedEntity({ type: 'Note', text: 'temporary thought' });
    await brainq.brain.goto();
    await brainq.detail.open(note.id);
    await brainq.detail.more();
    await brainq.detail.delete();
    await expect(brainq.brain.row(note.id)).toHaveCount(0);
  });
});
