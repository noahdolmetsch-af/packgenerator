<script>
  /**
   * v0.47.2 «Material-Ansichten» (Material-Item-Phone): what the trips say about one item, only
   * what the data supports. The numbers (weight, times along, times used), «Its year on tour» with a
   * dot per trip and a learned rule when every debrief agrees, the last trips, the weight against
   * the alternatives in your own gear, and the age and cost per use when a purchase day or a price
   * is known. Used in the item window and (compact) in the computer's detail column.
   *
   * v0.54.0 «Material-Detail ruhig» (Noah 1a, 2a): in the detail column (folds) the parts fold away
   * as rows with a short summary, one open at a time. The weight part shows the lighter alternatives:
   * the ones you linked first («linked by you»), then at most two suggestions from your own gear
   * («Suggestion»), each with «Doesn't fit», which hides it for this item and can be undone.
   */
  import Dots from './Dots.svelte';
  import DotsLegend from './DotsLegend.svelte';
  import { formatWeight, itemWeight } from '../gear.js';
  import { usageOf, learnedRule, ruleText, alternatives, lighterAlts, ageOf, ageText, costPerUse, ALT_DISMISSED_KEY } from './material.js';
  import { lastFold, keepFold, nextFold } from './detail.js';
  import { db } from '../db.js';
  import { liveQuery } from 'dexie';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { Route, Scale, Clock, Sparkles, ArrowLeftRight, ListChecks, ChevronRight } from '@lucide/svelte';

  // folds (v0.54.0): the parts as rows that fold away (the detail column); line: a summary line under the numbers.
  let { item, items = [], stats, log = [], today, compact = false, folds = false, line = '' } = $props();
  // The year is open until you open or close a row; the rows draw their content only when open.
  let openFold = $state(folds ? lastFold('panel', 'y') : null);
  function onFold(key, open) {
    const next = nextFold(openFold, key, open);
    if (next === openFold) return;
    openFold = next;
    keepFold('panel', next);
  }

  /* ---------- v0.54.0 (Noah 2a): lighter alternatives, linked and suggested ---------- */
  const dismissedQ = liveQuery(() => db.settings.get(ALT_DISMISSED_KEY));
  const dismissed = $derived($dismissedQ?.value?.[item.id] ?? []);
  const lighter = $derived(lighterAlts(item, items, dismissed));
  const suggested = $derived(lighter.filter((a) => a.auto));
  let hidden = $state(null); // { itemId, other } after «Doesn't fit», for Undo
  async function setDismissed(itemId, other, on) {
    const rec = await db.settings.get(ALT_DISMISSED_KEY);
    const all = { ...(rec?.value ?? {}) };
    const now = (all[itemId] ?? []).filter((x) => x !== other);
    if (on) now.push(other);
    if (now.length) all[itemId] = now;
    else delete all[itemId];
    await db.settings.put({ key: ALT_DISMISSED_KEY, value: all });
  }
  async function dismiss(a) {
    await setDismissed(item.id, a.item.id, true);
    hidden = { itemId: item.id, other: a.item };
  }
  async function undoDismiss() {
    if (!hidden) return;
    await setDismissed(hidden.itemId, hidden.other.id, false);
    hidden = null;
  }
  const u = $derived(usageOf(stats, item.id));
  const rule = $derived(learnedRule(item.id, log));
  const share = $derived(u.taken ? Math.round((u.used / u.taken) * 100) : null);
  const recent = $derived(
    [...log]
      .reverse()
      .filter((r) => r.date <= today)
      .slice(0, compact ? 3 : 5)
      .map((r) => ({ ...r, state: !r.ids.has(item.id) ? 'home' : r.items[item.id] === 'unused' ? 'unused' : 'used' })),
  );
  const alts = $derived(alternatives(item, items));
  const lightest = $derived(alts[0] && alts[0].diffG != null && alts[0].diffG < 0 ? alts[0] : null);
  const bars = $derived.by(() => {
    const all = [...alts, ...suggested];
    if (!all.length || item.weightG == null) return [];
    const rows = [...all.map((a) => ({ item: a.item, g: a.g, me: false, auto: !!a.auto })), { item, g: itemWeight(item), me: true }].sort((a, b) => a.g - b.g);
    const max = Math.max(...rows.map((r) => r.g), 1);
    return rows.map((r) => ({ ...r, pct: Math.max(4, Math.round((r.g / max) * 100)) }));
  });
  const age = $derived(ageOf(item, today));
  const cost = $derived(costPerUse(item, u));
  const fmtDay = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: iso.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric' }) : '');
  const firstDot = $derived(log.filter((r) => r.date <= today).find((r) => r.date >= new Date(Date.parse(`${today}T00:00:00Z`) - 365 * 864e5).toISOString().slice(0, 10)));
  const wx = (r) => (typeof r.wx?.min === 'number' && typeof r.wx?.max === 'number' ? `${r.wx.min}–${r.wx.max} °C` : '');
  const STATE = { used: 'used', unused: 'along, not used', home: 'at home' };
  const chf = (n) => n.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

