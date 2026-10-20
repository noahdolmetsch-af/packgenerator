// Noah 20.10.2026 «2a 3a»: deleting an activity keeps its history or takes it along, «Undo» puts all back,
// a kept one comes back with «Restore» or goes for good. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { ensureSeed, tick, removeAct, undoAct, restoreAct, dropGone, undoDrop, GONE_KEY } from '../src/lib/flowdb.js';
import { seedActs } from '../src/lib/flow.js';
import DE from '../src/lib/i18n/de/index.js';

const T = '2026-10-20';
const RUN = seedActs().find((a) => a.id === 'run');
const gone = async (db) => (await db.settings.get(GONE_KEY))?.value ?? [];

describe('delete an activity of «Heute abhaken»', () => {
  it('keep: the tile goes, the ticks stay, Undo and Restore bring it back', async () => {
    const db = createDb('ak-1');
    await ensureSeed(db);
    await tick(db, RUN, { day: T });
    const saved = await removeAct(db, 'run', { keep: true });
    expect(await db.flowActs.get('run')).toBeUndefined();
    expect(await db.flowLog.count()).toBe(1);
    expect((await gone(db)).map((a) => a.id)).toEqual(['run']);
    await undoAct(db, saved);
    expect(await db.flowActs.get('run')).toBeTruthy();
    expect(await gone(db)).toEqual([]);
    await removeAct(db, 'run', { keep: true });
    await restoreAct(db, 'run');
    const back = await db.flowActs.get('run');
    expect(back.goneAt).toBeUndefined();
    expect(back.order).toBe(Math.max(...(await db.flowActs.toArray()).map((a) => a.order)));
    expect(await db.flowLog.count()).toBe(1);
  });
  it('with history: the ticks go too, Undo puts them back', async () => {
    const db = createDb('ak-2');
    await ensureSeed(db);
    await tick(db, RUN, { day: T });
    const saved = await removeAct(db, 'run');
    expect(await db.flowActs.get('run')).toBeUndefined();
    expect(await db.flowLog.count()).toBe(0);
    await undoAct(db, saved);
    expect(await db.flowActs.get('run')).toBeTruthy();
    expect(await db.flowLog.count()).toBe(1);
  });
  it('a kept one can go for good, with Undo', async () => {
    const db = createDb('ak-3');
    await ensureSeed(db);
    await tick(db, RUN, { day: T });
    await removeAct(db, 'run', { keep: true });
    const saved = await dropGone(db, 'run');
    expect(await gone(db)).toEqual([]);
    expect(await db.flowLog.count()).toBe(0);
    await undoDrop(db, saved);
    expect((await gone(db)).map((a) => a.id)).toEqual(['run']);
    expect(await db.flowLog.count()).toBe(1);
  });
  it('every new text has German', () => {
    for (const k of ['Edit|acts', 'Activities|tab', 'Activities|flow', 'Keep the history', 'Delete with history', 'Deleted, history kept', 'Hide tile', 'Hide']) expect(DE[k], k).toBeTruthy();
  });
});
