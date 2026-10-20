<script>
  /**
   * «Sensoren» in the live map's sheet (Noah 20.10.2026 «Kann ich meinen Sensor da verbinden und den Wert
   * gleich anzeigen lassen, Herzfrequenz»): connect a heart rate, power or cadence sensor over Bluetooth,
   * see its value and state, connect it again, disconnect it. The values also go into the numbers on top.
   */
  import { HeartPulse, Zap, RotateCw, Bluetooth, X, RefreshCw } from '@lucide/svelte';
  import { sensors, canBluetooth, connectSensor, reconnectSensor, disconnectSensor, fresh } from './sensors.svelte.js';
  import { KINDS } from './ble.js';
  import { t } from '../i18n.svelte.js';

  let { now = Date.now() } = $props();
  let err = $state('');
  let busy = $state('');
  const ICON = { hr: HeartPulse, power: Zap, cadence: RotateCw };
  const ok = canBluetooth();

  async function add(kind) {
    err = '';
    busy = kind;
    const e = await connectSensor(kind);
    busy = '';
    if (e) err = t(e);
  }
  async function again(id) {
    err = '';
    const e = await reconnectSensor(id);
    if (e) err = t(e);
  }
  const state = (s) => (s === 'on' ? t('Connected') : s === 'connecting' ? t('Connecting …') : t('Connection lost: the app tries again.'));
  const valueOf = (kind) => {
    const v = fresh(kind, now);
    return v == null ? '–' : `${v} ${KINDS[kind].unit}`;
  };
</script>

<div class="sb" data-live-sensors>
  <h2 class="lvf-h"><Bluetooth size={18} aria-hidden="true" />{t('Sensors')}</h2>
  {#if !ok}
    <p class="rc-note" data-live-sensors-none>{t('This browser cannot connect Bluetooth sensors. Chrome on Android or on a computer can.')}</p>
  {:else}
    <p class="rc-note">{t('Connect a heart rate belt or watch, a power meter or a cadence sensor. A watch sends its pulse only when «broadcast heart rate» is on in its settings.')}</p>
    {#if sensors.list.length}
      <ul class="sb-list">
        {#each sensors.list as s (s.id)}
          {@const I = ICON[s.kind]}
          <li class="sb-row" data-live-sensor={s.kind}>
            <I size={20} aria-hidden="true" />
            <span class="sb-name"><b>{s.name || t(KINDS[s.kind].name)}</b><small>{state(s.status)}</small></span>
            <b class="sb-val" data-live-sensor-value>{valueOf(s.kind)}{#if s.kind === 'power' && fresh('cadence', now) != null}{' '}· {valueOf('cadence')}{/if}</b>
            {#if s.status === 'lost'}<button type="button" class="btn sm" onclick={() => again(s.id)} aria-label={t('Connect again')}><RefreshCw size={16} aria-hidden="true" /></button>{/if}
            <button type="button" class="btn sm" onclick={() => disconnectSensor(s.id)} aria-label={t('Disconnect {name}', { name: s.name || t(KINDS[s.kind].name) })} data-live-sensor-off><X size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="sb-add">
      {#each Object.keys(KINDS) as k (k)}
        {@const I = ICON[k]}
        <button type="button" class="btn" disabled={busy === k} onclick={() => add(k)} data-live-sensor-add={k}><I size={18} aria-hidden="true" />{t(KINDS[k].name)}</button>
      {/each}
    </div>
    {#if err}<p class="rc-warn" role="alert">{err}</p>{/if}
    <p class="rc-note">{t('The values are only shown and kept with the ride on this device.')}</p>
  {/if}
</div>

<style>
  .sb {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sb-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sb-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
  }
  .sb-name {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
  }
  .sb-name b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sb-name small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sb-val {
    font-size: var(--fs-title);
    white-space: nowrap;
  }
  .sb-add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sb-add :global(.btn) {
    min-height: 44px;
  }
</style>
