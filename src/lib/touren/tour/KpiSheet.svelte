<script>
  /**
   * Tour-Seite: which key figures stand on top of every tour page (at most KPI_MAX), in the order chosen;
   * ↑ ↓ move one (rule «Umsortieren mit Pfeilen»). onsave(keys).
   */
  import TourSheet from './TourSheet.svelte';
  import { t } from '../../i18n.svelte.js';
  import { ArrowUp, ArrowDown } from '@lucide/svelte';
  import { KPIS, KPI_MAX, KPI_DEFAULT } from '../tour.js';

  let { value = KPI_DEFAULT, onsave, onclose } = $props();
  // svelte-ignore state_referenced_locally
  let pick = $state([...value]);
  let sheet = $state();
  const nameOf = (k) => t(KPIS.find((x) => x.key === k)?.name ?? k);
  const toggle = (k) => (pick = pick.includes(k) ? pick.filter((x) => x !== k) : pick.length < KPI_MAX ? [...pick, k] : pick);
  function moveBy(i, d) {
    const j = i + d;
    if (j < 0 || j >= pick.length) return;
    const next = [...pick];
    [next[i], next[j]] = [next[j], next[i]];
    pick = next;
  }
</script>

<TourSheet bind:this={sheet} id="tk-h" data="kpis" title={t('Choose key figures')} text={t('Up to {n} figures stand on top of every tour. The arrows change the order.', { n: KPI_MAX })} {onclose}>
  {#snippet body()}
    <div class="kp" role="group" aria-label={t('Key figures')}>
      {#each KPIS as k (k.key)}<button type="button" class="tp-chip" aria-pressed={pick.includes(k.key)} disabled={!pick.includes(k.key) && pick.length >= KPI_MAX} onclick={() => toggle(k.key)} data-kpi-pick={k.key}>{t(k.name)}</button>{/each}
    </div>
    {#if pick.length}
      <ol class="ko">
        {#each pick as k, i (k)}
          <li><span>{nameOf(k)}</span>
            <button type="button" class="ar" aria-label={t('Move {name} up', { name: nameOf(k) })} disabled={i === 0} onclick={() => moveBy(i, -1)}><ArrowUp size={16} aria-hidden="true" /></button>
            <button type="button" class="ar" aria-label={t('Move {name} down', { name: nameOf(k) })} disabled={i === pick.length - 1} onclick={() => moveBy(i, 1)}><ArrowDown size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ol>
    {/if}
  {/snippet}
  {#snippet foot()}
    <button type="button" class="btn btn-link" onclick={() => (pick = [...KPI_DEFAULT])}>{t('Standard|kpis')}</button>
    <button type="button" class="btn hi" onclick={() => (onsave?.(pick.length ? pick : KPI_DEFAULT), sheet.close())} data-kpi-save>{t('Save')}</button>
  {/snippet}
</TourSheet>

<style>
  .kp {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .kp [aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .ko {
    display: grid;
    gap: 4px;
    margin: 14px 0 0;
    padding: 0 0 0 22px;
  }
  .ko li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ko span {
    flex: 1;
  }
  .ar {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--card-line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .ar:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
