<script>
  /**
   * «Pack-Karten» (Warteliste 4, Baustein 3; Noah 22.11.2026 «4a»): «Trips» begins with the tours that are being prepared, one card each:
   * the progress as a ring, when it starts, a main button («Continue with Clothes» / «Start the packing list») and «Open»; then the card
   * «New trip». Only a suggestion: nothing else moves away, the list «Planned» stays below. Rules: packkarten.js.
   */
  import { liveQuery } from 'dexie';
  import { Plus } from '@lucide/svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { openTrip, openNew } from '../nav.js';
  import { packCards } from './packkarten.js';
  import { SETTING, STEP, cleanChoice } from './schritte.js';

  const dataQ = liveQuery(async () => {
    const [trips, items, s] = await Promise.all([db.trips.toArray(), db.items.toArray(), db.settings.get(SETTING)]);
    return { trips, items, order: cleanChoice(s?.value).order };
  });
  const cards = $derived($dataQ ? packCards({ ...$dataQ, today: localDay() }) : []);
  const dayText = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const when = (c) => (c.days === 0 ? t('Today') : c.days === 1 ? t('Tomorrow') : t('In {n} days', { n: c.days }));

  /** A tap opens the trip's packing list; with a step that waits, the list opens in Steps at that step. */
  function go(c, step = null) {
    openTrip(c.id);
    try {
      if (step) sessionStorage.setItem('pg.packStep', step);
    } catch {
      /* private window: the list opens as it was */
    }
    location.hash = '#/pack';
  }
</script>

{#if cards.length}
  <section class="pk" aria-labelledby="pk-h" data-pack-cards>
    <h2 id="pk-h">{t('Packing|kicker')}</h2>
    {#each cards as c (c.id)}
      <article class="pk-card" data-pack-card={c.id}>
        <span class="pk-ring" style="--pct: {c.pct}" role="img" aria-label={t('{n} % packed', { n: c.pct })}><b class="num">{c.pct} %</b></span>
        <div class="pk-main">
          <h3>{c.title}</h3>
          <p>{when(c)} · {dayText(c.startDate)}</p>
          <div class="pk-acts">
            {#if c.kind === 'continue'}
              <button type="button" class="pk-go" onclick={() => go(c, c.step)} data-pack-continue>{t('Continue with {step}', { step: t(STEP[c.step].name) })}</button>
            {:else if c.kind === 'start'}
              <button type="button" class="pk-go" onclick={() => go(c)} data-pack-continue>{t('Start the packing list')}</button>
            {:else}
              <span class="pk-done">{t('Everything is packed.')}</span>
            {/if}
            <button type="button" class="pk-open" onclick={() => go(c)}>{t('Open|trip')}</button>
          </div>
        </div>
      </article>
    {/each}
    <button type="button" class="pk-new" onclick={() => openNew('list')} data-pack-new><span class="pk-plus" aria-hidden="true"><Plus size={18} /></span><span><b>{t('New trip')}</b><small>{t('Sport, day and bike: then the list is ready')}</small></span></button>
  </section>
{/if}

<style>
  .pk {
    margin: 8px 0 14px;
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  h2 {
    margin: 0;
    color: var(--ink-3);
    font: 600 var(--fs-tiny) var(--font-body);
  }
  .pk-card,
  .pk-new {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    text-align: left;
    min-width: 0;
  }
  .pk-ring {
    flex: none;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: conic-gradient(var(--hi) calc(var(--pct) * 1%), var(--hi-soft) 0);
    position: relative;
  }
  .pk-ring::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    background: var(--paper);
  }
  .pk-ring b {
    position: relative;
    font-size: var(--fs-small);
    color: var(--ink);
  }
  .pk-main {
    min-width: 0;
    flex: 1;
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-body, 16px) var(--font-body);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .pk-main p {
    margin: 2px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pk-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .pk-go,
  .pk-open {
    min-height: 44px;
    padding: 0 16px;
    border-radius: 999px;
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .pk-go {
    border: 0;
    background: var(--hi);
    color: var(--paper);
  }
  .pk-open {
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
  }
  .pk-done {
    color: var(--ink-2);
    font: 600 var(--fs-small) var(--font-body);
  }
  .pk-new {
    width: 100%;
    cursor: pointer;
    color: var(--ink);
  }
  .pk-new span:last-child {
    display: flex;
    flex-direction: column;
  }
  .pk-new small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pk-plus {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--hi);
    color: var(--paper);
  }
</style>
