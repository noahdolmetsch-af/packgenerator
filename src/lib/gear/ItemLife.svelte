<script>
  /**
   * v0.47.2 «Material-Ansichten» (Material-Item-Phone): what the trips say about one item, only
   * what the data supports. The numbers (weight, times along, times used), «Its year on tour» with a
   * dot per trip and a learned rule when every debrief agrees, the last trips, the weight against
   * the alternatives in your own gear, and the age and cost per use when a purchase day or a price
   * is known. Used in the item window and (compact) in the computer's detail column.
   */
  import Dots from './Dots.svelte';
  import DotsLegend from './DotsLegend.svelte';
  import { formatWeight, itemWeight } from '../gear.js';
  import { usageOf, learnedRule, ruleText, alternatives, ageOf, ageText, costPerUse } from './material.js';
  import { t, tn, nameOf, locale } from '../i18n.svelte.js';
  import { Route, Scale, Clock, Sparkles, ArrowLeftRight } from '@lucide/svelte';

  let { item, items = [], stats, log = [], today, compact = false } = $props();
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
    if (!alts.length || item.weightG == null) return [];
    const rows = [...alts.map((a) => ({ item: a.item, g: a.g, me: false })), { item, g: itemWeight(item), me: true }].sort((a, b) => a.g - b.g);
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

<div class="life" class:compact>
  <div class="stats">
    <div class="st"><b class="num">{item.weightG == null ? '–' : formatWeight(itemWeight(item))}</b><span>{item.weightG == null ? t('not weighed') : t('weighed')}</span></div>
    <div class="st"><b class="num">{u.taken}×</b><span>{t('along')}{#if stats?.n}<small>{tn(stats.n, 'of {n} trip', 'of {n} trips')}</small>{/if}</span></div>
    <div class="st"><b class="num">{u.used}×</b><span>{t('used')}{#if share != null}<small>{share} %</small>{/if}</span></div>
  </div>

  <section class="sec" aria-labelledby="life-y-{item.id}">
    <h3 class="sh" id="life-y-{item.id}"><Route size={18} aria-hidden="true" />{t('Its year on tour')}</h3>
    {#if u.dots.length}
      <Dots dots={u.dots} size="lg" />
      <p class="ends"><span>{firstDot ? fmtDay(firstDot.date) : ''}</span><span>{t('today')}</span></p>
      {#if !compact}<DotsLegend />{/if}
    {:else}
      <p class="quiet">{t('Not on a debriefed trip in the last 12 months.')}</p>
    {/if}
    {#if rule}<p class="rule"><Sparkles size={16} aria-hidden="true" /><span>{ruleText(rule)}</span></p>{/if}
  </section>

  {#if u.taken && recent.length}
    <section class="sec" aria-labelledby="life-t-{item.id}">
      <h3 class="sh" id="life-t-{item.id}">{t('Last trips')} <small class="num">{u.taken}</small></h3>
      <ul class="trips">
        {#each recent as r (r.id)}
          <li>
            <span class="tt">{r.title}<small>{[fmtDay(r.date), wx(r)].filter(Boolean).join(' · ')}</small></span>
            <span class="pill" class:ok={r.state === 'used'} class:warn={r.state === 'unused'}>{t(STATE[r.state])}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if bars.length}
    <section class="sec" aria-labelledby="life-w-{item.id}">
      <h3 class="sh" id="life-w-{item.id}"><Scale size={18} aria-hidden="true" />{t('Weight')}</h3>
      <ul class="bars">
        {#each bars as b (b.item.id)}
          <li class:me={b.me}><span class="bn">{nameOf(b.item)}{#if b.me}<small>{t('this one')}</small>{/if}</span><span class="track"><i style:width="{b.pct}%"></i></span><span class="num bg">{formatWeight(b.g)}</span></li>
        {/each}
      </ul>
      {#if lightest}<p class="alt"><ArrowLeftRight size={16} aria-hidden="true" /><span>{t('Lightest alternative: {name}, {g} g less', { name: nameOf(lightest.item), g: -lightest.diffG })}</span></p>{/if}
    </section>
  {/if}

  {#if age || cost != null}
    <section class="sec" aria-labelledby="life-a-{item.id}">
      <h3 class="sh" id="life-a-{item.id}"><Clock size={18} aria-hidden="true" />{t('Age and cost')}</h3>
      <div class="stats">
        {#if age}<div class="st"><b class="num">{ageText(age)}</b><span>{t('old, since {date}', { date: new Date(item.boughtAt).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) })}</span></div>{/if}
        {#if cost != null}<div class="st"><b class="num">{chf(cost)} CHF</b><span>{t('per use')}<small>{tn(u.used, 'after {n} use, price CHF {p}', 'after {n} uses, price CHF {p}', { p: chf(item.priceChf) })}</small></span></div>{/if}
      </div>
    </section>
  {/if}
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
