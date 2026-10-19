<script>
  /**
   * v0.97.0 «Skitouren», mockup C «Start-Check»: five big ticks at the car park (transceiver on and
   * sending, its battery with an optional %, the group check, the avalanche bulletin, the turnaround
   * time with chips 12:30 · 13:00 · 13:30 · other), kept in trip.ready (ids lvs, battery, group,
   * bulletin, turn) and trip.ski.turnAt. Opening the page adds the missing checks to the trip, never
   * takes one away. «Los geht's · um HH:MM umkehren»; on the day the turnaround time comes as a notice
   * in the app (lib/ski/SkiTurn.svelte, no push). Everything is a suggestion.
   * #/ski/start (today's or the next ski tour) or #/ski/start/<trip id>.
   * SKB2 (Noah 15.10.2026 «2a»): «Letzter Zug zurück» with the way down suggests a turnaround time (a chip
   * that sets it; nothing set by itself). SKB6: the decision points of the tour, ticked on the way with
   * their time (lib/skiday.js).
   */
  import { ChevronLeft, Check, ExternalLink, Plus, X } from '@lucide/svelte';
  import { skiQuery, ensureStartChecks, setCheck, setSki } from '../../lib/ski/skidb.js';
  import { nextSkiTrip, START_CHECKS, TURN_TIMES, turnTime, isSki, SKI, parseDuration, durationText } from '../../lib/ski.js';
  import { newTrip } from '../../lib/nav.js';
  import { localDay } from '../../lib/localday.js';
  import { turnFromTrain, DESCENT_MIN, addPoint, dropPoint, pointsOf } from '../../lib/skiday.js';
  import Empty from '../../lib/ui/Empty.svelte';
  import { t } from '../../lib/i18n.svelte.js';

  let { id = '' } = $props();
  const today = localDay();
  const q = skiQuery();
  const data = $derived($q);
  const trip = $derived.by(() => {
    if (!data) return null;
    if (id) return data.trips.find((x) => x.id === id) ?? null;
    return data.trips.find((x) => isSki(x) && x.startDate === today && !x.skipped) ?? nextSkiTrip(data.trips, today)?.trip ?? null;
  });
  const tripId = $derived(trip?.id ?? null);
  $effect(() => {
    if (tripId) ensureStartChecks(tripId);
  });
  const ready = $derived(Object.fromEntries((trip?.ready ?? []).map((r) => [r.id, r])));
  const turnAt = $derived(turnTime(trip?.ski?.turnAt));
  let other = $state(false);
  const otherOn = $derived(other || (!!turnAt && !TURN_TIMES.includes(turnAt)));

  async function pickTurn(time) {
    if (!trip) return;
    const at = turnTime(time);
    if (at && at === turnAt) {
      await setSki(trip.id, { turnAt: '' });
      await setCheck(trip.id, 'turn', false);
      return;
    }
    await setSki(trip.id, { turnAt: at });
    await setCheck(trip.id, 'turn', !!at);
  }
  const SUB = { group: 'Everyone tests sending once' };
  async function battery(e) {
    const v = String(e.currentTarget.value ?? '').trim();
    const n = v === '' ? null : Math.max(0, Math.min(100, Math.round(Number(v))));
    await setSki(trip.id, { batteryPct: Number.isFinite(n) ? n : null });
  }
  /* SKB2: the last train back → a turnaround suggestion */
  const trainAt = $derived(turnTime(trip?.ski?.trainAt));
  const descent = $derived(Number.isFinite(trip?.ski?.descentMin) && trip.ski.descentMin > 0 ? trip.ski.descentMin : DESCENT_MIN);
  const fromTrain = $derived(turnFromTrain(trainAt, descent));
  const setTrain = (e) => setSki(trip.id, { trainAt: turnTime(e.currentTarget.value) });
  const setDescent = (e) => setSki(trip.id, { descentMin: parseDuration(e.currentTarget.value) ?? null });
  /* SKB6: the decision points */
  const points = $derived(pointsOf(trip));
  let point = $state('');
  async function addOne(e) {
    e?.preventDefault();
    const name = point.trim();
    if (!name) return;
    point = '';
    await setSki(trip.id, (ski) => ({ points: addPoint(pointsOf({ ski }), name) }));
  }
  const dropOne = (id) => setSki(trip.id, (ski) => ({ points: dropPoint(pointsOf({ ski }), id) }));
  async function go() {
    if (trip) await setSki(trip.id, { startedAt: new Date().toISOString() });
    location.hash = '#/ski';
  }
</script>

