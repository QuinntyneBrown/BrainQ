import { expect, test } from '../fixtures';

test.describe('@slice-06 Commitment activity', () => {
  test('logging today increments streak and reflects on heatmap', async ({
    brainq,
    seedEntity,
  }) => {
    const c = await seedEntity({
      type: 'Commitment',
      title: 'Read 30 minutes',
      attributes: { cadence: 'daily', target: 30, unit: 'min' },
    });

    await brainq.today.goto();
    await expect(brainq.today.streakOf(c.id)).toContainText('0-day streak');
    await brainq.today.toggleCommitment(c.id);
    await expect(brainq.today.streakOf(c.id)).toContainText('1-day streak');

    await brainq.detail.open(c.id);
    const cells = brainq.detail.heatmapCells();
    const todayCell = cells.last();
    await expect(todayCell).toHaveAttribute('data-band', /[1-4]/);
  });

  test('double-log of the same day is a no-op (upsert)', async ({ brainq, seedEntity }) => {
    const c = await seedEntity({
      type: 'Commitment',
      title: 'Run or walk',
      attributes: { cadence: 'daily', target: 5, unit: 'km' },
    });
    await brainq.today.goto();
    await brainq.today.toggleCommitment(c.id);
    await brainq.today.toggleCommitment(c.id);
    await expect(brainq.today.streakOf(c.id)).toContainText('1-day streak');
  });
});
