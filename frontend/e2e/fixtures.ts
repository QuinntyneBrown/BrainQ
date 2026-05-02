import { APIRequestContext, test as base, expect } from '@playwright/test';
import { AppPage } from './pom/app.page';
import { BrainPage } from './pom/brain.page';
import { CaptureSheetPage } from './pom/capture-sheet.page';
import { DetailPage } from './pom/detail.page';
import { SearchPage } from './pom/search.page';
import { TodayPage } from './pom/today.page';
import { TweaksPage } from './pom/tweaks.page';

export interface Brainq {
  app: AppPage;
  today: TodayPage;
  brain: BrainPage;
  search: SearchPage;
  detail: DetailPage;
  capture: CaptureSheetPage;
  tweaks: TweaksPage;
}

export interface SeedEntityInput {
  type: 'Person' | 'Project' | 'Commitment' | 'Note' | 'Idea';
  title?: string;
  body?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

export interface SeededEntity {
  id: string;
  type: string;
  title: string;
}

type SeedEntity = (input: SeedEntityInput) => Promise<SeededEntity>;
type SeedGraph = () => Promise<{ iris: SeededEntity; seamsNote: SeededEntity }>;

export const test = base.extend<{
  brainq: Brainq;
  seedEntity: SeedEntity;
  seedGraph: SeedGraph;
  api: APIRequestContext;
}>({
  api: async ({ playwright }, use) => {
    const baseURL = process.env['BRAINQ_API_URL'] ?? 'http://localhost:5159';
    const ctx = await playwright.request.newContext({ baseURL });
    await use(ctx);
    await ctx.dispose();
  },
  brainq: async ({ page }, use) => {
    await use({
      app: new AppPage(page),
      today: new TodayPage(page),
      brain: new BrainPage(page),
      search: new SearchPage(page),
      detail: new DetailPage(page),
      capture: new CaptureSheetPage(page),
      tweaks: new TweaksPage(page),
    });
  },
  seedEntity: async ({ api }, use) => {
    const created: string[] = [];
    const seed: SeedEntity = async (input) => {
      const text = input.body
        ? `${input.title ?? 'Untitled'}\n\n${input.body}`
        : (input.title ?? 'Untitled');
      const data: Record<string, unknown> = { type: input.type, text };
      if (input.tags && input.tags.length > 0) data['tags'] = input.tags;
      const res = await api.post('/api/entities', { data });
      if (!res.ok()) throw new Error(`seed failed ${res.status()} ${await res.text()}`);
      const body = await res.json();
      created.push(body.id);
      return { id: body.id, type: body.type, title: body.title };
    };
    await use(seed);
    for (const id of created) {
      await api.delete(`/api/entities/${id}`).catch(() => undefined);
    }
  },
  seedGraph: async ({ seedEntity }, use) => {
    const graph: SeedGraph = async () => {
      const iris = await seedEntity({ type: 'Person', title: 'Iris Okafor' });
      const seamsNote = await seedEntity({ type: 'Note', title: 'seams note' });
      return { iris, seamsNote };
    };
    await use(graph);
  },
});

export { expect };
