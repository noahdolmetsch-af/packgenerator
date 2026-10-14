// WS6 «Wieder sichtbar»: the list under the rings, what counts for «Erholung» and when it was last done.
import { describe, it, expect } from 'vitest';
import { seedActs, flowStates } from '../src/lib/flow.js';
import { restRows } from '../src/lib/flow/restlist.js';

const TODAY = '2026-10-14';
const acts = seedActs();

describe('WS6 restRows', () => {
  it('only the activities of the ring Erholung, with the last day and its minutes', () => {
    const log = [
      { id: 'a', actId: 'sauna', day: '2026-10-10', n: 1, min: 30 },
      { id: 'b', actId: 'sauna', day: '2026-10-03', n: 1, min: 45 },
      { id: 'c', actId: 'yoga', day: '2026-10-12', n: 1, min: 20 },
      { id: 'd', actId: 'sauna', day: '2026-10-20', n: 1 }, // a future entry does not count as «zuletzt»
    ];
    const rows = restRows(flowStates(acts, log, TODAY), log, TODAY);
    expect(rows.map((r) => r.act.id)).toEqual(['sauna']);
    expect(rows[0]).toMatchObject({ done: 1, of: 2, last: { day: '2026-10-10', min: 30 } });
  });

  it('never done: last is null; without minutes: min is null', () => {
    expect(restRows(flowStates(acts, [], TODAY), [], TODAY)[0].last).toBeNull();
    const log = [{ id: 'a', actId: 'sauna', day: '2026-10-13', n: 1 }];
    expect(restRows(flowStates(acts, log, TODAY), log, TODAY)[0].last).toEqual({ day: '2026-10-13', min: null });
  });
});

describe('WS6 German texts', () => {
  it('every new text has a German entry', async () => {
    const DE = (await import('../src/lib/i18n/de/index.js')).default;
    for (const en of ['What counts for recovery', 'Change in Goals', 'last {date}', '{n} min', 'not yet', 'last 7 days']) expect(DE[en], en).toBeTruthy();
  });
});
