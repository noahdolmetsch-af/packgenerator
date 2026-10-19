// TR6 «Gewicht» next to «Wi gaht's?» (0.133.0): one weight for the whole app. Fictional numbers only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb, db } from '../src/lib/db.js';
import { saveWeight } from '../src/lib/weight.svelte.js';
import { saveAnswers } from '../src/lib/abdb.js';
import { WEIGHT_KEY, RIDER_KEY, entriesOf } from '../src/lib/weight.js';

describe('one weight for the whole app', () => {
  it('the newest entry is the body weight Packen and Velos › Setup read', async () => {
    const d = createDb(`w-${Math.random()}`);
    await saveWeight('2026-10-05', 72.4, d);
    expect((await d.settings.get(RIDER_KEY)).value).toBe(72400);
    await saveWeight('2026-09-20', 74, d); // an older day does not change the newest
    expect((await d.settings.get(RIDER_KEY)).value).toBe(72400);
    await saveWeight('2026-10-05', null, d); // removing the newest: the one before counts
    expect((await d.settings.get(RIDER_KEY)).value).toBe(74000);
  });
  it('a weight from «Wi gaht\'s?» becomes that day\'s entry', async () => {
    await saveAnswers([{ id: 'test_data_gtp_w1', qid: 'koerper.waage', day: '2026-10-07', at: '2026-10-07T07:05', value: 71.8 }]);
    expect(entriesOf((await db.settings.get(WEIGHT_KEY)).value)).toEqual([{ day: '2026-10-07', kg: 71.8 }]);
    expect((await db.settings.get(RIDER_KEY)).value).toBe(71800);
  });
});
