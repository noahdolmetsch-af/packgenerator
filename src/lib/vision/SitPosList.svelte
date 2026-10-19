<script>
  /**
   * Paket L2 «Sitzposition» (Noah «4a»): the measurements of one bike, the newest first, each with
   * its date, saddle height and angles. Delete with Undo. Used on the bike page and in the tool.
   */
  import { Trash2, Undo2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { sitPosOf, removeSitPos } from './fit.js';
  import { t, dateOf, num } from '../i18n.svelte.js';

  let { bike, limit = 0, onchange = () => {} } = $props();
  const rows = $derived(sitPosOf(bike));
  const shown = $derived(limit ? rows.slice(0, limit) : rows);
  let gone = $state(null); // the bike's list before the last delete

  async function del(id) {
    const cur = await db.bikes.get(bike.id);
    if (!cur) return;
    gone = { bikeId: bike.id, list: cur.sitPos ?? [] };
    await db.bikes.update(bike.id, removeSitPos(cur, id));
    onchange();
  }
  async function undo() {
    if (!gone) return;
    await db.bikes.update(gone.bikeId, { sitPos: $state.snapshot(gone.list) });
    gone = null;
    onchange();
  }
  const line = (r) =>
    [
      r.knee != null ? t('Knee {n}°', { n: r.knee }) : '',
      r.kneeTop != null ? t('top {n}°', { n: r.kneeTop }) : '',
      r.back != null ? t('Back {n}°', { n: r.back }) : '',
      r.hip != null ? t('Hip {n}°', { n: r.hip }) : '',
    ]
      .filter(Boolean)
      .join(' · ');
</script>

{#if shown.length}
  <ul class="sp-list" aria-label={t('Sitting position, history')}>
    {#each shown as r (r.id)}
      <li data-sitpos={r.id}>
        <span class="sp-m">
          <b>{dateOf(r.date)}{r.seatHeight != null ? ` · ${t('Saddle {n} mm', { n: num(r.seatHeight) })}` : ''}</b>
          <small>{line(r)} · {r.source === 'video' ? t('video') : t('photo')}</small>
          {#if r.note}<small>{r.note}</small>{/if}
        </span>
        <button type="button" class="sp-del" aria-label={t('Delete measurement of {date}', { date: dateOf(r.date) })} onclick={() => del(r.id)}><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{/if}
{#if gone && gone.bikeId === bike.id}
  <p class="sp-undo" role="status">{t('Measurement deleted.')} <button type="button" class="sp-link" onclick={undo}><Undo2 size={14} aria-hidden="true" />{t('Undo')}</button></p>
{/if}

<style>
  .sp-list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sp-list li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .sp-list li:first-child {
    border-top: 0;
  }
  .sp-m {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .sp-m small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .sp-del,
  .sp-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
    font: inherit;
  }
  .sp-link {
    color: var(--ink);
    text-decoration: underline;
    min-width: 0;
  }
  .sp-undo {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font-size: var(--fs-small);
  }
</style>
