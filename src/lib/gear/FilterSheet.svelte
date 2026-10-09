<script>
  /**
   * v0.47.2 «Material-Ansichten» (Noah 6a): sort and filter in one sheet. Sort (most along, weight,
   * last along, name), category, bag or building block, area and "Comes along". Every tap applies at
   * once; the main button closes the sheet and names how many items the list shows.
   */
  import Seg from '../ui/Seg.svelte';
  import { phone } from '../media.svelte.js';
  import { t, tn } from '../i18n.svelte.js';
  import { X } from '@lucide/svelte';

  /**
   * value: { sort, category, bag, domain, role }; onchange(patch); count: items shown;
   * cats/bags/areas: [{ key, name, n }] (names translated); onclose.
   */
  let { value, onchange, count = 0, cats = [], bags = [], areas = [], onclose } = $props();
  let dlg = $state();
  $effect(() => {
    dlg?.showModal();
  });
  const SORTS = $derived([
    { key: 'taken', name: t('Most along') },
    { key: 'weight', name: t('Weight') },
    { key: 'last', name: t('Last along') },
    { key: 'name', name: t('Name') },
  ]);
  const ROLES = $derived([
    { key: '', name: t('All items') },
    { key: 'standard', name: t('Standard|block') },
    { key: 'worn', name: t('On me') },
    { key: 'night', name: t('In a building block') },
    { key: 'optional', name: t('Stays at home') },
    { key: 'none', name: t('Nothing set') },
  ]);
  const active = $derived([value.category, value.bag, value.domain, value.role].filter(Boolean).length);
</script>

<dialog class="sheet fsheet" class:phone={phone.matches} bind:this={dlg} onclose={() => onclose?.()} aria-labelledby="fs-h">
  <div class="fh">
    <h2 id="fs-h" class="title">{t('Sort and filter')}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dlg.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <h3 class="lbl" id="fs-sort">{t('Sort')}</h3>
  <Seg labelledby="fs-sort" options={SORTS} value={value.sort} onchange={(k) => onchange({ sort: k })} />

  <h3 class="lbl" id="fs-cat">{t('Category')}</h3>
  <div class="fchips" role="group" aria-labelledby="fs-cat">
    <button type="button" class="fchip" aria-pressed={!value.category} onclick={() => onchange({ category: '' })}>{t('All')}</button>
    {#each cats as c (c.key)}<button type="button" class="fchip" aria-pressed={value.category === c.key} onclick={() => onchange({ category: value.category === c.key ? '' : c.key })}>{c.name} <small class="num">{c.n}</small></button>{/each}
  </div>

  {#if bags.length}
    <h3 class="lbl" id="fs-bag">{t('Bag or set')}</h3>
    <div class="fchips" role="group" aria-labelledby="fs-bag">
      <button type="button" class="fchip" aria-pressed={!value.bag} onclick={() => onchange({ bag: '' })}>{t('All')}</button>
      {#each bags as b (b.key)}<button type="button" class="fchip" aria-pressed={value.bag === b.key} onclick={() => onchange({ bag: value.bag === b.key ? '' : b.key })}>{b.name} <small class="num">{b.n}</small></button>{/each}
    </div>
  {/if}

  {#if areas.length > 1}
    <h3 class="lbl" id="fs-area">{t('Area')}</h3>
    <Seg labelledby="fs-area" options={[{ key: '', name: t('All') }, ...areas]} value={value.domain} onchange={(k) => onchange({ domain: k })} />
  {/if}

  <h3 class="lbl" id="fs-role">{t('Comes along')}</h3>
  <div class="fchips" role="group" aria-labelledby="fs-role">
    {#each ROLES as r (r.key)}<button type="button" class="fchip" aria-pressed={value.role === r.key} onclick={() => onchange({ role: r.key })}>{r.name}</button>{/each}
  </div>

  <div class="ff">
    <button type="button" class="btn hi" onclick={() => dlg.close()}>{tn(count, 'Show {n} item', 'Show {n} items')}</button>
    {#if active}<button type="button" class="btn" onclick={() => onchange({ category: '', bag: '', domain: '', role: '' })}>{t('Reset filters')}</button>{/if}
  </div>
</dialog>

<style>
  .fsheet {
    width: min(560px, calc(100vw - 24px));
  }
  .fsheet.phone {
    margin: auto 0 0;
    width: 100vw;
    max-width: 100vw;
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
    padding-bottom: calc(18px + env(safe-area-inset-bottom));
  }
  .fh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .fh .title {
    font-size: var(--fs-section);
  }
  .x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  h3.lbl {
    margin: 16px 0 6px;
  }
  .fchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fchip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 15px var(--font-body);
    cursor: pointer;
  }
  .fchip small {
    color: var(--ink-3);
    font-size: 12.5px;
  }
  .fchip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi-soft);
    font-weight: 600;
  }
  .ff {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 20px;
  }
  .ff .btn.hi {
    flex: 1 1 auto;
    min-height: 48px;
  }
</style>
