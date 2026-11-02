<script>
  /**
   * «Was hängt zusammen?» (D5, Noah 27.10.2026 «4a»: mit Versatz und als Liste), under «Eigenes Diagramm»:
   * one value across, one up, each point a day; the second value on the same day, the day after (the
   * night after) or two days later; the days of an activity in colour. In words: how strong, how much per
   * step, how many days; then the strongest links in your data as a list (a tap shows it). The diagram's
   * filter counts here too. Only an observation: it never says what causes what.
   * groups, byKey; days: the diagram's days; keep: the diagram filter; ticks: Map actId → days;
   * acts: [{ id, name }] most ticked first; onday(day): opens the day.
   */
  import Seg from '../../lib/ui/Seg.svelte';
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { OFFSETS, pairsOf, fitOf, strengthOf, niceStep, strongest } from '../../lib/analyse/links.js';
  import { t, num } from '../../lib/i18n.svelte.js';

  let { groups = [], byKey = new Map(), days = [], keep = null, ticks = new Map(), acts = [], onday } = $props();

  const LS = 'pg.analyse.links';
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
    } catch {
      return {};
    }
  })();
  let xKey = $state(typeof saved.x === 'string' ? saved.x : 'azm');
  let yKey = $state(typeof saved.y === 'string' ? saved.y : 'sleep');
  let color = $state(typeof saved.color === 'string' ? saved.color : null);
  let offset = $state(OFFSETS.includes(saved.offset) ? saved.offset : 1);
  $effect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ x: xKey, y: yKey, color, offset }));
    } catch {
      /* a private window: only for now */
    }
  });

  const usable = $derived(groups.map((g) => ({ ...g, items: g.items.filter((it) => !it.later && it.get) })).filter((g) => g.items.length));
  const xIt = $derived(byKey.get(xKey) ?? byKey.get('azm') ?? usable[0]?.items[0]);
  const yIt = $derived(byKey.get(yKey) ?? byKey.get('sleep') ?? usable[0]?.items[1]);
  const colorId = $derived(color ?? acts[0]?.id ?? null);
  const colored = $derived(colorId ? (ticks.get(colorId) ?? new Set()) : new Set());
  const colorName = $derived(acts.find((a) => a.id === colorId)?.name ?? '');
  const pairs = $derived(xIt && yIt ? pairsOf(days, xIt.get, yIt.get, offset, keep) : []);
  const fit = $derived(fitOf(pairs));
  const word = $derived(fit ? strengthOf(fit.r) : null);
  const list = $derived(
    strongest(
      usable.flatMap((g) => g.items.map((it) => ({ ...it, group: g.key }))),
      days,
      { keep },
    ),
  );

  // the picture
  const W = 600;
  const H = 320;
  const PAD = 14;
  const box = (vals) => {
    if (!vals.length) return { lo: 0, hi: 1 };
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return hi === lo ? { lo: lo - 1, hi: hi + 1 } : { lo, hi };
  };
  const bx = $derived(box(pairs.map((p) => p.x)));
  const by = $derived(box(pairs.map((p) => p.y)));
  const px = (x) => PAD + ((x - bx.lo) / (bx.hi - bx.lo)) * (W - 2 * PAD);
  const py = (y) => H - PAD - ((y - by.lo) / (by.hi - by.lo)) * (H - 2 * PAD);

  // texts
  const WORDS = { none: 'none|link', weak: 'weak|link', medium: 'medium|link', strong: 'strong|link' };
  const OFF_NAMES = { 0: 'the same day|link', 1: 'the day after (night after)|link', 2: 'two days later|link' };
  const offOpts = $derived(OFFSETS.map((o) => ({ key: String(o), name: t(OFF_NAMES[o]) })));
  const v = (it, val) => valueText(it, val, num);
  const step = $derived(fit ? niceStep(fit.sdx) : 1);
  const perStep = $derived.by(() => {
    if (!fit) return '';
    const dy = fit.b * step;
    const sign = dy > 0 ? '+' : dy < 0 ? '−' : '±';
    const amount = yIt.key === 'sleep' ? `${num(Math.round(Math.abs(dy)))} min` : `${v(yIt, Math.abs(dy))}${unitText(yIt) ? ` ${unitText(yIt)}` : ''}`;
    return { big: `${sign}${amount}`, small: t('{y} per {step} {x}|link', { y: yIt.name, step: `${xIt.key === 'sleep' ? `${num(step)} min` : num(step)}${xIt.key !== 'sleep' && unitText(xIt) ? ` ${unitText(xIt)}` : ''}`, x: xIt.name }) };
  });
  const sentence = $derived.by(() => {
    if (!fit || word === 'none') return t('In these days {x} and {y} go their own ways.|link', { x: xIt.name, y: yIt.name });
    const up = fit.r > 0;
    return t(up ? 'On days with more {x}, {y} is a little higher {when}.|link' : 'On days with more {x}, {y} is a little lower {when}.|link', { x: xIt.name, y: yIt.name, when: t(OFF_NAMES[offset]) });
  });
  const colorLine = $derived.by(() => {
    if (!fit || !colorName) return '';
    const on = pairs.filter((p) => colored.has(p.d));
    if (on.length < 3) return '';
    const above = on.filter((p) => p.y > fit.a + fit.b * p.x).length;
    if (above / on.length >= 0.65) return t('{name} days (orange) lie mostly above the line.|link', { name: colorName });
    if (above / on.length <= 0.35) return t('{name} days (orange) lie mostly below the line.|link', { name: colorName });
    return t('{name} days (orange) lie on both sides of the line.|link', { name: colorName });
  });
  const show = (l) => {
    xKey = l.x;
    yKey = l.y;
    offset = l.offset;
  };
  const itemName = (k) => byKey.get(k)?.name ?? k;
