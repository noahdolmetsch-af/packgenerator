// Etappe 6 (Querschnitt, E6-005): --brand is a dark ground colour (#12372f in light, #0a1411 in dark). Used as a text
// colour it works in the light theme only: in the dark theme the Kochen tips («Ändern», «Frühstück»), «Schritt 1 von 5» in
// the cooking mode and the «Live» label were dark on dark. Text colour comes from --ink, --head or --accent.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Places where --brand is a text colour on purpose: an icon on a light round button (--brand-ink-2). May only get shorter. */
const ON_LIGHT = {
  'src/lib/flow/FlowLayer.svelte': 'play/pause icon on a round button with background var(--brand-ink-2)',
  'src/lib/timer/TimerFloat.svelte': 'play/pause icon on a round button with background var(--brand-ink-2)',
};

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(svelte|css)$/.test(p)) yield p;
  }
}

describe('text colours work in the dark theme', () => {
  it('no text uses var(--brand) as its colour, except the listed ones', () => {
    const bad = [];
    for (const f of files('src')) {
      const n = (readFileSync(f, 'utf8').match(/^\s*color:\s*var\(--brand\)/gm) ?? []).length;
      if (n && !ON_LIGHT[f.replaceAll('\\', '/')]) bad.push(`${f}: ${n}× color: var(--brand)`);
    }
    expect(bad, 'use var(--ink), var(--head) or var(--accent); --brand is a dark ground colour').toEqual([]);
  });

  it('lists only files that still do it', () => {
    for (const f of Object.keys(ON_LIGHT)) expect(/^\s*color:\s*var\(--brand\)/m.test(readFileSync(f, 'utf8')), `${f} no longer needs its entry`).toBe(true);
  });
});
