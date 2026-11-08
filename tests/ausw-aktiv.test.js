import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// «Auswerten aufräumen» 3 (Noah 07.11.2026 «5a»): a list pinned to «Aktiv» stands on Aktiv, not on Auswerten;
// the three explaining lines under «Deine Fragen» are one folded line
describe('pinned lists of place «active»', () => {
  const flow = readFileSync('src/pages/Flow.svelte', 'utf8');
  const ausw = readFileSync('src/pages/AuswertenStart.svelte', 'utf8');
  it('are shown on Aktiv', () => {
    expect(flow).toContain('<PinnedLists place="active" />');
  });
  it('are no longer shown on Auswerten', () => {
    expect(ausw).not.toContain('PinnedLists');
  });
});

describe('the explanation under «Your questions»', () => {
  const ausw = readFileSync('src/pages/AuswertenStart.svelte', 'utf8');
  it('sits in a closed fold with its three lines', () => {
    const m = ausw.match(/<details class="whyf"[^>]*>([\s\S]*?)<\/details>/);
    expect(m).toBeTruthy();
    expect(m[0]).not.toMatch(/<details[^>]*\sopen/);
    expect(m[1]).toContain('Why questions? Where do I see the answers?');
    expect((m[1].match(/<li>/g) || []).length).toBe(3);
  });
});
