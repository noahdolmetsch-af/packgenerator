// Gesamttest 20.10.2026: Svelte 5 drops a space at the very start or end of an {#if}/{:else} block, so
// «Ruhig bis 6 Uhr.{#if p} <b>15 von 30</b>{/if}» showed «Uhr.15» and «Monat{#if n} <small>90</small>{/if}»
// showed «Monat90». A space that must stay is written as {' '} (or inside the text: {' · '}).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync("git ls-files 'src/**/*.svelte'", { encoding: 'utf8' }).trim().split('\n');

/** The places where a block starts with one space before text, or ends with text and one space. */
function lost(src) {
  const out = [];
  const from = Math.max(0, src.lastIndexOf('</script>'));
  const re = /\{(#if\b|:else\b)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m.index < from) continue;
    let d = 0;
    let j = m.index;
    for (; j < src.length; j++) {
      if (src[j] === '{') d++;
      else if (src[j] === '}' && !--d) break;
    }
    const next = src.slice(j + 1, j + 3);
    if (next[0] === ' ' && next[1] && !/\s/.test(next[1]) && !/^\{[#:/]/.test(src.slice(j + 2, j + 4))) out.push(src.slice(m.index, j + 20).split('\n')[0]);
    re.lastIndex = j + 1;
  }
  for (const e of src.slice(from).matchAll(/[^\s>}] \{(\/if|:else)/g)) out.push(e[0]);
  return out;
}

describe('spaces at the edge of a Svelte block', () => {
  it('finds the old mistake', () => {
    expect(lost('</script><p>A{#if x} <b>B</b>{/if}</p>')).toHaveLength(1);
    expect(lost("</script><p>A{#if x}{' '}<b>B</b>{/if}</p>")).toHaveLength(0);
    expect(lost('</script><p>{#if x}A · {/if}B</p>')).toHaveLength(1);
  });
  it('no .svelte file loses a space', () => {
    const bad = files.flatMap((f) => lost(readFileSync(f, 'utf8')).map((s) => `${f}: ${s}`));
    expect(bad).toEqual([]);
  });
});
