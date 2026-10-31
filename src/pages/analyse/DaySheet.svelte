<script>
  /**
   * «Eigenes Diagramm» D6 «Ein Tag, alle Werte»: a tapped day with every value it has, as boxes (name,
   * value, where it comes from); the ticked activities of Aktiv together in one box. Day before and next
   * day. A tap on a box opens the page of that value (M6).
   * day; groups: analyseGroups(); tripName: the trip on that day or ''; today; onday(day); onclose().
   */
  import { X, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { backClose } from '../../lib/ui/backclose.js';
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { detailHref } from '../../lib/analyse/catalog.js';
  import { addDays } from '../../lib/analyse.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { day, groups = [], tripName = '', today, onday, onclose } = $props();
  let dialog;
  $effect(() => {
    dialog.showModal();
  });

  const SRC = { fitbit: 'Fitbit', strava: 'Strava', body: 'Body|group', check: "Wi gaht's?|analyse", aktiv: 'Aktiv' };
  const items = $derived(
    groups
      .flatMap((g) => g.items)
      .filter((x) => !x.later && x.get && !x.tick)
      .map((x) => ({ ...x, value: x.get(day) }))
      .filter((x) => x.value != null && Number.isFinite(x.value)),
  );
  const ticked = $derived(
    groups
      .flatMap((g) => g.items)
      .filter((x) => x.tick && x.get && x.get(day))
      .map((x) => x.name),
  );
  const title = $derived(new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<dialog class="sheet from-below ds" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="ds-h" data-day-sheet={day}>
  <div class="head">
    <h2 id="ds-h">{t('One day, all values|diagram')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="sub">{title}{#if tripName}&nbsp;· {t('Trip|analyse')}: {tripName}{/if}</p>
  {#if items.length || ticked.length}
    <ul class="boxes">
      {#each items as x (x.key)}
        <li>
          <a class="box" href={detailHref(x.key)} onclick={() => dialog.close()}>
            <span class="nm">{x.name}</span>
            <b class="num">{valueText(x, x.value, num)}{#if unitText(x)}<small>{unitText(x)}</small>{/if}</b>
            <span class="src">{t(SRC[x.src] ?? SRC.body)}</span>
          </a>
        </li>
      {/each}
      {#if ticked.length}
        <li>
          <div class="box" data-ticked>
            <span class="nm">{t('Ticked|diagram')}</span>
            <b>{ticked.join(', ')}</b>
            <span class="src">Aktiv</span>
          </div>
        </li>
      {/if}
    </ul>
  {:else}
    <p class="hint">{t('No values on this day.|analyse')}</p>
  {/if}
  <div class="foot">
    <button type="button" class="btn" data-prev onclick={() => onday?.(addDays(day, -1))}><ChevronLeft size={16} aria-hidden="true" />{t('Day before|analyse')}</button>
    <button type="button" class="btn" data-next disabled={day >= today} onclick={() => onday?.(addDays(day, 1))}>{t('Next day|analyse')}<ChevronRight size={16} aria-hidden="true" /></button>
  </div>
</dialog>

<style>
  .ds {
    width: min(560px, calc(100vw - 24px));
  }
  .head,
  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .foot {
    margin-top: 14px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sub {
    margin: 0 0 10px;
    color: var(--ink-2);
  }
  .ib {
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
  .boxes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    max-height: min(56vh, 520px);
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .box {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    color: var(--ink);
    text-decoration: none;
  }
  a.box:hover {
    outline: 1px solid var(--line);
  }
  .box b {
    font-size: var(--fs-sub);
    overflow-wrap: break-word;
  }
  .box b small {
    margin-left: 3px;
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .nm,
  .src {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hint {
    color: var(--ink-3);
  }
</style>
