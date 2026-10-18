<script>
  /**
   * v0.124.0 «Neue Tour Teil 2», B4 «Bausteine beim Packen» (mockup B4, Noah 12.10.2026 «b2 b4 b5 ok»):
   * the trip's building blocks as big option buttons at the top of Packen. «Dabei» green with ✓,
   * «Dazunehmen» white with +, a suggestion dashed with a small label. Head «Bausteine · n dabei · m zur Wahl».
   * Hover (computer) or a long press (phone) shows what is in a block (the app's explain bubble, ui/explain.js).
   *
   * rows: packblocks.js blockRows(). itemsById: for the names in the bubble. ontoggle(row): one tap switches
   * the whole block (Pack's change(), so Undo works). onslim(): opens «Reparatur unterwegs» (B5).
   * slimN: the parts of a Repair that is on the trip but not slim yet (0: none). note / onundo: the last switch.
   * SN3+ «Bausteine je nach Lage» (mockup SN3g): a block «je nach Lage» that fits the trip is dashed with its
   * reason («Vorschlag: tiefste 3 °C»); the bubble names its rule. rules: situation.js rulesOf(). A line
   * under the buttons names what fits, with «Regeln ändern» to Bausteine.
   * Impeccable 18.10.2026 (Packen 1, Noah «alle a-d umsetzen»): with at least one block on the trip the card
   * folds to one line «Bausteine dabei: … · 22 weitere zur Wahl · Bausteine ändern», so on a phone the first
   * bag with its ticks is on the first screen. One tap opens the card unchanged; «Zuklappen» folds it again.
   * Without a chosen block the card stays open. The suggestion lines (fits, rain, Repair) show in both states.
   */
  import { Wrench, Info, CloudRain, Blocks } from '@lucide/svelte';
  import { tick } from 'svelte';
  import Btn from '../ui/Btn.svelte';
  import { rainLimit } from '../rainlimit.svelte.js';
  import OptionButton from '../ui/OptionButton.svelte';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { knownWeight } from '../gear.js';
  import { blockIcon, blockTone } from '../blockicons.js';
  import { SLIM_MAX } from '../repairslim.js';
  import { isSituation } from '../situation.js';
  import { hitBadge, ruleLine } from '../situationtext.js';

  let { rows, itemsById, ontoggle, onslim, slimN = 0, note = '', onundo = null, rules = {} } = $props();
  // SN3+: the blocks «je nach Lage» suggested right now (the built-in ones; an own rain block too)
  const fits = $derived(rows.add.filter((r) => r.suggest && r.suggest.kind !== 'slim'));

  // SN3: the icons and colours of the blocks are shared with Bausteine and the templates (blockicons.js)
  const iconOf = (r) => blockIcon(r.key, r.name);
  const toneOf = (r) => blockTone(r.key, r.name);
  const weightOf = (r) => (r.missing === r.n ? t('not weighed') : knownWeight(r.g, r.missing));
  const subOf = (r) => `${tn(r.n, '{n} item', '{n} items')} · ${weightOf(r)}`;
  const namesOf = (r) => r.ids.map((id) => (itemsById[id] ? nameOf(itemsById[id]) : id)).join(' · ');
  const badgeOf = (r) =>
    r.suggest?.kind === 'slim' ? t('Suggestion: {n} of {all} for the ride', { n: SLIM_MAX, all: r.suggest.n })
    : r.suggest?.kind === 'rain' && !r.suggest.metric ? (r.suggest.pct != null ? t('Suggestion: {pct} % rain', { pct: r.suggest.pct }) : t('Suggestion: rain is forecast'))
    : hitBadge(r.suggest);
  const ruleOfRow = (r) => (isSituation(r.key) && rules[r.key] ? ruleLine(r.key, rules[r.key]) : r.suggest?.kind === 'rain' && rules.rain ? ruleLine('rain', rules.rain) : '');
  const explainOf = (r) => (r.suggest?.kind === 'slim' ? t('Choose at most {n} parts for the ride', { n: SLIM_MAX }) : r.suggest ? t('{block} · comes along {rule}', { block: r.name, rule: ruleOfRow(r) }) : r.on ? t('Takes {block} off this trip', { block: r.name }) : t('Adds {block} to this trip', { block: r.name }));
  const tap = (r) => (r.suggest?.kind === 'slim' ? onslim() : ontoggle(r));
  // v0.144.0 RE «Regen überall gleich» (mockup RE1-packen): the one rain limit says why rain is suggested
  // and that the rain gear comes along by itself (removable on the list).
  const rainHit = $derived(rows.add.find((r) => r.suggest?.kind === 'rain' && r.suggest.pct != null) ?? null);
  // Impeccable Packen 1: folded while a block is on the trip and the card was not opened
  let open = $state(false);
  const folded = $derived(rows.on.length > 0 && !open);
  let headEl = $state();
  let changeEl = $state();
  async function unfold() {
    open = true;
    await tick();
    headEl?.focus();
  }
  async function fold() {
    open = false;
    await tick();
    changeEl?.querySelector('button')?.focus();
  }
