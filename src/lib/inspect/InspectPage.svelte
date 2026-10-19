<script>
  /**
   * «Velo-Inspektion» (#/bikes?tab=care&view=inspect&bike=<id>[&level=quick|monthly|full]).
   * With a level: one inspection running (InspectRun). Without: the bike's inspections: the state and
   * the starts (InspectCard), the history with values, notes and photos (each can be deleted, with Undo),
   * the bike's own intervals and switches (3a: the weights for rain and trails can be switched off),
   * and «Checkliste bearbeiten» (EditList). Loaded only when opened (Bikes.svelte).
   */
  import { liveQuery } from 'dexie';
  import { Trash2, ChevronDown, Play } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { bikesHash, sortBikes } from '../bikes.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import VeloHead from '../bikes/VeloHead.svelte';
  import { LEVEL } from './items.js';
  import { allPoints, bikeSettings, readValue, FACTOR, INSPECT_TRIP } from './inspect.js';
  import { insp } from './live.svelte.js';
  import { deleteInspection, restoreInspection } from './inspectdb.js';
  import { pointName, levelName } from './names.js';
  import InspectCard from './InspectCard.svelte';
  import InspectRun from './InspectRun.svelte';
  import EditList from './EditList.svelte';

  let { bikeId = null, level = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []).filter((b) => !b.archived && !b.gone));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const listQ = liveQuery(() => db.inspections.toArray());
  const history = $derived(($listQ ?? []).filter((x) => x.bikeId === bike?.id).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.doneAt ?? '').localeCompare(String(a.doneAt ?? ''))));
  const pointById = $derived(Object.fromEntries(allPoints(insp.list).map((p) => [p.id, p])));
  const set = $derived(bike ? bikeSettings(bike) : null);
  let openId = $state(null);

  const STATE_NAME = { ok: 'OK|inspect', watch: 'Watch', fix: 'Fix myself', shop: 'Bike shop' };
  const count = (x, s) => (x.results ?? []).filter((r) => r.state === s).length;

  async function remove(x) {
    const name = `${levelName(x.level)} ${dateOf(x.date)}`;
    const answer = await askDelete({ title: t('Delete "{name}"?', { name }), text: t('The values it wrote into the part history go too. Problems it made stay.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({ name, text: t('"{name}" deleted.', { name }), run: () => deleteInspection(db, x.id), undo: (snap) => restoreInspection(db, snap) });
  }
  async function setBike(patch) {
    const before = $state.snapshot(bike.inspect ?? null);
    const next = { ...(bike.inspect ?? {}), ...patch };
    await db.bikes.update(bike.id, { inspect: next });
    offerDone(t('Saved.'), () => db.bikes.update(bike.id, { inspect: before ?? {} }));
  }
  async function setTrip(on) {
    await db.settings.put({ key: INSPECT_TRIP, value: on });
    offerDone(t('Saved.'), () => db.settings.put({ key: INSPECT_TRIP, value: !on }));
  }
  function setEvery(lv, field, text) {
    const v = text.trim() === '' ? null : readValue(text);
    if (Number.isNaN(v)) return;
    const every = { ...(bike.inspect?.every ?? {}) };
    every[lv] = { ...(every[lv] ?? {}), [field]: v === null ? null : Math.round(v) };
    return setBike({ every });
  }
</script>

{#if !bike}
  <p class="quiet">{t('No bike yet. Add a bike first.')}</p>
{:else if level}
  <InspectRun {bike} {level} list={insp.list} onfinished={() => (location.hash = bikesHash({ tab: 'care', view: 'inspect', bike: bike.id }))} />
{:else}
  <div class="ip" data-inspect-page>
    <VeloHead
      crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bike.id }) }, { label: t('Care|tab'), href: bikesHash({ tab: 'care', bike: bike.id, open: true }) }]}
      title={t('Inspections')}
      sub={bike.name}
    />
    {#if bikes.length > 1}
      <nav class="chips" aria-label={t('Bike')}>
        {#each bikes as b (b.id)}<a class="chip" aria-current={b.id === bike.id ? 'page' : undefined} href={bikesHash({ tab: 'care', view: 'inspect', bike: b.id })}>{b.name}</a>{/each}
      </nav>
    {/if}

    <InspectCard {bike} page />

    <section class="box" aria-labelledby="ih-h">
      <h2 id="ih-h">{t('History')}</h2>
      {#if history.length}
        <ul class="hist">
          {#each history as x (x.id)}
            <li data-inspection={x.id}>
              <div class="row">
                <button type="button" class="head" aria-expanded={openId === x.id} onclick={() => (openId = openId === x.id ? null : x.id)}>
                  <ChevronDown size={16} aria-hidden="true" />
                  <span><b>{levelName(x.level)} · {dateOf(x.date)}</b><small>{x.done ? [x.km != null ? `${num(x.km)} km` : '', tn(count(x, 'ok'), '{n} OK', '{n} OK'), count(x, 'watch') ? t('{n} to watch', { n: count(x, 'watch') }) : '', count(x, 'fix') + count(x, 'shop') ? t('{n} to fix', { n: count(x, 'fix') + count(x, 'shop') }) : ''].filter(Boolean).join(' · ') : t('started, not finished')}</small></span>
                </button>
                {#if !x.done}<a class="btn sm ibtn" href={bikesHash({ tab: 'care', view: 'inspect', bike: bike.id, level: x.level })}><Play size={14} aria-hidden="true" />{t('Continue')}</a>{/if}
                <button type="button" class="ib" aria-label={t('Delete {name}', { name: `${levelName(x.level)} ${dateOf(x.date)}` })} onclick={() => remove(x)} data-inspection-delete><Trash2 size={16} aria-hidden="true" /></button>
              </div>
              {#if openId === x.id}
                <ul class="res">
                  {#each (x.results ?? []).filter((r) => r.state || r.note || r.photos?.length || r.value != null) as r (r.id)}
                    <li>
                      <span class="rn">{pointById[r.id] ? pointName(pointById[r.id]) : t('(deleted point)')}</span>
                      <span class="rs s-{r.state ?? 'none'}">{r.state ? t(STATE_NAME[r.state]) : '–'}{#if r.value != null} · {String(r.value).replace('.', ',')} {pointById[r.id]?.measure?.unit ?? ''}{/if}</span>
                      {#if r.note}<small class="rnote">{r.note}</small>{/if}
                      {#if r.photos?.length}<span class="ph">{#each r.photos as src, i (i)}<img {src} alt={t('Photo {n} of {name}', { n: i + 1, name: pointById[r.id] ? pointName(pointById[r.id]) : '' })} />{/each}</span>{/if}
                    </li>
                  {:else}
                    <li class="quiet">{t('Nothing recorded.')}</li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="quiet">{t('No inspection yet. Start one above: it is saved here with values and photos.')}</p>
      {/if}
    </section>

    <section class="box" aria-labelledby="is-h" data-inspect-settings>
      <h2 id="is-h">{t('Intervals for {bike}', { bike: bike.name })}</h2>
      <p class="hint">{t('Whichever comes first: km or days. Empty: not by that.')}</p>
      {#each ['monthly', 'full'] as lv (lv)}
        <div class="ev">
          <span class="k">{levelName(lv)}</span>
          <label><input class="inp num" type="text" inputmode="numeric" aria-label={t('{level}: every how many km', { level: levelName(lv) })} value={set.every[lv].km ?? ''} placeholder="–" onchange={(e) => setEvery(lv, 'km', e.currentTarget.value)} data-every-km={lv} /> km</label>
          <label><input class="inp num" type="text" inputmode="numeric" aria-label={t('{level}: every how many days', { level: levelName(lv) })} value={set.every[lv].days ?? ''} placeholder="–" onchange={(e) => setEvery(lv, 'days', e.currentTarget.value)} data-every-days={lv} /> {t('days')}</label>
          <small>{t('Standard: {km} km, {days} days', { km: num(LEVEL[lv].every.km), days: LEVEL[lv].every.days })}</small>
        </div>
      {/each}
      <label class="swr">
        <input type="checkbox" checked={set.factors} onchange={(e) => setBike({ factors: e.currentTarget.checked })} data-inspect-factors />
        <span><b>{t('Rain and trails count more')}</b><small>{t('A ride on a rainy day counts ×{wet}, a trail ride ×{trail}, a gravel ride ×{gravel}.', { wet: String(FACTOR.wet).replace('.', ','), trail: String(FACTOR.trail).replace('.', ','), gravel: String(FACTOR.gravel).replace('.', ',') })}</small></span>
      </label>
      <label class="swr">
        <input type="checkbox" checked={!set.off} onchange={(e) => setBike({ off: !e.currentTarget.checked })} data-inspect-remind />
        <span><b>{t('Remind me')}</b><small>{t('Off: no inspection is shown as due for this bike.')}</small></span>
      </label>
      <label class="swr">
        <input type="checkbox" checked={set.buy} onchange={(e) => setBike({ buy: e.currentTarget.checked })} data-inspect-buy />
        <span><b>{t('Worn parts on the wishlist')}</b><small>{t('Chain, brake pads or rotor soon worn: the part goes on the wishlist, with about how many km are left.')}</small></span>
      </label>
    </section>

    <section class="box" aria-labelledby="it-h" data-inspect-trip>
      <h2 id="it-h">{t('Before a tour')}</h2>
      <label class="swr">
        <input type="checkbox" checked={insp.beforeTrip} onchange={(e) => setTrip(e.currentTarget.checked)} data-inspect-beforetrip />
        <span><b>{t('Suggest the quick check before a tour')}</b><small>{t('From two days before the start, the tour preparation and the bike care show «Quick check before the tour». For all bikes.')}</small></span>
      </label>
    </section>

    <EditList />
  </div>
{/if}

<style>
  .ip {
    min-width: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 12px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    color: var(--ink);
    text-decoration: none;
  }
  .chip[aria-current='page'] {
    background: var(--ink);
    color: var(--paper);
  }
  .box {
    margin: 0 0 14px;
    padding: 14px 16px 10px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  h2 {
    margin: 0 0 6px;
    font-size: var(--fs-sub);
  }
  .hint,
  .quiet,
  small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .hist,
  .res {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .hist > li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .head {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .head span {
    display: grid;
    min-width: 0;
  }
  .head b {
    font-weight: 500;
  }
  .ib {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .ibtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .res li {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    padding: 6px 0 6px 24px;
    border-top: 1px dashed var(--line);
  }
  .rn {
    flex: 1 1 12rem;
    min-width: 0;
  }
  .rs.s-fix,
  .rs.s-shop {
    color: var(--bad);
  }
  .rs.s-watch {
    color: var(--warn);
  }
  .rnote {
    flex: 1 1 100%;
  }
  .ph {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ph img {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 6px;
  }
  .ev {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .ev .k {
    flex: 1 1 10rem;
    font-weight: 500;
  }
  .ev .inp {
    width: 5.5rem;
    min-height: 44px;
  }
  .ev small {
    flex: 1 1 100%;
  }
  .swr {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .swr input {
    width: 22px;
    height: 22px;
    margin-top: 2px;
  }
  .swr span {
    display: grid;
  }
  .swr b {
    font-weight: 500;
  }
</style>
