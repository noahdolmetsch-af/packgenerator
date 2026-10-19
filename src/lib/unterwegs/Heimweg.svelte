<script>
  /**
   * Paket K #94 + #97 «Nach Hause» (Noah 19.10.2026 «1a und b»): the window from Unterwegs. It reads
   * the location once (only now, never stored), shows the next 3 trains to the home place
   * (transport.opendata.ch, free) and three buttons for Google Maps: car, bike, public transport.
   * Without a home place it offers to set one (the window «Dein Wohnort»).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { trainsHome, mapsHomeUrl, minText } from './heimweg.js';
  import { whereAmI } from './here.js';
  import HomePlaceSheet from '../ich/HomePlaceSheet.svelte';
  import { X, House, Train, Car, Bike, MapPin, ExternalLink, RefreshCw } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';
  import './unterwegs.css';

  let { onclose } = $props();
  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const home = $derived($homeQ?.value ?? null);

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let here = $state(null);
  let busy = $state(false);
  let msg = $state('');
  let res = $state(null);
  let setHome = $state(false);

  async function look() {
    msg = '';
    res = null;
    busy = true;
    try {
      here = await whereAmI();
      if (!here) return (msg = t('Your location is not available. Allow it in the browser, or open Maps without it below.'));
      if (navigator.onLine === false) return (msg = t('No connection. The trains need the internet; Maps opens once you are online.'));
      res = await trainsHome(here, home);
      if (res.same) msg = t('You are already at the station of your home place.');
      else if (!res.list.length) msg = t('No train found right now. Try Maps below.');
    } catch (e) {
      msg = e?.code === 'nostation' ? t('No station found near you or near home.') : t('The timetable could not be loaded. Try again later.');
    } finally {
      busy = false;
    }
  }
  // the first look runs as soon as the window is open with a home place (the button that opened it was the tap)
  let started = false;
  $effect(() => {
    if (!started && home) {
      started = true;
      look();
    }
  });
  const MODES = [
    { key: 'transit', name: 'Public transport', icon: Train },
    { key: 'driving', name: 'Car', icon: Car },
    { key: 'bicycling', name: 'Bike', icon: Bike },
  ];
</script>

<dialog class="sheet vdlg uw-dlg" bind:this={dialog} use:backClose {onclose} aria-labelledby="hw-h" data-heimweg>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="hw-h"><House size={20} aria-hidden="true" />&nbsp;{t('Home|way')}</h2>
      <p class="vd-sub">{home ? t('To {place}', { place: home.name }) : t('Set your home place first')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if !home}
    <p class="uw-p">{t('The app needs your home place to find the way home. It stays on this device.')}</p>
    <div class="vd-foot"><button type="button" class="btn hi" onclick={() => (setHome = true)}><MapPin size={16} aria-hidden="true" />{t('Set home place')}</button></div>
  {:else}
    <h3 class="uw-h3"><Train size={18} aria-hidden="true" /> {t('Next trains home')}</h3>
    {#if busy}
      <p class="uw-p tp-muted" role="status">{t('Looking for your location and the trains …')}</p>
    {:else if res?.list?.length}
      <p class="uw-p tp-small tp-muted">{t('From {from} to {to}', { from: res.from.name, to: res.to.name })}{res.from.m != null ? ` · ${t('{m} m from you', { m: res.from.m })}` : ''}</p>
      <ol class="uw-trains" data-trains>
        {#each res.list as c (c.dep)}
          <li>
            <span class="tm num"><b>{c.depTime}</b>{#if c.delay}<small class="warn">+{c.delay}</small>{/if}<span aria-hidden="true">→</span>{c.arrTime}</span>
            <span class="ln">{c.lines.join(' · ')}{#if c.platform} · {t('Platform {p}', { p: c.platform })}{/if}</span>
            <span class="tp-small tp-muted num">{minText(c.min)}{c.transfers ? ` · ${t('{n} changes', { n: c.transfers })}` : ` · ${t('direct')}`}</span>
          </li>
        {/each}
      </ol>
    {/if}
    {#if msg}<p class="uw-p" role="status">{msg}</p>{/if}
    {#if !busy}<p><button type="button" class="tp-link" onclick={look}><RefreshCw size={14} aria-hidden="true" /> {t('Look again')}</button></p>{/if}

    <h3 class="uw-h3">{t('In Google Maps')}</h3>
    <div class="uw-big3">
      {#each MODES as m (m.key)}
        <a class="btn uw-bigbtn" href={mapsHomeUrl(here, home, m.key)} target="_blank" rel="noopener noreferrer" data-maps={m.key}><m.icon size={22} aria-hidden="true" /><span>{t(m.name)}</span><ExternalLink size={14} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span></a>
      {/each}
    </div>
    <p class="uw-fine">{t('Your location is read only when you open this window. It goes only to the timetable and to Maps and is not stored.')}</p>
  {/if}
</dialog>
{#if setHome}<HomePlaceSheet current={home?.name ?? null} onclose={() => (setHome = false)} />{/if}
