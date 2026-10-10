#!/usr/bin/env node
// Wächter: the style lint (skill packgenerator-einheitlich, part 3). It reads every component's
// <style> block, its inline style="…" / style:prop=… attributes and the extra .css files under src/
// and counts four kinds of violations per file:
//   colour     a hex, rgb()/rgba() or hsl()/hsla() colour outside src/app.css (use a var(--…) token)
//   breakword  overflow-wrap: anywhere / word-break: break-all (words break mid-letter, «Di ch tm ilc h»)
//   global     a component defines its own `.x {` rule for a class that src/app.css defines globally
//              (the `.sw` bug: a label took the 10 px colour swatch and showed one letter per line)
//   fontsize   a font size that is not a type-scale token var(--fs-…) (also in the `font:` shorthand)
//
// Today's violations live in tests/guard-baseline.json (section "style": file → rule → count).
// tests/style-lint.test.js fails only when a file has MORE than its baseline. The baseline may only
// shrink, unless a PR explains why (docs/design-audit.md «Wächter»).
//
//   node scripts/style-lint.mjs             print the summary and every violation above the baseline
//   node scripts/style-lint.mjs --update    write today's counts to the "style" section of the baseline
//   node scripts/style-lint.mjs --merge-e2e merge the layout fragments of a `GUARD_UPDATE=1` Playwright
//                                           run (test-results/guard/*.json) into the "layout" section
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const BASELINE = join(ROOT, 'tests/guard-baseline.json');
export const RULES = ['colour', 'breakword', 'global', 'fontsize'];
/**
 * v0.67.0 «Übergänge 1» (Noah Ü2a, Mitziehen): what a release builds or brings onto the kit is STRICT:
 * no baseline, every rule must be 0 (style lint here; the Konsistenz-Test also: at most one main
 * button). Everything still in the baseline is «noch umbauen» (docs/design-audit.md), one release at a time.
 */
export const STRICT_STYLE = [
  'src/lib/ui/StepBar.svelte',
  'src/lib/ui/MainBar.svelte',
  'src/lib/ui/PageHead.svelte',
  'src/lib/ui/Empty.svelte',
  'src/lib/ui/Celebrate.svelte',
  'src/lib/ui/Interstitial.svelte',
  'src/lib/trip/TripBand.svelte',
  'src/lib/trip/EndTripSheet.svelte',
  'src/lib/home/Continue.svelte',
  'src/pages/Between.svelte',
  'src/lib/care/KmBook.svelte',
  'src/lib/care/KmImport.svelte',
  'src/lib/care/KmChips.svelte',
  'src/lib/care/Q1Status.svelte',
  'src/lib/care/StartPointDialog.svelte',
  'src/lib/home/KmCard.svelte',
  // v0.69.0 «Velo-Blätter»
  'src/lib/bikes/SheetFolder.svelte',
  'src/lib/bikes/SheetView.svelte',
  // v0.70.0 «Velo-Blätter Teil 2»
  'src/lib/bikes/SheetMore.svelte',
];
/** The routes of the trip pages and interstitials (tests/e2e/guard.spec.js), strict in the same way. */
export const STRICT_ROUTES = ['#/pack', '#/pack?day', '#/ride', '#/debrief/test_data_gtp_Napf', '#/trip/test_data_gtp_Herbstrunde/packed', '#/trip/test_data_gtp_Napf/ended', '#/trip/test_data_gtp_Napf/debriefed', '#/bikes?tab=care&view=import&bike=test_data_gtp_spark', '#/bikes?bike=test_data_gtp_spark&sheet=all', '#/bikes?bike=test_data_gtp_spark&sheet=pass', '#/bikes?bike=test_data_gtp_spark&sheet=order', '#/bikes?bike=test_data_gtp_spark&sheet=pickup'];
/** «noch umbauen»: every file the baseline still lists (not strict), most violations first. */
export const stillToRebuild = (base = {}) =>
  Object.entries(base)
    .filter(([f]) => !STRICT_STYLE.includes(f))
    .map(([f, c]) => [f, Object.values(c).reduce((a, b) => a + b, 0)])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

/** The rules of the Konsistenz-Test (tests/e2e/guard.spec.js); primary is reported only. */
export const LAYOUT_RULES = ['hscroll', 'wordbreak', 'target', 'h1', 'primary'];

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

/** CSS without comments, the line numbers kept. */
const noComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

