<script>
  /**
   * v0.46.0 «Startseite neu» (Noah 24a, 25a): the bikes as small cards in one row (2 × 2 on a phone):
   * the ready light as a dot (red due, amber soon, green ready, empty: nothing to judge by), the name
   * and one line ("2'288 km · 3 due", "Chain in 59 km", "ready", "+ log km"). A tap opens that bike in
   * Bikes → Care. Nothing unfolds on Today any more (the pills of 0.38 broke words letter by letter).
   */
  import { bikesHash } from '../bikes.js';
  import { readyLight, quickHints, LIGHT_WORD } from '../quickcare.js';
  import { hubBike, openIdeas, IDEAS_KEY } from '../hubs.js';
  import BikeQuickDialog from '../hubs/BikeQuickDialog.svelte';
  import { t, tn, num } from '../i18n.svelte.js';

  let { bikes = [], tasks = [], visits = [], next = null, today } = $props();

  /* The bike jobs of the old "Bikes ready?" (0.25.1, 0.38.0) stay as one quiet line under the cards:
     Log a problem (an open repair in Bike care), Idea, Log a workshop visit, Workshop order. */
  let dialog = $state(null); // 'problem' | 'idea' | 'visit'
  let saved = $state(null); // { kind, bikeId }
  let savedTimer;
  function done(s) {
    clearTimeout(savedTimer);
    saved = s;
    savedTimer = setTimeout(() => (saved = null), 6000);
  }
  $effect(() => () => clearTimeout(savedTimer));
  const savedText = { problem: 'Saved in Bike care.', idea: 'Idea saved.', visit: 'Workshop visit saved.' };
  const savedHref = (s) => (s.kind === 'idea' ? bikesHash({ bike: s.bikeId }) : bikesHash({ tab: 'care', bike: s.bikeId, open: true }));
  const wantIdeas = () => {
    try {
      localStorage.setItem(IDEAS_KEY, '1');
    } catch {
      /* private mode: the section stays closed */
    }
  };
  const ideas = $derived(bikes.map((b) => ({ bike: b, n: openIdeas(b.ideas) })).filter((x) => x.n));

  const rows = $derived(
    bikes.map((b) => {
      const light = readyLight(b, { tasks, visits, trip: next?.bikeId === b.id ? next : null, today });
      const h = quickHints(b, { visits, today });
      const km = typeof b.km === 'number' ? `${num(b.km)} km` : null;
      let line;
      if (light.tone === 'due') line = [km, tn(light.n, '{n} due', '{n} due')].filter(Boolean).join(' · ');
      else if (light.tone === 'soon') line = h.chain && h.chain.left > 0 && h.chain.left <= 150 ? t('Chain in {km} km', { km: num(h.chain.left) }) : [km, tn(light.n, '{n} due soon', '{n} due soon')].filter(Boolean).join(' · ');
      else if (light.tone === 'ok') line = [km, t('ready')].filter(Boolean).join(' · ');
      else line = km ? `${km} · ${t('no data|light')}` : t('+ log km');
      return { bike: b, tone: light.tone, line };
    }),
  );
</script>

{#if rows.length}
  <section class="bikes" aria-labelledby="bk-h">
    <h2 id="bk-h" class="sr">{t('Bikes|place')}</h2>
    <ul>
      {#each rows as r (r.bike.id)}
        <li>
          <a class="bk" href={bikesHash({ tab: 'care', bike: r.bike.id, open: true })} data-bike={r.bike.id} data-tone={r.tone}>
            <span class="nm"><span class="dot {r.tone}" aria-hidden="true"></span><span class="n">{r.bike.name}</span><span class="sr">, {t(LIGHT_WORD[r.tone])}</span></span>
            <span class="ln num">{r.line}</span>
          </a>
        </li>
      {/each}
    </ul>
    <p class="jobs">
      <button type="button" class="lk" onclick={() => (dialog = 'problem')}>{t('Log a problem')}</button>
      <button type="button" class="lk" onclick={() => (dialog = 'idea')}>{t('Idea')}</button>
      <button type="button" class="lk" onclick={() => (dialog = 'visit')}>{t('Log a workshop visit')}</button>
      <a class="lk" href="#/bikes?tab=care">{t('Workshop order')}</a>
      {#each ideas as x (x.bike.id)}<a class="lk quiet" href={bikesHash({ bike: x.bike.id })} onclick={wantIdeas}>{x.bike.name}: {tn(x.n, '{n} idea', '{n} ideas')}</a>{/each}
    </p>
    {#if saved}
      <p class="saved" role="status">{t(savedText[saved.kind])} <a href={savedHref(saved)} onclick={() => saved.kind === 'idea' && wantIdeas()}>{t('Open')}</a></p>
    {/if}
  </section>
  {#if dialog}
    <BikeQuickDialog kind={dialog} {bikes} bikeId={hubBike(next, bikes)} tripId={next?.id ?? null} onsaved={done} onclose={() => (dialog = null)} />
  {/if}
{/if}

<style>
  .jobs {
    display: flex;
    flex-wrap: wrap;
    gap: 0 18px;
    margin: 6px 0 0;
  }
  .lk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 500 14px/1.3 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .lk:hover {
    color: var(--ink);
  }
  .lk.quiet {
    text-decoration: none;
    color: var(--ink-3);
  }
  .saved {
    margin: 6px 0 0;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--ink);
    color: var(--paper);
    font-size: 14px;
  }
  .saved a {
    color: var(--paper);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  @media (min-width: 720px) {
    ul {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
  }
  .bk {
    display: grid;
    gap: 2px;
    min-height: 64px;
    height: 100%;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    text-decoration: none;
    box-sizing: border-box;
  }
  .bk:hover {
    border-color: var(--line-strong);
  }
  .nm {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-weight: 600;
  }
  .n {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ln {
    font-size: 14px;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-sizing: border-box;
  }
  .dot.due {
    background: var(--bad);
  }
  .dot.soon {
    background: var(--warn);
  }
  .dot.ok {
    background: var(--accent);
  }
  .dot.nodata {
    border: 2px solid var(--line-strong);
  }
</style>
