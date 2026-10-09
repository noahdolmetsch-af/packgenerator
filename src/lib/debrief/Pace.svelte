<script>
  /**
   * Your pace (v0.19.0, "App lernt"): load your recorded rides (GPX from Garmin or Strava), the
   * app works out how fast you really ride and uses it for the riding hours in Pack and on the
   * ride day. Each ride can be left out (e.g. a race without luggage). Saved in settings 'pace'.
   */
  import { liveQuery } from 'dexie';
  import { t, tn, num } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { SPEED_KMH, CLIMB_MH } from '../route.js';
  import { PACE_KEY, rideTiming, learnPace, guessFor } from '../pace.js';

  const paceQ = liveQuery(() => db.settings.get(PACE_KEY));
  const saved = $derived($paceQ?.value ?? null);
  const rides = $derived([...(saved?.rides ?? [])].sort((a, b) => b.date.localeCompare(a.date)));
  const pace = $derived(saved?.kmh ? saved : null);

  let msg = $state('');
  let busy = $state(false);

  async function store(list) {
    const learned = learnPace(list);
    await db.settings.put({ key: PACE_KEY, value: { ...(learned ?? { kmh: null, climbMh: null }), rides: list, updatedAt: new Date().toISOString() } });
  }

  async function pick(event) {
    const files = [...event.currentTarget.files];
    event.currentTarget.value = '';
    if (!files.length) return;
    busy = true;
    msg = '';
    try {
      const list = [...(saved?.rides ?? [])];
      let added = 0;
      const skipped = [];
      for (const f of files) {
        const r = rideTiming(await f.text(), f.name);
        if (!r) skipped.push(f.name);
        else if (!list.some((x) => x.id === r.id)) list.push({ ...r, use: true }), added++;
      }
      await store(list);
      msg = tn(added, '{n} ride added.', '{n} rides added.') + (skipped.length ? ` ${t('Without times (planned routes?): {files}.', { files: skipped.join(', ') })}` : '');
    } catch (e) {
      msg = t('Could not read the file: {error}', { error: e.message });
    } finally {
      busy = false;
    }
  }

  const toggle = (id) => store(saved.rides.map((r) => (r.id === id ? { ...r, use: r.use === false } : r)));
  const drop = (id) => store(saved.rides.filter((r) => r.id !== id));
  // open once when shown (an attribute would shut it again on every change)
  const once = (node, v) => {
    node.open = v;
    let done = v;
    return { update: (n) => { if (n && !done) (node.open = true), (done = true); } };
  };
  const hm = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
</script>

<!-- v0.40.0 (design check R1, R6): a light head; not learned yet, it is one row with the
     explanation and the (light) button behind it. Opened from #/debrief/pace it is open. -->
<section id="pace" aria-labelledby="pace-h">
  <details class="pace" use:once={!!pace || location.hash.endsWith('/pace')}>
    <summary class="sec-head"><span id="pace-h">{t('Your pace')}</span><span class="n">{pace ? tn(pace.n, 'from {n} ride', 'from {n} rides') : t('not learned yet')} ›</span></summary>
    <div class="box">
      {#if pace}
        <p class="big"><b class="num">{num(pace.kmh)} km/h</b> {t('plus 1 h per')} <b class="num">{num(pace.climbMh)} m</b> {t('climbing')}</p>
        <p class="muted">{t('You need {pct} % of the standard guess ({kmh} km/h, 1 h per {m} m). Stops add about {stops} % to the riding time. Pack and the ride day use this now.', { pct: Math.round(pace.factor * 100), kmh: SPEED_KMH, m: CLIMB_MH, stops: Math.round((pace.stops - 1) * 100) })}</p>
      {:else}
        <p>{t('The riding hours are a standard guess: {kmh} km/h plus 1 h per {m} m climbing. Load a few of your recorded rides and the app learns how fast you really are.', { kmh: SPEED_KMH, m: CLIMB_MH })}</p>
      {/if}
      <p class="acts">
        <label class="btn sm">{busy ? t('Reading …') : t('Add rides (GPX)')}<input type="file" accept=".gpx,application/gpx+xml" multiple onchange={pick} hidden disabled={busy} /></label>
        <span class="muted small">{t('Garmin Connect or Strava: a ride → Export GPX. Read on this device, nothing is uploaded.')}</span>
      </p>
      {#if msg}<p class="small" role="status">{msg}</p>{/if}
      {#if rides.length}
        <ul class="rides">
          {#each rides as r (r.id)}
            <li class:off={r.use === false}>
              <label><input type="checkbox" checked={r.use !== false} onchange={() => toggle(r.id)} /> <b>{r.name}</b></label>
              <span class="muted small">{r.date} · {r.km} km · ↑ {r.gainM} m · {t('riding {time} h', { time: hm(r.movingH) })}{r.totalH > r.movingH + 0.05 ? ` ${t('({time} h with stops)', { time: hm(r.totalH) })}` : ''}{pace ? ` · ${t('guess {time} h', { time: hm(guessFor(r, pace)) })}` : ''}</span>
              <button type="button" class="link small" onclick={() => drop(r.id)} aria-label={t('Remove {name}', { name: r.name })}>{t('Remove')}</button>
            </li>
          {/each}
        </ul>
        <p class="muted small">{t('Untick a ride that does not fit, e.g. a race without luggage.')}</p>
      {/if}
    </div>
  </details>
</section>

<style>
  .pace > summary {
    cursor: pointer;
    list-style: none;
  }
  .pace > summary::-webkit-details-marker {
    display: none;
  }
  .pace:not([open]) > summary {
    border-bottom: 1px solid var(--line);
    border-radius: 8px;
  }
  .box {
    padding: 12px;
    border: 1px solid var(--line);
    border-top: 0;
    border-radius: 0 0 8px 8px;
    background: var(--paper);
  }
  .big {
    font-size: 1.15rem;
    margin: 0 0 6px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .rides {
    list-style: none;
    margin: 10px 0 4px;
    padding: 0;
  }
  .rides li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 10px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .rides li .muted {
    grid-column: 1;
  }
  .rides li button {
    grid-row: 1 / span 2;
    grid-column: 2;
    align-self: center;
  }
  .rides li.off b {
    color: var(--ink-3);
    text-decoration: line-through;
  }
</style>