<div class="sk start">
  <p class="sk-back"><a href="#/ski"><ChevronLeft size={16} aria-hidden="true" />{t('Ski tours')}</a></p>
  <div>
    <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Start check')}</h1>
    <p class="sk-sub">{t('At the car park, before the first step · 30 seconds')}</p>
  </div>
  {#if data && !trip}
    <Empty text={t('No ski tour yet. Plan one: the backpack check, the start check and the care follow.')} action={{ label: t('Plan a ski tour'), onclick: () => newTrip('standard', SKI) }} />
  {:else if trip}
    <ul class="surf sk-rows checks">
      {#each START_CHECKS as c (c.id)}
        <li data-check={c.id}>
          <div class="cr">
            <button type="button" class="sk-tick" role="checkbox" aria-checked={!!ready[c.id]?.done} onclick={() => setCheck(trip.id, c.id)}>
              <span class="sk-box big" aria-hidden="true">{#if ready[c.id]?.done}<Check size={22} strokeWidth={3} />{/if}</span>
              <span class="sk-tt"><b>{t(c.label)}</b>{#if SUB[c.id]}<small>{t(SUB[c.id])}</small>{/if}{#if c.id === 'turn' && turnAt}<small class="num">{t('Turn around at {time}', { time: turnAt })}</small>{/if}</span>
            </button>
            {#if c.id === 'battery'}
              <label class="pct"><input class="inp num" type="number" inputmode="numeric" min="0" max="100" placeholder="%" value={trip.ski?.batteryPct ?? ''} onchange={battery} aria-label={t('Battery in percent')} /><span aria-hidden="true">%</span></label>
            {/if}
          </div>
          {#if c.id === 'bulletin'}
            <p class="more"><a class="ext" href="https://www.slf.ch" target="_blank" rel="noopener noreferrer">{t('Avalanche bulletin on slf.ch')}<ExternalLink size={14} aria-hidden="true" /></a></p>
          {/if}
          {#if c.id === 'turn'}
            <div class="sk-chips more" role="group" aria-label={t('Turnaround time')}>
              {#each TURN_TIMES as time (time)}<button type="button" class="sk-chip num" aria-pressed={turnAt === time} onclick={() => pickTurn(time)}>{time}</button>{/each}
              <button type="button" class="sk-chip add" aria-pressed={otherOn} onclick={() => (other = !other)}>{t('other|time')}</button>
              {#if otherOn}<input class="inp num tm" type="time" value={TURN_TIMES.includes(turnAt) ? '' : turnAt} onchange={(e) => pickTurn(e.currentTarget.value)} aria-label={t('Own turnaround time')} />{/if}
            </div>
            <div class="train more" data-train>
              <label class="sk-field"><span>{t('Last train back')}</span><input class="inp num tm" type="time" value={trainAt} onchange={setTrain} /></label>
              <label class="sk-field"><span>{t('Way down to the train')}</span><input class="inp num dn" value={durationText(descent)} onchange={setDescent} placeholder="2:00" /></label>
              {#if fromTrain}<button type="button" class="sk-chip num" aria-pressed={turnAt === fromTrain} onclick={() => turnAt !== fromTrain && pickTurn(fromTrain)} data-from-train>{t('Suggestion: turn at {time}', { time: fromTrain })}</button>{/if}
            </div>
            {#if fromTrain}<p class="sk-quiet more">{t('Train {train} minus the way down {down} and 30 minutes buffer. Only a suggestion.', { train: trainAt, down: durationText(descent) })}</p>{/if}
          {/if}
        </li>
      {/each}
    </ul>
    <section class="surf sk-pad pts" aria-labelledby="pts-h" data-points>
      <h2 id="pts-h" class="ph">{t('Decision points (optional)')}</h2>
      <p class="sk-quiet">{t('Where you decide again on the way. On the tour you tick each one; its time goes into «After the tour».')}</p>
      {#if points.length}
        <ul class="sk-list">
          {#each points as p (p.id)}<li class="pt"><span>{p.name}</span><button type="button" class="ix" aria-label={t('Remove {name}', { name: p.name })} onclick={() => dropOne(p.id)}><X size={16} aria-hidden="true" /></button></li>{/each}
        </ul>
      {/if}
      <form class="addp" onsubmit={addOne}>
        <input class="inp" bind:value={point} maxlength="60" placeholder={t('e.g. {x}', { x: 'Sattel 2400 m' })} aria-label={t('New decision point')} />
        <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add|point')}</button>
      </form>
    </section>
    <button type="button" class="btn hi sk-go" onclick={go}>{turnAt ? t("Let's go · turn around at {time}", { time: turnAt }) : t("Let's go")}</button>
    <p class="sk-quiet sk-center">{t('A suggestion, nothing is a must. The turnaround time comes as a reminder.')}</p>
  {/if}
</div>

<style>
  .start {
    max-width: 640px;
  }
  .checks > li {
    padding: 4px 0;
  }
  .cr {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cr .sk-tick {
    min-height: 60px;
  }
  .pct {
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
  }
  .pct input {
    width: 76px;
  }
  .more {
    margin: 0 0 10px 50px;
  }
  .ext {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .tm {
    width: auto;
    min-height: 44px;
  }
  .train {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px;
  }
  .dn {
    width: 90px;
    min-height: 44px;
  }
  .pts {
    display: grid;
    gap: 10px;
  }
  .ph {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  .pt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
  }
  .ix {
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
  .addp {
    display: flex;
    gap: 8px;
  }
  .addp .inp {
    flex: 1;
    min-width: 0;
    min-height: 44px;
  }
  .addp .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  @media (max-width: 359px) {
    .more {
      margin-left: 0;
    }
  }
</style>
