<script>
  /**
   * AB1 / AB2 «Wie oft fragen?»: several times a day (with its times, «+ Zeit»), daily, weekly (a
   * weekday), monthly (the 1st) and, for an own question, off. every is bindable ({ kind, … }, abfragen.js).
   */
  import { Plus, X } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { t } from '../i18n.svelte.js';
  import { everyOf, timeOf } from '../abfragen.js';
  import { hm, dayName } from './words.js';

  let { every = $bindable(), allowOff = false, idp = 'iv' } = $props();
  const e = $derived(everyOf(every));
  const kind = $derived(e.kind === 'times' ? 'several' : e.kind);
  const times = $derived(e.kind === 'times' ? e.times : e.kind === 'off' ? [] : [e.time]);
  let adding = $state('20:00');

  const KINDS = $derived([
    { key: 'several', name: t('Several times a day') },
    { key: 'daily', name: t('Daily|interval') },
    { key: 'weekly', name: t('Weekly|interval') },
    { key: 'monthly', name: t('Monthly|interval') },
    ...(allowOff ? [{ key: 'off', name: t('Off|question') }] : []),
  ]);
  function setKind(k) {
    const time = times[0] ?? '08:00';
    if (k === 'several') every = { kind: 'times', times: times.length > 1 ? times : [time, time < '18:00' ? '18:00' : '12:00'] };
    else if (k === 'daily') every = { kind: 'daily', time };
    else if (k === 'weekly') every = { kind: 'weekly', dow: e.kind === 'weekly' ? e.dow : 0, time: e.kind === 'weekly' ? e.time : '19:00' };
    else if (k === 'monthly') every = { kind: 'monthly', time };
    else every = { kind: 'off' };
  }
  const setTime = (v) => {
    const x = timeOf(v);
    if (x) every = { ...e, time: x };
  };
  const drop = (x) => (every = everyOf({ kind: 'times', times: times.filter((y) => y !== x) }));
  function add() {
    const x = timeOf(adding);
    if (x) every = everyOf({ kind: 'times', times: [...times, x] });
  }
</script>

<div class="ivp">
  <Seg options={KINDS} value={kind} onchange={setKind} label={t('How often to ask?')} />
  {#if kind === 'several'}
    <div class="times">
      <small>{t('at|time')}</small>
      {#each times as x (x)}
        <span class="tm num">{hm(x)}<button type="button" aria-label={t('Remove {time}', { time: hm(x) })} onclick={() => drop(x)} disabled={times.length < 2}><X size={14} aria-hidden="true" /></button></span>
      {/each}
      <label class="add"><span class="sr">{t('New time')}</span><input class="inp num" type="time" bind:value={adding} id="{idp}-new" /></label>
      <button type="button" class="btn sm" onclick={add}><Plus size={14} aria-hidden="true" />{t('Time')}</button>
    </div>
  {:else if kind === 'daily' || kind === 'monthly'}
    <label class="one"><span>{kind === 'monthly' ? t('on the 1st of the month at') : t('at|time')}</span><input class="inp num" type="time" value={e.time} onchange={(ev) => setTime(ev.currentTarget.value)} id="{idp}-time" /></label>
  {:else if kind === 'weekly'}
    <div class="wk">
      <div class="days" role="group" aria-label={t('Weekday')}>
        {#each [1, 2, 3, 4, 5, 6, 0] as d (d)}
          <button type="button" class="ab-opt" aria-pressed={e.dow === d} onclick={() => (every = { ...e, dow: d })}>{dayName(d)}</button>
        {/each}
      </div>
      <label class="one"><span>{t('at|time')}</span><input class="inp num" type="time" value={e.time} onchange={(ev) => setTime(ev.currentTarget.value)} id="{idp}-time" /></label>
    </div>
  {/if}
</div>

<style>
  .ivp {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .times,
  .days {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .times small,
  .one span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tm {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 46px;
    padding: 0 0 0 12px;
    box-sizing: border-box;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
  }
  .tm button {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .tm button:disabled {
    opacity: 0.35;
  }
  .add input,
  .one input {
    min-height: 44px;
    box-sizing: border-box;
  }
  .one {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .wk {
    display: grid;
    gap: 10px;
  }
</style>