</script>

<section class="card zh" aria-labelledby="zh-h" data-links>
  <div>
    <h2 id="zh-h">{t('What goes together?|link')}</h2>
    <p class="sub">{t('One value against another. Each point is a day.|link')}</p>
  </div>
  <div class="two">
    <div class="left">
      <div class="sels">
        <label>
          <span class="pl">{t('Across|link')}</span>
          <select class="sel" bind:value={xKey} data-link-x>
            {#each usable as g (g.key)}<optgroup label={g.name}>{#each g.items as it (it.key)}<option value={it.key}>{it.name}</option>{/each}</optgroup>{/each}
          </select>
        </label>
        <label>
          <span class="pl">{t('Up|link')}</span>
          <select class="sel" bind:value={yKey} data-link-y>
            {#each usable as g (g.key)}<optgroup label={g.name}>{#each g.items.filter((it) => !it.tick) as it (it.key)}<option value={it.key}>{it.name}</option>{/each}</optgroup>{/each}
          </select>
        </label>
        {#if acts.length}
          <label>
            <span class="pl">{t('Colour|link')}</span>
            <select class="sel" value={colorId ?? ''} onchange={(e) => (color = e.currentTarget.value || '')} data-link-color>
              <option value="">{t('none|filter')}</option>
              {#each acts as a (a.id)}<option value={a.id}>{t('{name} day|link', { name: a.name })}</option>{/each}
            </select>
          </label>
        {/if}
      </div>
      <div class="off">
        <span class="pl" id="zh-off">{t('{y} from|link', { y: yIt?.name ?? '' })}</span>
        <Seg options={offOpts} value={String(offset)} onchange={(o) => (offset = Number(o))} labelledby="zh-off" full={false} />
      </div>
      {#if pairs.length}
        <div class="plot">
          <div class="ya" aria-hidden="true"><span>{v(yIt, by.hi)}</span><span>{v(yIt, by.lo)}</span></div>
          <svg viewBox="0 0 {W} {H}" role="img" aria-label={t('{x} against {y}|link', { x: xIt.name, y: yIt.name })}>
            {#each [0.25, 0.5, 0.75] as g (g)}<line class="grid" x1={PAD} x2={W - PAD} y1={PAD + g * (H - 2 * PAD)} y2={PAD + g * (H - 2 * PAD)} />{/each}
            {#each pairs as p (p.d)}
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
              <circle class="pt" class:on={colored.has(p.d)} cx={px(p.x)} cy={py(p.y)} r={colored.has(p.d) ? 6 : 4.5} onclick={() => onday?.(p.d)}><title>{p.d}</title></circle>
            {/each}
            {#if fit}<line class="fit" x1={px(bx.lo)} y1={py(fit.a + fit.b * bx.lo)} x2={px(bx.hi)} y2={py(fit.a + fit.b * bx.hi)} />{/if}
          </svg>
        </div>
        <div class="xa" aria-hidden="true"><span>{v(xIt, bx.lo)}</span><span>{xIt.name}{#if unitText(xIt)}&nbsp;({unitText(xIt)}){/if}</span><span>{v(xIt, bx.hi)}</span></div>
        <p class="hint">{t('The filter of the diagram counts here too. Tap a point for its day.|link')}</p>
      {:else}
        <p class="hint" role="status">{t('No day has both values yet.|link')}</p>
      {/if}
    </div>
    <div class="right">
      <h3>{t('In words|link')}</h3>
      {#if fit}
        <div class="boxes">
          <div class="box" data-link-word={word}><b>{t(WORDS[word])}</b><span>{t('link ({r})|link', { r: num(Math.round(fit.r * 100) / 100) })}</span></div>
          {#if word !== 'none'}<div class="box"><b class="num">{perStep.big}</b><span>{perStep.small}</span></div>{/if}
          <div class="box"><b class="num">{fit.n}</b><span>{t('days compared|link')}</span></div>
        </div>
        <p class="txt" data-link-text>{sentence} {colorLine} <b>{t('Only an observation|link')}</b>: {t('it does not say what the cause is.|link')}</p>
      {:else}
        <p class="txt">{t('At least 10 days with both values are needed.|link')}</p>
      {/if}
      <h4>{t('Strongest links in your data|link')}</h4>
      {#if list.length}
        <table data-link-list>
          <thead><tr><th>{t('Value|analyse')}</th><th>{t('with|link')}</th><th class="n">{t('how strong|link')}</th></tr></thead>
          <tbody>
            {#each list as l (`${l.x}|${l.y}`)}
              <tr>
                <td><button type="button" class="lk" onclick={() => show(l)} data-link-row={`${l.x}|${l.y}`}>{itemName(l.x)}</button></td>
                <td>{t('{y} on {when}|link', { y: itemName(l.y), when: t(OFF_NAMES[l.offset]) })}</td>
                <td class="n">{t(WORDS[strengthOf(l.r)])}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="hint">{t('Not enough days yet to find links.|link')}</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .zh {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  h3 {
    margin: 0 0 8px;
    font-size: var(--fs-body);
  }
  h4 {
    margin: 16px 0 4px;
    color: var(--ink-3);
    font-size: var(--fs-label);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px 24px;
  }
  @media (max-width: 860px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .left,
  .right {
    min-width: 0;
  }
  .sels {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  .sels label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    max-width: 100%;
  }
  .sels .sel {
    max-width: 100%;
  }
  .pl {
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .off {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
  }
  .plot {
    display: flex;
    margin-top: 10px;
  }
  .ya {
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 52px;
    padding-right: 4px;
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-align: right;
    white-space: nowrap;
  }
  svg {
    flex: 1;
    min-width: 0;
    height: auto;
  }
  .grid {
    stroke: var(--line);
    stroke-width: 1;
  }
  .pt {
    fill: var(--l3);
    fill-opacity: 0.55;
    cursor: pointer;
  }
  .pt.on {
    fill: var(--pz5);
    fill-opacity: 0.95;
  }
  .fit {
    stroke: var(--ink);
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }
  .xa {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-left: 56px;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .boxes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .box {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .box b {
    font-size: var(--fs-sub);
  }
  .box span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .txt {
    margin: 10px 0 0;
    color: var(--ink-2);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  th {
    color: var(--ink-3);
    font-weight: 400;
    text-align: left;
    padding: 6px 4px;
    border-bottom: 1px solid var(--line);
  }
  td {
    padding: 6px 4px;
    border-bottom: 1px solid var(--line);
  }
  .n {
    text-align: right;
  }
  .lk {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: underline;
    cursor: pointer;
  }
  .hint {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
