<script>
  /**
   * Erinnerungen aufs Handy (Web-Push; Noah 15.10.2026 «1a 2b 3a 4b 5a»): Ich › Erinnerungen aufs Handy
   * (#/me/push). 5a: one main switch and one switch per kind; 2b: everything off until switched on one by
   * one. Turning the main switch on asks Chrome once for notifications and signs this phone up; then the
   * app sends the server its next reminders (push/client.js), and the server sends them at their time.
   * Paket B (anleitung.md Teil 7): «Adresse für cron-job.org kopieren» fetches the tick address (with the
   * code the server made itself) and copies it; when the clipboard refuses, the address is shown to select.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { KINDS, PUSH_KEY, pushOf } from '../lib/push/schedule.js';
  import { supported, permission, syncNow, off, testNow, cronUrl } from '../lib/push/client.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { BellRing, Send, Info, Copy, Check } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const pushQ = liveQuery(() => db.settings.get(PUSH_KEY));
  const p = $derived(pushOf($pushQ?.value));
  const can = supported();
  let busy = $state(false);
  let msg = $state('');
  let planned = $state(null);

  const WHY = {
    unsupported: 'This browser cannot get reminders. On the phone it works in Chrome.',
    denied: 'Notifications are blocked. Allow them in the browser settings for this page.',
    not_set_up: 'The server is not set up for this yet.',
    storage_not_set_up: 'The server is not set up for this yet.',
  };
  const fail = (e) => (msg = t(WHY[e?.code] ?? 'The server could not be reached. Try again later.'));

  async function save(value) {
    await db.settings.put({ key: PUSH_KEY, value });
  }
  async function sync() {
    busy = true;
    msg = '';
    try {
      const out = await syncNow({ force: true });
      planned = out ? out.items + out.weather : null;
    } catch (e) {
      fail(e);
    }
    busy = false;
  }
  async function setMain(on) {
    if (on && !can) return (msg = t(WHY.unsupported));
    await save({ ...p, on });
    if (on) {
      await sync();
      if (msg) await save({ ...p, on: false });
    } else {
      planned = null;
      await off();
    }
  }
  async function setKind(key, on) {
    await save({ ...p, kinds: { ...p.kinds, [key]: on } });
    if (p.on) await sync();
  }
  async function test() {
    msg = '';
    try {
      const r = await testNow(t('Pack Generator'), t('This is how your reminders arrive.'));
      if (!r.ok) msg = t('The test did not arrive. Try again later.');
    } catch (e) {
      fail(e);
    }
  }
  // cron-job.org wakes the server every minute (Noah «2b»): the address to paste there, set up once
  let cron = $state({ busy: false, done: false, shown: '', msg: '' });
  const CRON_WHY = {
    no_owner: 'First connect Strava or enter the helper code on this device.',
    unauthorized: 'First connect Strava or enter the helper code on this device.',
    storage_not_set_up: 'The server is not set up for this yet.',
  };
  async function copyCron() {
    cron = { busy: true, done: false, shown: '', msg: '' };
    let url;
    try {
      url = await cronUrl();
    } catch (e) {
      cron = { busy: false, done: false, shown: '', msg: t(CRON_WHY[e?.code] ?? 'The server could not be reached. Try again later.') };
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      cron = { busy: false, done: true, shown: '', msg: '' };
    } catch {
      cron = { busy: false, done: false, shown: url, msg: '' }; // the clipboard refused: select it by hand
    }
  }

  const status = $derived(!can ? t(WHY.unsupported) : p.on ? (planned != null ? tn(planned, 'On. {n} reminder is planned.', 'On. {n} reminders are planned.') : t('On.')) : permission() === 'denied' ? t(WHY.denied) : t('Off. Nothing goes to the phone.'));
</script>

<div class="ich-page pushpage" data-push-page>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Reminders on the phone')} sub={t('The app sends you reminders on the phone, also when it is closed. Everything is off until you switch it on.')} />

  <section class="card ps-card" aria-label={t('Reminders on the phone')}>
    <div class="ps-row ps-main">
      <span class="ps-ib" aria-hidden="true"><BellRing size={18} /></span>
      <span class="ps-m"><b id="ps-main-l">{t('On the phone')}</b><small role="status">{status}</small></span>
      <input class="ps-sw" type="checkbox" role="switch" aria-labelledby="ps-main-l" checked={p.on} disabled={busy} onchange={(e) => setMain(e.currentTarget.checked)} data-push-main />
    </div>
    {#if msg}<p class="ps-msg" role="alert">{msg}</p>{/if}
  </section>

  <section class="ps-sec" aria-labelledby="ps-kinds-h">
    <h2 id="ps-kinds-h">{t('Which reminders')}</h2>
    <ul class="card ps-list">
      {#each KINDS as k (k.key)}
        <li class="ps-row" data-push-kind={k.key}>
          <span class="ps-m"><b id="ps-{k.key}">{t(k.label)}</b><small>{t(k.hint)}</small></span>
          <input class="ps-sw" type="checkbox" role="switch" aria-labelledby="ps-{k.key}" checked={p.kinds[k.key]} disabled={busy} onchange={(e) => setKind(k.key, e.currentTarget.checked)} />
        </li>
      {/each}
    </ul>
  </section>

  {#if p.on}<p class="ps-acts"><button type="button" class="btn" onclick={test} data-push-test><Send size={16} aria-hidden="true" />{t('Send a test')}</button></p>{/if}
  <section class="ps-sec" aria-labelledby="ps-cron-h" data-push-cron>
    <h2 id="ps-cron-h">{t('Wake-up call for the server')}</h2>
    <div class="card ps-card">
      <p class="ps-txt">{t('Set up once: cron-job.org calls our free server every minute, so the reminders come on time. Copy the address and paste it there as the URL.')}</p>
      <p class="ps-acts ps-cron-acts">
        <button type="button" class="btn" onclick={copyCron} disabled={cron.busy} data-push-cron-copy><Copy size={16} aria-hidden="true" />{t('Copy the address for cron-job.org')}</button>
      </p>
      {#if cron.done}<p class="ps-ok" role="status"><Check size={16} aria-hidden="true" />{t('Address copied. In cron-job.org, paste it as the URL.')}</p>{/if}
      {#if cron.shown}
        <label class="ps-txt" for="ps-cron-url">{t('Copying did not work. Select the address and copy it:')}</label>
        <input id="ps-cron-url" class="inp ps-url" type="text" readonly value={cron.shown} onfocus={(e) => e.currentTarget.select()} />
      {/if}
      {#if cron.msg}<p class="ps-msg" role="alert">{cron.msg}</p>{/if}
      <p class="ps-txt ps-small">{t('Keep the address to yourself: with it, anyone can wake the server.')}</p>
    </div>
  </section>

  <p class="ps-note"><Info size={16} aria-hidden="true" /><span>{t('The reminders come through our free server, on the minute. It only gets the words of the reminders you switched on and forgets them once they are sent.')}</span></p>
</div>

<style>
  .ps-card,
  .ps-list {
    margin: 0;
    padding: 4px 16px;
    list-style: none;
  }
  .ps-sec {
    margin-top: 20px;
  }
  .ps-sec h2 {
    margin: 0 0 8px;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .ps-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .ps-row:first-child {
    border-top: 0;
  }
  .ps-ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--hi);
  }
  .ps-m {
    flex: 1;
    min-width: 0;
  }
  .ps-m b {
    display: block;
    font-weight: 500;
  }
  .ps-m small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* a 44 px tap target; the track and the knob are drawn inside it */
  .ps-sw {
    flex: none;
    position: relative;
    width: 52px;
    height: 44px;
    margin: 0;
    border: 0;
    background: none;
    appearance: none;
    cursor: pointer;
  }
  .ps-sw::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 2px;
    width: 48px;
    height: 28px;
    border-radius: 14px;
    background: var(--line);
    transition: background 0.15s;
  }
  .ps-sw::after {
    content: '';
    position: absolute;
    top: 11px;
    left: 5px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 3px var(--shadow);
    transition: transform 0.15s;
  }
  .ps-sw:checked::before {
    background: var(--hi);
  }
  .ps-sw:checked::after {
    transform: translateX(20px);
  }
  .ps-sw:disabled {
    opacity: 0.6;
  }
  .ps-sw:focus-visible {
    outline: 2px solid var(--hi);
    outline-offset: 2px;
    border-radius: 16px;
  }
  .ps-msg {
    margin: 0 0 10px;
    color: var(--warn, var(--ink));
    font-size: var(--fs-small);
  }
  .ps-acts {
    margin: 16px 0 0;
  }
  .ps-acts :global(.btn) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .ps-txt {
    margin: 12px 0 0;
    color: var(--ink);
  }
  .ps-small {
    margin-bottom: 12px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ps-cron-acts {
    margin-top: 12px;
  }
  .ps-ok {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 0;
    color: var(--ok, var(--ink));
    font-size: var(--fs-small);
  }
  .ps-url {
    width: 100%;
    margin-top: 6px;
  }
  .ps-note {
    display: flex;
    gap: 8px;
    margin: 16px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ps-note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
