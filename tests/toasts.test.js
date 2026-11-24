// B22 «Rückgängig gleitet» (Noah 27.10.2026 «1a 2a 3a 4a 5a»): notes stack, each keeps its own Undo.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toasts, offerDone, undoToast, undoRename, closeToast, MAX_TOASTS, UNDO_MS } from '../src/lib/ui/rename.svelte.js';

describe('notes with Undo', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    for (const x of [...toasts.list]) closeToast(x.id);
    vi.useRealTimers();
  });

  it('keeps the Undo of the first delete when a second one follows', async () => {
    const back = [];
    offerDone('«A» deleted.', async () => back.push('A'));
    offerDone('«B» deleted.', async () => back.push('B'));
    expect(toasts.list.map((x) => x.text)).toEqual(['«A» deleted.', '«B» deleted.']);
    await undoToast(toasts.list[0].id);
    expect(back).toEqual(['A']);
    expect(toasts.list.map((x) => x.text)).toEqual(['«B» deleted.']);
    await undoRename();
    expect(back).toEqual(['A', 'B']);
    expect(toasts.list).toEqual([]);
  });

  it('lets an older note without Undo go at once', () => {
    offerDone('Saved.');
    offerDone('«A» deleted.', async () => {});
    expect(toasts.list.map((x) => x.text)).toEqual(['«A» deleted.']);
  });

  it('shows at most three and lets each go after its own time', () => {
    for (let n = 1; n <= MAX_TOASTS + 1; n++) {
      offerDone(`«${n}» deleted.`, async () => {});
      vi.advanceTimersByTime(1000);
    }
    expect(toasts.list.map((x) => x.text)).toEqual(['«2» deleted.', '«3» deleted.', '«4» deleted.']);
    vi.advanceTimersByTime(UNDO_MS - 3000); // «2» was offered at 1 s, its time (UNDO_MS) ends now
    expect(toasts.list.map((x) => x.text)).toEqual(['«3» deleted.', '«4» deleted.']);
    vi.advanceTimersByTime(3000);
    expect(toasts.list).toEqual([]);
  });
});

describe('«Rückgängig» time', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    for (const x of [...toasts.list]) closeToast(x.id);
    vi.useRealTimers();
  });

  it('is 8 seconds', () => {
    expect(UNDO_MS).toBe(8000);
  });

  it('stands still while the note is held and goes on with the rest', async () => {
    const { pauseToast, resumeToast } = await import('../src/lib/ui/rename.svelte.js');
    const id = offerDone('«A» deleted.', async () => {});
    vi.advanceTimersByTime(3000);
    pauseToast(id);
    vi.advanceTimersByTime(60000);
    expect(toasts.list.length).toBe(1);
    resumeToast(id);
    vi.advanceTimersByTime(UNDO_MS - 3000 - 1);
    expect(toasts.list.length).toBe(1);
    vi.advanceTimersByTime(2);
    expect(toasts.list).toEqual([]);
  });
});

describe('a note with a second button', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    for (const x of [...toasts.list]) closeToast(x.id);
    vi.useRealTimers();
  });

  it('shows its label, runs the action once and goes', async () => {
    const { actToast } = await import('../src/lib/ui/rename.svelte.js');
    let n = 0;
    const id = offerDone('Saved.', async () => {}, UNDO_MS, { label: 'View', run: () => n++ });
    expect(toasts.list[0].action).toBe('View');
    await actToast(id);
    expect(n).toBe(1);
    expect(toasts.list).toEqual([]);
  });
});
