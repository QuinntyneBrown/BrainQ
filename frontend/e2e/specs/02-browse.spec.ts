import { expect, test } from '../fixtures';

test.describe('@slice-02 Browse', () => {
  test('Person filter shows RecallQ band; switching filters hides it', async ({
    brainq,
    seedEntity,
  }) => {
    await seedEntity({ type: 'Person', title: 'Nadia Cole', tags: ['overdue'] });
    await seedEntity({ type: 'Project', title: 'Q-Suite consolidation' });

    await brainq.brain.goto();
    await expect(brainq.brain.recallq.band()).toBeVisible();
    await expect(brainq.brain.recallq.overdue().first()).toContainText('Nadia Cole');

    await brainq.brain.chip('Project').click();
    await expect(brainq.brain.recallq.band()).toBeHidden();
    await expect(brainq.brain.rows().first()).toContainText('Q-Suite consolidation');
  });

  test('substring search filters the list', async ({ brainq, seedEntity }) => {
    await seedEntity({ type: 'Person', title: 'Iris Okafor', tags: ['mentor'] });
    await seedEntity({ type: 'Person', title: 'Theo Lindgren' });

    await brainq.brain.goto();
    await brainq.brain.search().fill('iris');
    await expect(brainq.brain.rows()).toHaveCount(1);
    await expect(brainq.brain.rows().first()).toContainText('Iris');
  });

  test('All chip shows every type', async ({ brainq, seedEntity }) => {
    await seedEntity({ type: 'Idea', title: 'Schema as a graph' });

    await brainq.brain.goto();
    await brainq.brain.chip('All').click();
    await expect(brainq.brain.rows().first()).toContainText('Schema as a graph');
  });
});
