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
    vi.advanceTimersByTime(UNDO_MS - 3000); // «2» was offered at 1 s, its 4 s end now
    expect(toasts.list.map((x) => x.text)).toEqual(['«3» deleted.', '«4» deleted.']);
    vi.advanceTimersByTime(3000);
    expect(toasts.list).toEqual([]);
  });
});