/** The class names src/app.css styles with a selector that is exactly one class (`.sw`, `.btn`). */
export function globalClasses(appCss) {
  const out = new Set();
  const css = noComments(appCss);
  for (const m of css.matchAll(/([^{}]+)\{/g)) {
    for (const sel of m[1].split(',')) {
      const s = sel.trim();
      const one = s.match(/^\.([a-zA-Z_][\w-]*)$/);
      if (one) out.add(one[1]);
    }
  }
  return out;
}

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/;
const FUNC = /\b(?:rgba?|hsla?)\s*\(/i;
const SIZE = /(?:^|[\s/(,])-?\d*\.?\d+(?:px|rem|em|pt|%|vw|vh|ch|ex)\b|\b(?:xx-small|x-small|small|medium|large|x-large|xx-large|smaller|larger)\b/;
const OK_SIZE = /^\s*(?:inherit|initial|unset|revert|var\(--fs-[\w-]+\))\s*(?:!important)?\s*$/;

/** The violations of one declaration (prop: value). */
export function checkDecl(prop, value, { colours = true, fonts = true } = {}) {
  const p = prop.trim().toLowerCase();
  const v = value.trim();
  const out = [];
  if (p.startsWith('--')) return out; // a custom property defines a token, it is checked where it is used
  if ((p === 'overflow-wrap' || p === 'word-wrap') && /\banywhere\b/i.test(v)) out.push('breakword');
  if (p === 'word-break' && /\bbreak-all\b/i.test(v)) out.push('breakword');
  // var(--x, #fff) fallbacks count too: the literal is still a colour outside the tokens
  if (colours && (HEX.test(v) || FUNC.test(v))) out.push('colour');
  if (fonts && p === 'font-size' && !OK_SIZE.test(v)) out.push('fontsize');
  if (fonts && p === 'font') {
    // the shorthand: a size outside var(…) («500 15px/1.25 var(--font-body)»); `font: inherit` is fine
    const bare = v.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, ' ');
    if (SIZE.test(bare) && !/^\s*(?:inherit|initial|unset)\s*$/.test(v)) out.push('fontsize');
  }
  return out;
}

/** Every declaration of a CSS text: { prop, value, line, selector }. */
export function declarations(css, lineOffset = 0) {
  const out = [];
  const clean = noComments(css);
  // innermost blocks: selector { decls }
  for (const m of clean.matchAll(/([^{};]*)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    if (selector.startsWith('@font-face')) continue;
    let pos = m.index + m[0].indexOf('{') + 1;
    for (const part of m[2].split(';')) {
      const i = part.indexOf(':');
      if (i > 0) {
        const lead = part.length - part.trimStart().length;
        const line = lineOffset + clean.slice(0, pos + lead).split('\n').length;
        out.push({ prop: part.slice(0, i), value: part.slice(i + 1), line, selector });
      }
      pos += part.length + 1;
    }
  }
  return out;
}

/** The violations of one file: [{ rule, line, text }]. */
export function lintFile(path, source, globals) {
  const rel = relative(ROOT, path).split('\\').join('/');
  const isApp = rel === 'src/app.css';
  const out = [];
  const add = (rule, line, text) => out.push({ rule, line, text: text.replace(/\s+/g, ' ').trim().slice(0, 120) });
  const lintCss = (css, offset, { scoped }) => {
    for (const d of declarations(css, offset)) {
      for (const rule of checkDecl(d.prop, d.value, { colours: !isApp, fonts: !(isApp && d.selector.startsWith(':root')) })) add(rule, d.line, `${d.prop.trim()}: ${d.value.trim()}`);
    }
    if (!scoped) return;
    const clean = noComments(css);
    for (const m of clean.matchAll(/([^{}]+)\{/g)) {
      for (const sel of m[1].split(',')) {
        const one = sel.trim().match(/^\.([a-zA-Z_][\w-]*)$/);
        if (one && globals.has(one[1])) add('global', offset + clean.slice(0, m.index + m[0].indexOf(m[1]) + m[1].indexOf(sel) + 1).split('\n').length, `.${one[1]} { … } also defined in src/app.css`);
      }
    }
  };
  if (path.endsWith('.css')) {
    lintCss(source, 0, { scoped: false });
    return out;
  }
  // .svelte: the <style> blocks, then the markup's inline styles
  let markup = source;
  for (const m of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const offset = source.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length - 1;
    lintCss(m[1], offset, { scoped: true });
    markup = markup.replace(m[0], m[0].replace(/[^\n]/g, ' '));
  }
  markup = markup.replace(/<script[^>]*>[\s\S]*?<\/script>/g, (s) => s.replace(/[^\n]/g, ' '));
  const lineAt = (i) => markup.slice(0, i).split('\n').length;
  // style="a: b; c: d" (values may hold {expressions})
  for (const m of markup.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const body = m[1] ?? m[2];
    for (const part of body.split(/;(?![^{]*\})/)) {
      const i = part.indexOf(':');
      if (i > 0) for (const rule of checkDecl(part.slice(0, i), part.slice(i + 1))) add(rule, lineAt(m.index), `style="${part.trim()}"`);
    }
  }
  // style:prop="value" or style:prop={value}
  for (const m of markup.matchAll(/\sstyle:([\w-]+)(?:\|important)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g)) {
    for (const rule of checkDecl(m[1], m[2] ?? m[3] ?? m[4])) add(rule, lineAt(m.index), `style:${m[1]}=${(m[2] ?? m[3] ?? m[4]).trim()}`);
  }
  return out;
}

/** Lint all of src/: { file: [violations] } (files without violations left out). */
export function lintAll() {
  const appCss = readFileSync(join(ROOT, 'src/app.css'), 'utf8');
  const globals = globalClasses(appCss);
  const files = walk(join(ROOT, 'src')).filter((p) => /\.(svelte|css)$/.test(p)).sort();
  const result = {};
  for (const f of files) {
    const v = lintFile(f, readFileSync(f, 'utf8'), globals);
    if (v.length) result[relative(ROOT, f).split('\\').join('/')] = v;
  }
  return result;
}

/** file → rule → count */
export const countsOf = (result) =>
  Object.fromEntries(
    Object.entries(result).map(([f, vs]) => [f, Object.fromEntries(RULES.map((r) => [r, vs.filter((v) => v.rule === r).length]).filter(([, n]) => n > 0))]),
  );

export function readBaseline() {
  return existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : { style: {}, layout: {} };
}
const sortObj = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k] && typeof o[k] === 'object' ? sortObj(o[k]) : o[k]]));
export function writeBaseline(b) {
  const out = { _readme: b._readme ?? README, style: sortObj(b.style ?? {}), layout: sortObj(b.layout ?? {}) };
  writeFileSync(BASELINE, `${JSON.stringify(out, null, 2)}\n`);
}
const README =
  'Wächter baseline (docs/design-audit.md «Wächter»): the violations that existed when the checks came in. A check fails only when a file or route gets MORE than listed here. The numbers may only shrink; a PR that raises one explains why. style: file → rule → count (scripts/style-lint.mjs --update). layout: route@width → rule → count (GUARD_UPDATE=1 playwright run, then scripts/style-lint.mjs --merge-e2e).';

