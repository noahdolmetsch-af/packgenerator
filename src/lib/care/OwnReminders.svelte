<script>
  /**
   * «Eigene Werte anpassbar» (Noah 21.10.2026 «2 a»): the own reminders of Ich › Eigene Werte on the page
   * of one bike in Bikes › Care. «every N km» counts from the bike's km, «every N days» from the day.
   * «Done» starts it again for this bike (Undo for 4 s). Nothing shows when there is no reminder.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { OWN_KEY, mineFor, doneMine } from '../ownvalues.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { localDay } from '../localday.js';
  import { t, tn, num } from '../i18n.svelte.js';
  import { BellRing, Check, ChevronRight } from '@lucide/svelte';

  let { bike } = $props();
  const q = liveQuery(() => db.settings.get(OWN_KEY));
  const raw = $derived($q?.value ?? null);
  const today = localDay();
  const rows = $derived(bike ? mineFor(raw, bike, today).sort((a, b) => Number(b.due) - Number(a.due)) : []);
  const unit = (x, n) => (x.unit === 'km' ? t('{km} km', { km: num(n) }) : tn(n, '{n} day', '{n} days'));
  const state = (r) => (r.never ? t('Not done yet: tap «Done» to start it') : r.due ? t('Due: {n} ago', { n: unit(r.x, r.since) }) : t('In {n}', { n: unit(r.x, r.left) }));

  async function done(r) {
    const old = raw;
    await putSetting(db, OWN_KEY, doneMine(raw, r.x.id, bike, today));
    offerDone(t('«{name}» done.', { name: r.x.name }), () => putSetting(db, OWN_KEY, old));
  }
</script>

{#if rows.length}
  <section class="own-rem" aria-labelledby="own-rem-h" data-own-reminders>
    <h2 id="own-rem-h" class="zlabel"><BellRing size={16} aria-hidden="true" />{t('Own reminders')}</h2>
    <ul class="orl">
      {#each rows as r (r.x.id)}
        <li class:due={r.due} data-own-rem={r.x.id}>
          <span class="m"><b>{r.x.name}</b><small>{state(r)}</small></span>
          <button type="button" class="btn sm" class:hi={r.due} onclick={() => done(r)}><Check size={15} aria-hidden="true" />{t('Done|task')}</button>
        </li>
      {/each}
    </ul>
    <a class="edit" href="#/me/werte"><span>{t('Change in Me › Own values')}</span><ChevronRight size={16} aria-hidden="true" /></a>
  </section>
{/if}

<style>
  .own-rem {
    margin: 0 0 18px;
  }
  .own-rem h2 {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .orl {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .orl li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .orl li.due b {
    color: var(--warn-ink, var(--ink));
  }
  .m {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .m small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .edit {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
