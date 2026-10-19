// «Rückmeldungen» (Noah 19.10.2026 «1a 2a 3a 4b»): a second tap while saving does nothing and never
// submits the form the browser's way; a failed save says why (a full device gets its own sentence);
// a deleted bill comes back once with «Undo». Fictional data only.
import { describe, it, expect, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { createDb } from '../src/lib/db.js';
import { once, saveFailed } from '../src/lib/ui/ask.js';
import { addBill, listBills, deleteBill, restoreBill } from '../src/lib/pay/bills.js';

describe('once', () => {
  it('runs one save at a time and stops the browser submit on every tap', async () => {
    let release;
    const run = vi.fn(() => new Promise((ok) => (release = ok)));
    const save = once(run);
    const ev = () => ({ preventDefault: vi.fn() });
    const a = ev();
    const b = ev();
    const first = save(a);
    await save(b); // while the first still runs
    expect(run).toHaveBeenCalledTimes(1);
    expect(a.preventDefault).toHaveBeenCalled();
    expect(b.preventDefault).toHaveBeenCalled();
    release();
    await first;
    const third = save(ev());
    release();
    await third;
    expect(run).toHaveBeenCalledTimes(2);
  });
  it('is free again after an error', async () => {
    const save = once(async () => {
      throw new Error('x');
    });
    await expect(save()).rejects.toThrow('x');
    await expect(save()).rejects.toThrow('x');
  });
});

describe('saveFailed', () => {
  it('names a full device, otherwise says what to do next', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(saveFailed({ name: 'QuotaExceededError' })).toMatch(/storage is full/);
    expect(saveFailed({ name: 'AbortError', inner: { name: 'QuotaExceededError' } })).toMatch(/storage is full/);
    expect(saveFailed(new Error('x'))).toMatch(/Save backup/);
    quiet.mockRestore();
  });
});

describe('a deleted bill', () => {
  it('comes back once with Undo', async () => {
    const db = createDb('rueckmeldungen-bills');
    await db.open();
    const b = await addBill({ to: 'Test Velowerkstatt', iban: 'CH4431999123000889012', amount: 4500 }, db, '2026-10-19');
    const gone = await deleteBill(b.id, db);
    expect(gone.id).toBe(b.id);
    expect(await listBills(db)).toHaveLength(0);
    await restoreBill(gone, db);
    await restoreBill(gone, db);
    expect((await listBills(db)).map((x) => x.id)).toEqual([b.id]);
  });
});
