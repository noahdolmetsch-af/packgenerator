<script>
  /**
   * «Übliche Dauer» (Noah 21.11.2026 «2b»): in «Meine Aktivitäten» one fold with every activity and how long
   * one session usually takes (steps of 15 min, «Standard» = 60 min). Where a tick has no measured time the
   * Sportjahr estimates with this value and says «ca.». The same value sits in the editor of each activity.
   * Setting sport.usualMin (backup); nothing is ever written into a tick.
   */
  import { liveQuery } from 'dexie';
  import { Minus, Plus } from '@lucide/svelte';
  import { db } from '../db.js';
  import { actName } from './ui.svelte.js';
  import ActIcon from './ActIcon.svelte';
  import { USUAL_KEY, DEFAULT_MIN, MAX_MIN, usualMap, usualFor, saveUsual, restoreUsual } from './usualmin.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { acts = [] } = $props();
  const q = liveQuery(() => db.settings.get(USUAL_KEY));
  const map = $derived(usualMap($q?.value));
  const list = $derived([...acts].filter((a) => !a.paused).sort((a, b) => a.order - b.order));
  const STEP = 15;
  const set = (a, min) => saveUsual(db, a.id, min);
  async function reset(a) {
    const before = await saveUsual(db, a.id, 0);
    offerDone(t('«{name}»: usual duration back to the standard.', { name: actName(a) }), () => restoreUsual(db, before));
  }
</script>

{#if list.length}
  <details class="card fold usual" data-usual-list>
    <summary><span>{t('Usual duration')}</span><small>{t('For ticks without a measured time, shown as «ca.»')}</small></summary>
    <p class="hint">{t('Where Strava, the timer or you gave no minutes, the evaluation counts the usual duration of the sport and marks it «ca.». Without a setting it counts {n} min. A measured time always counts first.', { n: DEFAULT_MIN })}</p>
    <ul class="ul">
      {#each list as a (a.id)}
        {@const u = usualFor(map, a.id)}
        <li data-usual={a.id}>
          <ActIcon icon={a.icon} ring={a.ring} />
          <span class="nm">{actName(a)}</span>
          <span class="st">
            <button type="button" class="rb" disabled={u.min <= STEP} onclick={() => set(a, Math.max(STEP, u.min - STEP))} aria-label={t('Shorter: {name}', { name: actName(a) })}><Minus size={16} aria-hidden="true" /></button>
            <span class="v num" aria-live="polite" data-usual-min={u.min}>{u.own ? t('{n} min', { n: u.min }) : t('{n} min (standard)', { n: u.min })}</span>
            <button type="button" class="rb" disabled={u.min >= MAX_MIN} onclick={() => set(a, Math.min(MAX_MIN, u.min + STEP))} aria-label={t('Longer: {name}', { name: actName(a) })}><Plus size={16} aria-hidden="true" /></button>
          </span>
          {#if u.own}<button type="button" class="btn btn-link" onclick={() => reset(a)}>{t('Standard')}</button>{/if}
        </li>
      {/each}
    </ul>
  </details>
{/if}

<style>
  .usual summary small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ul {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ul li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    min-height: 44px;
  }
  .nm {
    flex: 1 1 8rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .st {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .v {
    min-width: 7.5rem;
    text-align: center;
    font-size: var(--fs-small);
  }
  .rb {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
  }
  .rb:disabled {
    opacity: 0.4;
  }
</style>