{#snippet part(key, Icon, title, value, body)}
  {#if folds}
    <details class="sec pf" data-fold={key} open={openFold === key} ontoggle={(e) => onFold(key, e.currentTarget.open)}>
      <summary><Icon size={18} aria-hidden="true" /><span class="ft">{title}</span><span class="fv">{value}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
      {#if openFold === key}<div class="pbody">{@render body()}</div>{/if}
    </details>
  {:else}
    <section class="sec" aria-labelledby="life-{key}-{item.id}">
      <h3 class="sh" id="life-{key}-{item.id}"><Icon size={18} aria-hidden="true" />{title}{#if key === 'trips'}{' '}<small class="num">{u.taken}</small>{/if}</h3>
      {@render body()}
    </section>
  {/if}
{/snippet}

{#snippet yearBody()}
  {#if u.dots.length}
    <Dots dots={u.dots} size="lg" />
    <p class="ends"><span>{firstDot ? fmtDay(firstDot.date) : ''}</span><span>{t('today')}</span></p>
    {#if !compact}<DotsLegend />{/if}
  {:else}
    <p class="quiet">{t('Not on a debriefed trip in the last 12 months.')}</p>
  {/if}
  {#if rule}<p class="rule"><Sparkles size={16} aria-hidden="true" /><span>{ruleText(rule)}</span></p>{/if}
{/snippet}

{#snippet tripsBody()}
  <ul class="trips">
    {#each recent as r (r.id)}
      <li>
        <span class="tt">{r.title}<small>{[fmtDay(r.date), wx(r)].filter(Boolean).join(' · ')}</small></span>
        <span class="pill" class:ok={r.state === 'used'} class:warn={r.state === 'unused'}>{t(STATE[r.state])}</span>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet weightBody()}
  {#if bars.length}
    <ul class="bars">
      {#each bars as b (b.item.id)}
        <li class:me={b.me}><span class="bn">{nameOf(b.item)}{#if b.me}<small>{t('this one')}</small>{:else if b.auto}<small>{t('Suggestion')}</small>{/if}</span><span class="track"><i style:width="{b.pct}%"></i></span><span class="num bg">{formatWeight(b.g)}</span></li>
      {/each}
    </ul>
  {/if}
  {#if lightest}<p class="alt"><ArrowLeftRight size={16} aria-hidden="true" /><span>{t('Lightest alternative: {name}, {g} g less', { name: nameOf(lightest.item), g: -lightest.diffG })} <small class="by">· {t('linked by you')}</small></span></p>{/if}
  {#if suggested.length}
    <ul class="sugg" aria-label={t('Suggested lighter alternatives')}>
      {#each suggested as a (a.item.id)}
        <li>
          <span class="sn"><span class="pill tag">{t('Suggestion')}</span> {nameOf(a.item)}<small>{t('{g} g less', { g: -a.diffG })}</small></span>
          <button type="button" class="btn sm" aria-label={t("Doesn't fit: {name}", { name: nameOf(a.item) })} onclick={() => dismiss(a)}>{t("Doesn't fit")}</button>
        </li>
      {/each}
    </ul>
    <p class="quiet">{t('Only a suggestion from your own gear: same category, owned, weighed, lighter. Nothing changes on its own.')}</p>
  {/if}
  {#if hidden && hidden.itemId === item.id}
    <p class="undo" role="status"><span>{t('"{name}" is no longer suggested for this item.', { name: nameOf(hidden.other) })}</span><button type="button" class="btn sm" onclick={undoDismiss}>{t('Undo')}</button></p>
  {/if}
{/snippet}

{#snippet ageBody()}
  <div class="stats">
    {#if age}<div class="st"><b class="num">{ageText(age)}</b><span>{t('old, since {date}', { date: new Date(item.boughtAt).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) })}</span></div>{/if}
    {#if cost != null}<div class="st"><b class="num">{chf(cost)} CHF</b><span>{t('per use')}<small>{tn(u.used, 'after {n} use, price CHF {p}', 'after {n} uses, price CHF {p}', { p: chf(item.priceChf) })}</small></span></div>{/if}
  </div>
{/snippet}

<div class="life" class:compact class:folds>
  <div class="stats">
    <div class="st"><b class="num">{item.weightG == null ? '–' : formatWeight(itemWeight(item))}</b><span>{item.weightG == null ? t('not weighed') : t('weighed')}</span></div>
    <div class="st"><b class="num">{u.taken}×</b><span>{t('along')}{#if stats?.n}<small>{tn(stats.n, 'of {n} trip', 'of {n} trips')}</small>{/if}</span></div>
    <div class="st"><b class="num">{u.used}×</b><span>{t('used')}{#if share != null}<small>{share} %</small>{/if}</span></div>
  </div>
  {#if line}<p class="line">{line}</p>{/if}

  {@render part('y', Route, t('Its year on tour'), u.dots.length ? t('used on {a} of {b}', { a: u.dots.filter((d) => d === 'used').length, b: u.dots.length }) : t('none yet'), yearBody)}
  {#if u.taken && recent.length}{@render part('trips', ListChecks, t('Last trips'), recent[0]?.title ?? '', tripsBody)}{/if}
  {#if bars.length || suggested.length || lightest || (hidden && hidden.itemId === item.id)}
    {@render part('w', Scale, t('Weight'), lighter.length ? tn(lighter.length, '{n} lighter option', '{n} lighter options') : '', weightBody)}
  {/if}
  {#if age || cost != null}{@render part('a', Clock, t('Age and cost'), [age ? ageText(age) : '', cost != null ? `${chf(cost)} CHF` : ''].filter(Boolean).join(' · '), ageBody)}{/if}
</div>

<style>
  .life {
    display: grid;
    gap: 14px;
    margin: 0 0 14px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 8px;
  }
  .st {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--paper-2);
    min-width: 0;
  }
  .st b {
    font: 800 var(--fs-section)/1.05 var(--font-brand);
    white-space: nowrap;
  }
  .st span {
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.3;
  }
  .st small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sec {
    padding: 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    min-width: 0;
  }
  .sh {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sh small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .ends {
    display: flex;
    justify-content: space-between;
    margin: 4px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .rule,
  .alt {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--accent-soft);
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .alt {
    background: var(--warn-soft);
  }
  .rule :global(svg),
  .alt :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .quiet {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .trips {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .trips li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .trips li:first-child {
    border-top: 0;
  }
  .tt {
    min-width: 0;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .tt small {
    display: block;
    color: var(--ink-3);
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .bars li {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(60px, 1fr) auto;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-small);
  }
  .bn {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bn small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .track {
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .track i {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--bar);
  }
  .me .track i {
    background: var(--hi);
  }
  .bg {
    font-weight: 600;
    white-space: nowrap;
  }
  .compact {
    gap: 10px;
  }
  /* v0.54.0 (Noah 1a, 2a): the parts as rows that fold away, and the suggestions with «Doesn't fit». */
  .line {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .compact .pf,
  .pf {
    padding: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper);
  }
  .pf > summary {
    list-style: none;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 6px 12px;
    cursor: pointer;
  }
  .pf > summary::-webkit-details-marker {
    display: none;
  }
  .ft {
    font-weight: 600;
    flex: none;
    white-space: nowrap;
  }
  .fv {
    flex: 1 1 0;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pf :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .pf[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .pbody {
    padding: 4px 12px 12px;
  }
  .by {
    color: var(--ink-3);
  }
  .sugg {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
  }
  .sugg li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .sn {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .sn small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sugg .btn,
  .undo .btn {
    min-height: 44px;
    flex: none;
  }
  .sugg + .quiet {
    margin-top: 6px;
  }
  .undo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .compact .sec {
    padding: 0;
    border: 0;
    background: none;
  }
  .compact .sh {
    font-size: var(--fs-body);
    margin-bottom: 6px;
  }
  .compact .st b {
    font-size: var(--fs-section);
  }
</style>
