<script>
  /**
   * «Eigenes Diagramm» D4 «Filter» (Noah «3a und b möglich»): weekdays, days with or without an activity,
   * trips, «Wi gaht's?», outliers. For the whole diagram (also: mark the days of an activity, trips as a
   * band) or only for one value (name). Changes only count with «Show n days»; «Reset all» empties it.
   * filter: cleanFilter(); acts: [{ id, name }] most ticked first; count(filter) → days kept; extra:
   * { mark, band } (whole diagram only); onapply(filter, extra); onclose().
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../../lib/ui/backclose.js';
  import { EMPTY_FILTER, FELT_HI, FELT_LO } from '../../lib/analyse/diagram.js';
  import { t, locale } from '../../lib/i18n.svelte.js';

  let { filter, acts = [], count, extra = null, name = '', onapply, onclose } = $props();
  let dialog;
  // svelte-ignore state_referenced_locally
  let f = $state(structuredClone($state.snapshot(filter)));
  // svelte-ignore state_referenced_locally
  let x = $state(extra ? { ...extra } : null);
  // svelte-ignore state_referenced_locally
  let actId = $state(filter.act?.id ?? acts[0]?.id ?? '');

  $effect(() => {
    dialog.showModal();
  });

  const WD = $derived(Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 9, 5 + i, 12)).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short' })));
  const wdOn = (i) => !f.wd.length || f.wd.includes(i);
  function wdToggle(i) {
    const now = f.wd.length ? f.wd : [0, 1, 2, 3, 4, 5, 6];
    const next = now.includes(i) ? now.filter((d) => d !== i) : [...now, i].sort();
    f.wd = next.length === 7 || !next.length ? [] : next;
  }
  const n = $derived(count(f));
  const actName = (id) => acts.find((a) => a.id === id)?.name ?? '';
  const setAct = (mode) => (f.act = mode && actId ? { id: actId, mode } : null);
  const feltKey = $derived(f.felt ? `${f.felt.part}:${f.felt.op}` : '');
  const FELT = $derived([
    { key: '', name: t('all|filter') },
    { key: 'energy:hi', name: t('Energy ≥ {n}|filter', { n: FELT_HI }) },
    { key: 'energy:lo', name: t('Energy ≤ {n}|filter', { n: FELT_LO }) },
    { key: 'mood:hi', name: t('Mood ≥ {n}|filter', { n: FELT_HI }) },
    { key: 'mood:lo', name: t('Mood ≤ {n}|filter', { n: FELT_LO }) },
  ]);
  const setFelt = (k) => {
    const [part, op] = k.split(':');
    f.felt = k ? { part, op } : null;
  };
  function apply() {
    onapply?.($state.snapshot(f), x ? $state.snapshot(x) : null);
    dialog.close();
  }
  function reset() {
    f = structuredClone(EMPTY_FILTER);
    if (x) x = { mark: null, band: true };
  }
</script>

<dialog class="sheet from-below fs" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="fs-h" data-filter-sheet={name ? 'value' : 'all'}>
  <div class="head">
    <div>
      <h2 id="fs-h">{name ? t('Filter for {name}|filter', { name }) : t('Filter|filter')}</h2>
      <p class="sub">{name ? t('Only for this value, on top of the filter for everything.|filter') : t('For every value of the diagram.|filter')}</p>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="scroll">
    <section>
      <h3>{t('Weekdays|filter')}</h3>
      <div class="chips">
        {#each WD as w, i (i)}<button type="button" class="chip" class:on={wdOn(i) && f.wd.length} aria-pressed={wdOn(i)} data-wd={i} onclick={() => wdToggle(i)}>{w}</button>{/each}
      </div>
    </section>
    {#if acts.length}
      <section>
        <h3>{t('Days with or without an activity|filter')}</h3>
        <div class="chips">
          <select class="sel" bind:value={actId} onchange={() => f.act && setAct(f.act.mode)} aria-label={t('Activity|filter')} data-act-pick>
            {#each acts as a (a.id)}<option value={a.id}>{a.name}</option>{/each}
          </select>
          <button type="button" class="chip" class:on={!f.act} aria-pressed={!f.act} onclick={() => setAct(null)}>{t('all|filter')}</button>
          <button type="button" class="chip" class:on={f.act?.mode === 'with'} aria-pressed={f.act?.mode === 'with'} data-act-with onclick={() => setAct('with')}>{t('only with {name}|filter', { name: actName(actId) })}</button>
          <button type="button" class="chip" class:on={f.act?.mode === 'without'} aria-pressed={f.act?.mode === 'without'} data-act-without onclick={() => setAct('without')}>{t('without {name}|filter', { name: actName(actId) })}</button>
        </div>
      </section>
    {/if}
    <section>
      <h3>{t('Trips|filter')}</h3>
      <div class="chips">
        {#each [['all', 'all days|filter'], ['only', 'only trip days|filter'], ['without', 'without trip days|filter']] as [k, label] (k)}
          <button type="button" class="chip" class:on={f.trip === k} aria-pressed={f.trip === k} data-trip={k} onclick={() => (f.trip = k)}>{t(label)}</button>
        {/each}
        {#if x}<button type="button" class="chip" class:on={x.band} aria-pressed={x.band} data-band onclick={() => (x.band = !x.band)}>{t('show as a band|filter')}</button>{/if}
      </div>
    </section>
    <section>
      <h3>{t("Wi gaht's?|analyse")}</h3>
      <div class="chips">
        {#each FELT as o (o.key)}<button type="button" class="chip" class:on={feltKey === o.key} aria-pressed={feltKey === o.key} data-felt={o.key || 'all'} onclick={() => setFelt(o.key)}>{o.name}</button>{/each}
      </div>
    </section>
    <section>
      <h3>{t('Outliers|filter')}</h3>
      <div class="chips">
        <button type="button" class="chip" class:on={!f.outliers} aria-pressed={!f.outliers} onclick={() => (f.outliers = false)}>{t('show|filter')}</button>
        <button type="button" class="chip" class:on={f.outliers} aria-pressed={f.outliers} data-outliers onclick={() => (f.outliers = true)}>{t('hide|filter')}</button>
      </div>
      <p class="note">{t('Hides single values far off the rest (more than 1.5 times the middle half away).|filter')}</p>
    </section>
    {#if x && acts.length}
      <section>
        <h3>{t('Mark days|filter')}</h3>
        <div class="chips">
          <select class="sel" bind:value={x.mark} aria-label={t('Mark the days of|filter')} data-mark>
            <option value={null}>{t('none|filter')}</option>
            {#each acts as a (a.id)}<option value={a.id}>{a.name}</option>{/each}
          </select>
        </div>
        <p class="note">{t('A dot under every row on the days you ticked it.|filter')}</p>
      </section>
    {/if}
  </div>
  <div class="foot">
    <button type="button" class="lk" data-reset onclick={reset}>{t('Reset all|filter')}</button>
    <button type="button" class="btn hi" data-apply onclick={apply}>{t('Show {n} days|filter', { n })}</button>
  </div>
</dialog>

<style>
  .fs {
    width: min(560px, calc(100vw - 24px));
  }
  .head,
  .foot {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .foot {
    align-items: center;
    margin-top: 12px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sub,
  .note {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  h3 {
    margin: 0 0 6px;
    font-size: var(--fs-body);
  }
  section {
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .scroll {
    max-height: min(60vh, 560px);
    overflow-y: auto;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .chip {
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--hi);
    background: var(--hi-soft);
    font-weight: 600;
  }
  @media (pointer: coarse) {
    .chip {
      min-height: 44px;
    }
  }
  .lk {
    padding: 8px 0;
    border: 0;
    background: none;
    color: var(--hi);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
</style>
