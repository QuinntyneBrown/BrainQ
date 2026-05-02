import { expect, test } from '../fixtures';

// A linear walk-through of every feature described in docs/user-guide.
// Run with `video: 'on'` to record a single tour video.
test.use({ viewport: { width: 1440, height: 900 }, video: 'on' });

test.describe('@feature-tour User-guide tour', () => {
  test('every documented feature, end-to-end', async ({ brainq, seedEntity, page }) => {
    // --- seed enough data so every screen has something to show -----------
    const iris = await seedEntity({
      type: 'Person',
      title: 'Iris Okafor',
      body: 'mentor; pairs on schema work',
      tags: ['close'],
    });
    await seedEntity({
      type: 'Person',
      title: 'Nadia Cole',
      body: 'last spoke February',
      tags: ['overdue'],
    });
    await seedEntity({
      type: 'Person',
      title: 'Theo Lindgren',
      body: 'cousin',
      tags: ['family'],
    });
    const readCommit = await seedEntity({
      type: 'Commitment',
      title: 'Read 30 minutes',
      body: 'fiction or non-fiction, anything counts',
      attributes: { cadence: 'daily', target: 30, unit: 'min' },
    });
    await seedEntity({
      type: 'Project',
      title: 'Q-Suite consolidation',
      body: 'merge BrainQ + RecallQ into one shell',
    });
    const seamsNote = await seedEntity({
      type: 'Note',
      title: 'seams note — what Iris said',
      body: 'design seams should hide implementation, not constrain it',
    });
    await seedEntity({
      type: 'Idea',
      title: 'Schema as a graph, stored relationally',
      body: 'typed entities + typed edges in pgvector',
    });

    const beat = (ms = 700) => page.waitForTimeout(ms);

    // --- 1. Getting Started + 2. Navigation: land on Today -----------------
    await brainq.app.goto('/today');
    await expect(brainq.today.greeting()).toBeVisible();
    await expect(brainq.today.capturePrompt()).toBeVisible();
    await beat(1200);

    // --- 4. Today: commitments, nudges, recently touched -------------------
    await expect(brainq.today.streakOf(readCommit.id)).toContainText('0-day streak');
    await expect(brainq.today.nudges().first()).toContainText('Nadia Cole');
    await expect(brainq.today.recentlyTouched().first()).toBeVisible();
    await beat();

    // --- 3. Capture: open from the Today prompt, type, infer, save ---------
    await brainq.today.capturePrompt().click();
    await expect(brainq.capture.textarea()).toBeFocused();
    await brainq.capture.textarea().fill(
      'idea about turning the brain into a public read-only export',
    );
    await expect(brainq.capture.detected()).toContainText(/idea/i);
    await beat(900);
    await brainq.capture.chip('Note').click(); // demonstrate locking the type
    await beat(500);
    await brainq.capture.chip('auto').click(); // back to inference
    await beat(400);
    await brainq.capture.save().click();
    await expect(brainq.app.toast()).toContainText(/saved/i);
    await beat(900);

    // --- 8. Commitments: log today from the Today grid ---------------------
    await expect(brainq.today.streakOf(readCommit.id)).toContainText('0-day streak');
    await brainq.today.toggleCommitment(readCommit.id);
    await expect(brainq.today.streakOf(readCommit.id)).toContainText('1-day streak');
    await beat();

    // --- 5. Brain: list, substring search, type chips, RecallQ -------------
    await brainq.brain.goto();
    await expect(brainq.brain.rows().first()).toBeVisible();
    await beat();
    await brainq.brain.search().fill('iris');
    await expect(brainq.brain.rows().first()).toContainText('Iris');
    await beat(900);
    await brainq.brain.search().fill('');
    await brainq.brain.chip('Person').click();
    await expect(brainq.brain.recallq.band()).toBeVisible();
    await expect(brainq.brain.recallq.overdue()).toContainText('Nadia Cole');
    await beat();

    // --- 7. Detail: open from RecallQ, body + stats card, back -------------
    await brainq.brain.recallq.overdue().first().click();
    await expect(brainq.detail.title()).toContainText('Nadia Cole');
    await beat(900);
    await brainq.detail.back();

    // open Iris from the Brain list to show a Person Detail with body
    await brainq.brain.row(iris.id).click();
    await expect(brainq.detail.title()).toContainText('Iris');
    await beat(1000);
    await brainq.detail.back();

    // --- 8. Commitments: open commitment Detail, see heatmap ---------------
    await brainq.brain.chip('Commitment').click();
    await brainq.brain.row(readCommit.id).click();
    await expect(brainq.detail.title()).toContainText('Read 30 minutes');
    const cells = brainq.detail.heatmapCells();
    await expect(cells.last()).toHaveAttribute('data-band', /[1-4]/);
    await beat(1000);
    await brainq.detail.back();

    // --- 6. Search: structured + suggestions + semantic --------------------
    await brainq.search.goto();
    await expect(brainq.search.suggestion(0)).toBeVisible();
    await beat(800);
    await brainq.search.input().fill('iris');
    await expect(brainq.search.results().first()).toContainText('Iris');
    await beat(900);
    await brainq.search.input().fill('');
    await brainq.search.modeChip('semantic').click();
    await expect(brainq.search.suggestion(0)).toBeVisible();
    await beat(900);

    // --- 9. Tweaks: theme, accent, density ---------------------------------
    await brainq.app.goto('/today');
    await brainq.tweaks.toggle();
    await beat(700);
    await brainq.tweaks.theme('dark').click();
    await beat(800);
    await brainq.tweaks.accent('moss').click();
    await beat(800);
    await brainq.tweaks.density('compact').click();
    await beat(900);
    // restore so the next demo run starts clean
    await brainq.tweaks.theme('light').click();
    await brainq.tweaks.accent('terracotta').click();
    await brainq.tweaks.density('cozy').click();
    await beat(700);

    // --- 10. Troubleshooting: connection-lost banner -----------------------
    await page.route('**/health', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'down', db: 'unreachable' }),
      }),
    );
    await brainq.app.goto('/today');
    await expect(brainq.app.healthBanner()).toBeVisible();
    await beat(1500);
    await page.unroute('**/health');
  });
});