</script>

{#snippet hints()}
  {#if fits.length}<p class="fits"><Info size={16} aria-hidden="true" /><span>{t('Fits this trip: {names}. Never a must: without a tap they stay out.', { names: fits.map((r) => r.name).join(', ') })} <a class="tp-link" href="#/blocks">{t('Change rules')}</a></span></p>{/if}
  {#if rainHit}<p class="fits rainl" data-rain-limit><CloudRain size={16} aria-hidden="true" /><span>{t('{pct} % rain: {block} is suggested, your rain gear comes onto the list by itself.', { pct: rainHit.suggest.pct, block: rainHit.name })}<small>{t('Rain from {limit} %', { limit: rainLimit() })} · <a class="tp-link" href="#/blocks">{t('Change rule')}</a></small></span></p>{/if}
  {#if slimN}<p class="slim"><button type="button" class="tp-link" onclick={onslim}><Wrench size={16} aria-hidden="true" />{t('Repair has {n} parts: choose {max} for the ride', { n: slimN, max: SLIM_MAX })}</button></p>{/if}
  {#if note}<p class="pnote" role="status"><span>{note}</span>{#if onundo}<button type="button" class="tp-link" onclick={onundo}>{t('Undo')}</button>{/if}</p>{/if}
{/snippet}

{#if folded}
<section class="card pblocks folded" aria-label={t('Building blocks')} data-blocks-folded>
  <div class="fline">
    <span class="ficon" aria-hidden="true"><Blocks size={18} /></span>
    <p class="fon"><b>{t('Building blocks on the trip:')}</b> {rows.on.map((r) => r.name).join(', ')}{#if rows.add.length}<span class="fmore num">{' · '}{tn(rows.add.length, '{n} more to choose', '{n} more to choose')}</span>{/if}</p>
    <div class="fact" bind:this={changeEl}>
      <Btn label={t('Change building blocks')} aria-expanded="false" explain={t('Shows every building block: one tap adds or removes it.')} onclick={unfold} />
    </div>
  </div>
  {@render hints()}
</section>
{:else}
<section class="card pblocks" aria-labelledby="pbl-h">
  <div class="phead">
    <h2 id="pbl-h" class="sh" tabindex="-1" bind:this={headEl}>{t('Building blocks')}</h2>
    <span class="cnt num">{t('{n} on · {m} to choose', { n: rows.on.length, m: rows.add.length })}</span>
    {#if open && rows.on.length}<Btn kind="quiet" class="pfold" label={t('Fold up|blocks')} aria-expanded="true" onclick={fold} />{/if}
  </div>
  <p class="ssub">{t('A building block is a ready package for a situation. One tap adds or removes the whole package.')}</p>
  {#if rows.on.length}
    <p class="grp-l" id="pbl-on">{t('On the trip|blocks')}</p>
    <div class="obig" role="group" aria-labelledby="pbl-on">
      {#each rows.on as r (r.key)}<OptionButton size="lg" pressed icon={iconOf(r)} tone={toneOf(r)} label={r.name} sub={subOf(r)} explain={explainOf(r)} explainSub={namesOf(r)} onclick={() => tap(r)} />{/each}
    </div>
  {/if}
  {#if rows.add.length}
    <p class="grp-l" id="pbl-add">{t('Add|blocks')}</p>
    <div class="obig" role="group" aria-labelledby="pbl-add">
      {#each rows.add as r (r.key)}<OptionButton size="lg" pressed={false} icon={iconOf(r)} tone={toneOf(r)} label={r.name} sub={subOf(r)} badge={badgeOf(r)} explain={explainOf(r)} explainSub={namesOf(r)} onclick={() => tap(r)} />{/each}
    </div>
  {/if}
  {@render hints()}
  <p class="foot">{t('Long press or hover shows what is in a block. Own blocks: Gear › Building blocks.')}</p>
</section>
{/if}

<style>
  .pblocks { margin: 0 0 24px; min-width: 0; }
  .phead { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; }
  .sh { margin: 0; font: 700 var(--fs-section) / 1.3 var(--font-body); color: var(--ink); }
  .phead :global(.pfold) { margin-left: auto; }
  /* Impeccable Packen 1: the folded card, one line on a computer; on a phone the names over the count and
     the button. The hints below start under the names, not under the icon. */
  .folded { padding-top: 12px; padding-bottom: 12px; }
  .fline { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; min-width: 0; }
  .ficon { display: inline-grid; place-items: center; flex: none; width: 36px; height: 36px; border-radius: 10px; background: var(--paper-2); color: var(--ink-2); }
  .fon { flex: 1 1 260px; min-width: 0; margin: 0; color: var(--ink); overflow-wrap: break-word; }
  .fon b { font-weight: 600; }
  .fact { flex: none; margin-left: auto; }
  .fmore { color: var(--ink-2); white-space: nowrap; }
  .folded .fits, .folded .slim, .folded .pnote { margin: 4px 0 0 48px; }
  .folded .rainl { margin-top: 8px; }
  @media (max-width: 599px) {
    .ficon { display: none; }
    .fact { margin: 4px 0 0; }
    .folded .fits, .folded .slim, .folded .pnote { margin-left: 0; }
  }
  .cnt { font-weight: 600; color: var(--ink-2); }
  .ssub { margin: 4px 0 4px; color: var(--ink-2); font-size: var(--fs-small); overflow-wrap: break-word; }
  .grp-l { margin: 14px 0 8px; font-size: var(--fs-tiny); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-2); }
  .obig { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 16px 10px; padding-top: 6px; }
  .slim, .pnote { margin: 12px 0 0; font-size: var(--fs-small); }
  /* SN3+: what fits this trip, one quiet line with the way to the rules */
  .fits { display: flex; gap: 8px; align-items: center; margin: 14px 0 0; font-size: var(--fs-small); color: var(--ink-2); overflow-wrap: break-word; }
  .fits :global(svg) { flex: none; }
  .fits > span { flex: 1 1 auto; min-width: 0; }
  .fits .tp-link { font-size: var(--fs-small); }
  .rainl { align-items: flex-start; margin-top: 10px; padding: 10px 12px; border-radius: 10px; background: var(--paper-2); }
  .rainl small { display: block; margin-top: 2px; font-size: var(--fs-small); }
  .slim .tp-link { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-small); text-align: left; }
  .pnote { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; color: var(--ink-2); }
  .pnote .tp-link { font-size: var(--fs-small); }
  .foot { margin: 14px 0 0; font-size: var(--fs-small); color: var(--ink-2); overflow-wrap: break-word; }
</style>
