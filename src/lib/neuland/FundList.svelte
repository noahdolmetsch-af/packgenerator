<script>
  /**
   * «Eine Fundliste» (Träume und Neuland N10, Noah 07.11.2026 «ok N10»), on Touren › Rückblick › Neuland: one list of what
   * was reached for the first time (this year or all years): the Neuland places, the places of the summit book that
   * Neuland does not hold, and your own «Neuland des Jahres» entries. The year review and Ich › Was mir gut tut read
   * the same list. The rules are in funde.js (pure, tests/funde.test.js); nothing new is stored.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { NEULAND_KEY, neulandYear } from '../wohl.js';
  import { findsOf } from './funde.js';
  import Seg from '../ui/Seg.svelte';
  import Empty from '../ui/Empty.svelte';
  import { dayLong } from '../review/fmt.js';
  import { t } from '../i18n.svelte.js';
  import { Compass, Mountain, Pencil, Moon } from '@lucide/svelte';

  let { result, book, year } = $props();
  const MAX = 4;
  let mode = $state('year'); // 'year' | 'all'
  let all = $state(false);

  const extraQ = liveQuery(async () => {
    const [own, rows] = await Promise.all([db.settings.get(NEULAND_KEY), db.abAnswers.where('qid').equals('spass.coolstes').toArray()]);
    return { own: own?.value ?? [], rows };
  });
  const y = $derived(mode === 'year' ? year : null);
  const list = $derived($extraQ && result ? neulandYear($extraQ.own, $extraQ.rows, y, findsOf({ result, book, year: y })) : []);
  const shown = $derived(all ? list : list.slice(0, MAX));
  const note = (x) => (x.from === 'neuland' ? x.what : x.from === 'gipfelbuch' ? t('From the summit book') : x.from === 'evening' ? t('from your evening answer') : t('Your own entry'));
  const iconOf = (x) => (x.from === 'gipfelbuch' ? Mountain : x.from === 'evening' ? Moon : x.from === 'neuland' ? Compass : Pencil);
</script>

{#if $extraQ && result}
  <section class="rv-sec fl" aria-labelledby="fl-h" data-fundliste>
    <div class="rv-h">
      <div>
        <h2 id="fl-h">{t('List of finds')}</h2>
        <p class="rv-sub">{t('Everything you reached for the first time in one list: Neuland places, your summit book and your own entries.')}</p>
      </div>
    </div>
    <Seg full={false} small label={t('Period')} value={mode} onchange={(v) => ((mode = v), (all = false))} options={[{ key: 'year', name: t('This year') }, { key: 'all', name: t('All years') }]} />
    {#if list.length}
      <ul class="card fl-list" data-fund-list>
        {#each shown as x (x.id)}
          {@const Icon = iconOf(x)}
          <li data-fund={x.from ?? 'own'}>
            <Icon size={18} aria-hidden="true" />
            <span class="fl-t"><b>{x.name}</b><small>{note(x)} · {dayLong(x.day)}</small></span>
          </li>
        {/each}
      </ul>
      {#if list.length > MAX}
        <button type="button" class="btn sm fl-more" onclick={() => (all = !all)} data-fund-more>{all ? t('Show fewer') : t('Show {n} more', { n: list.length - MAX })}</button>
      {/if}
      <p class="fl-next">{t('This list is the «Neuland of the year» in your year review.')} <a href="#/me/wohl" data-fund-wohl>{t('Add your own Neuland')} ›</a></p>
    {:else}
      <Empty icon={Compass} text={mode === 'year' ? t('Nothing found yet this year. A ride past a new place, a visit in the summit book or an own entry lands here by itself.') : t('Nothing found yet. A ride past a new place, a visit in the summit book or an own entry lands here by itself.')} action={{ label: t('Add your own Neuland'), href: '#/me/wohl' }} />
    {/if}
  </section>
{/if}

<style>
  .fl {
    margin-top: var(--sp-4, 16px);
  }
  .fl-list {
    list-style: none;
    margin: var(--sp-2, 8px) 0 0;
    padding: var(--sp-2, 8px) var(--sp-3, 12px);
    display: grid;
    gap: 10px;
  }
  .fl-list li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .fl-list :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-2);
  }
  .fl-t {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .fl-t small {
    color: var(--ink-3);
  }
  .fl-more {
    margin-top: var(--sp-2, 8px);
  }
  .fl-next {
    margin: var(--sp-2, 8px) 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
