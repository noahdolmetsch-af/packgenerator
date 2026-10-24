<script>
  /**
   * Paket O «Sportarten» (#96): the activity mosaic over all sports and Meditation with their goals. It was
   * the top of #/flow/sports; with «Meine Sportarten» (Noah 22.10.2026 «4a») it is a fold at the page end.
   * list: the sports in order, rows: { sport, dayMap, goal }, cfg: the sports settings (colours).
   */
  import { mosaic } from '../sportshelp.js';
  import { colorOf } from '../sportsbase.js';
  import { sportName } from './words.js';
  import { phone } from '../media.svelte.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { list = [], rows = [], cfg = {}, today } = $props();
  let showAll = $state(false);
  const n = $derived(phone.matches ? 14 : 28);
  const grid = $derived(mosaic(rows, today, n));
  const shown = $derived(showAll ? grid : grid.filter((r) => r.active || r.goal));
  const fmt = (d, o) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
</script>

<p class="small">{t('One square per day you did the sport, in its colour. On the right: how far you are with its goal.')}</p>
{#if shown.length}
  <ul class="mrows">
    {#each shown as r (r.sport.id)}
      {@const c = colorOf(r.sport.id, list, cfg)}
      <li data-mosaic-row={r.sport.id}>
        <a class="mn" href="#/flow/sport/{encodeURIComponent(r.sport.id)}"><i class="dot" style="background:{c}"></i>{sportName(r.sport)}</a>
        <span class="cells" style="--n:{n}" aria-label={t('{name}: {k} of the last {n} days', { name: sportName(r.sport), k: r.cells.filter((x) => x.n).length, n })}>
          {#each r.cells as x (x.day)}<i class="cell" class:on={x.n > 0} style={x.n ? `background:${c}` : ''} title={fmt(x.day, { weekday: 'short', day: 'numeric', month: 'short' })}></i>{/each}
        </span>
        <span class="mg num" class:met={r.met}>{#if r.goal}{t('{n} of {m}', { n: r.times, m: r.goal.count })}<small>{tn(r.goal.days, '{n} day', '{n} days')}</small>{/if}</span>
      </li>
    {/each}
  </ul>
{:else}
  <p class="none">{t('Nothing done in this time yet. Tick an activity in Aktiv or finish a trip, then it shows here.')}</p>
{/if}
{#if grid.length > shown.length || showAll}
  <button type="button" class="lnk" onclick={() => (showAll = !showAll)} data-mosaic-all>{showAll ? t('Only the active ones') : tn(grid.length - shown.length, 'Show {n} more sport', 'Show {n} more sports')}</button>
{/if}
