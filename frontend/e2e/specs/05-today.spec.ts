import { expect, test } from '../fixtures';

test.describe('@slice-05 Today', () => {
  test('shows greeting, capture prompt, commitments, recent', async ({ brainq, seedEntity }) => {
    await seedEntity({
      type: 'Commitment',
      title: 'Read 30 minutes',
      attributes: { cadence: 'daily', target: 30, unit: 'min' },
    });
    await seedEntity({ type: 'Note', title: 'Standup notes' });

    await brainq.today.goto();
    await expect(brainq.today.greeting()).toBeVisible();
    await expect(brainq.today.capturePrompt()).toBeVisible();
    await expect(brainq.today.commitments()).toContainText('Read 30 minutes');
    await expect(brainq.today.recentlyTouched()).toContainText('Standup notes');
  });

  test('overdue person produces a nudge that opens the person on tap', async ({
    brainq,
    seedEntity,
  }) => {
    await seedEntity({ type: 'Person', title: 'Nadia Cole', tags: ['overdue'] });
    await brainq.today.goto();
    await expect(brainq.today.nudges()).toContainText('Nadia Cole');
    await brainq.today.nudges().first().click();
    await expect(brainq.detail.title()).toContainText('Nadia Cole');
  });

  test('capture prompt opens the capture sheet', async ({ brainq }) => {
    await brainq.today.goto();
    await brainq.today.capturePrompt().click();
    await expect(brainq.capture.textarea()).toBeFocused();
  });
});