/**
 * Compare counts with a baseline section: { worse: [{ key, rule, now, was }], better: [...] }.
 * A key missing from the baseline has a baseline of 0 for every rule.
 */
export function compare(counts, base = {}, rules = RULES) {
  const worse = [];
  const better = [];
  const keys = new Set([...Object.keys(counts), ...Object.keys(base)]);
  for (const key of [...keys].sort()) {
    for (const rule of rules) {
      const now = counts[key]?.[rule] ?? 0;
      const was = base[key]?.[rule] ?? 0;
      if (now > was) worse.push({ key, rule, now, was });
      else if (now < was) better.push({ key, rule, now, was });
    }
  }
  return { worse, better };
}

/** Totals per rule and the files (or routes) with the most violations. */
export function summary(counts, rules = RULES, top = 10) {
  const totals = Object.fromEntries(rules.map((r) => [r, 0]));
  const per = [];
  for (const [key, c] of Object.entries(counts)) {
    let n = 0;
    for (const r of rules) {
      totals[r] += c[r] ?? 0;
      n += c[r] ?? 0;
    }
    if (n) per.push([key, n, c]);
  }
  per.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const lines = [`totals: ${rules.map((r) => `${r} ${totals[r]}`).join(', ')} (in ${per.length} places)`];
  for (const [key, n, c] of per.slice(0, top)) lines.push(`  ${String(n).padStart(4)}  ${key}  (${rules.filter((r) => c[r]).map((r) => `${r} ${c[r]}`).join(', ')})`);
  return { totals, top: per.slice(0, top), text: lines.join('\n') };
}

/** Merge the layout fragments of a GUARD_UPDATE=1 Playwright run into the baseline. */
function mergeE2e() {
  const dir = join(ROOT, 'test-results/guard');
  if (!existsSync(dir)) throw new Error('test-results/guard is missing: run GUARD_UPDATE=1 npx playwright test tests/e2e/guard.spec.js first');
  const b = readBaseline();
  const layout = { ...(b.layout ?? {}) }; // a partial run (one device) keeps the other views
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) Object.assign(layout, JSON.parse(readFileSync(join(dir, f), 'utf8')));
  b.layout = Object.fromEntries(Object.entries(layout).filter(([, c]) => Object.values(c).some((n) => n > 0)));
  writeBaseline(b);
  console.log(`layout baseline: ${Object.keys(layout).length} route views merged\n${summary(b.layout, LAYOUT_RULES, 10).text}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--merge-e2e')) {
    mergeE2e();
  } else {
    const result = lintAll();
    const counts = countsOf(result);
    const b = readBaseline();
    if (process.argv.includes('--update')) {
      b.style = counts;
      writeBaseline(b);
      console.log('style baseline written');
    }
    console.log(`Style lint\n${summary(counts, RULES, 10).text}`);
    console.log(`Konsistenz-Test baseline (route@width)\n${summary(b.layout ?? {}, LAYOUT_RULES, 10).text}`);
    const { worse, better } = compare(counts, b.style);
    for (const w of worse) {
      console.log(`NEW ${w.rule} in ${w.key}: ${w.now} (baseline ${w.was})`);
      for (const v of result[w.key].filter((v) => v.rule === w.rule)) console.log(`    ${w.key}:${v.line}  ${v.text}`);
    }
    for (const x of better) console.log(`can shrink: ${x.key} ${x.rule} ${x.was} → ${x.now}`);
    if (worse.length) process.exitCode = 1;
  }
}
