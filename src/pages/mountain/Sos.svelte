<script>
  /**
   * Paket J #325 (Noah 19.10.2026 «3a»): the emergency page. Your position big (degrees, Swiss
   * coordinates LV95 and the height, from the phone's GPS, which also works without the internet), to
   * read out on the phone, and the calls Rega 1414 and 112. The position is asked for only when this
   * page opens and never leaves the device; «Copy» puts it on the clipboard.
   */
  import { onMount } from 'svelte';
  import { ChevronLeft, Phone, Copy, LocateFixed, QrCode, RefreshCw, Map as MapIcon } from '@lucide/svelte';
  import { CALLS, telOf, toLv95, swissNum, deg, positionText } from '../../lib/mountain/sos.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let pos = $state(null); // { lat, lon, alt, acc, at }
  let status = $state('wait'); // wait | ok | denied | none
  let copied = $state(false);
  const ch = $derived(pos ? toLv95(pos.lat, pos.lon) : null);

  // 08.11.2026 (UX-Test 4-02): «denied» and «none» are no dead end any more: «Try again» asks anew and «Open the map»
  // leads to the place name. `again` is true after a try that ended the same way, so the page says it did try.
  let watchId = null;
  let again = $state(false);
  function stop() {
    if (watchId !== null) navigator.geolocation?.clearWatch(watchId);
    watchId = null;
  }
  function start() {
    stop();
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      status = 'none';
      return;
    }
    watchId = navigator.geolocation.watchPosition(
      (p) => {
        pos = { lat: p.coords.latitude, lon: p.coords.longitude, alt: p.coords.altitude, acc: p.coords.accuracy, at: new Date(p.timestamp) };
        status = 'ok';
        again = false;
      },
      (e) => (status = e?.code === 1 ? 'denied' : pos ? 'ok' : 'none'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    );
  }
  function retry() {
    again = true;
    status = 'wait';
    start();
  }
  onMount(() => {
    start();
    return stop;
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(positionText(pos));
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      copied = false;
    }
  }
  const time = (d) => d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
</script>

<div class="sk sos">
  <p class="sk-back"><a href="#/mountain"><ChevronLeft size={16} aria-hidden="true" />{t('Mountain and emergency')}</a></p>
  <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Emergency')}</h1>

  <div class="calls">
    {#each CALLS as c (c.key)}
      <a class="btn hi call" href={telOf(c.number)} data-call={c.number}>
        <Phone size={24} aria-hidden="true" />
        <span><b>{t(c.label)}</b><small>{t(c.sub)}</small></span>
      </a>
    {/each}
  </div>

  <section class="surf sk-pad where" aria-labelledby="sos-pos" aria-live="polite" data-position={status}>
    <h2 class="sk-kicker" id="sos-pos"><LocateFixed size={16} aria-hidden="true" />{t('Your position')}</h2>
    {#if pos}
      <p class="coord num" data-wgs>{deg(pos.lat)}<br />{deg(pos.lon)}</p>
      {#if ch}<p class="coord ch num" data-lv95>{swissNum(ch.e)} / {swissNum(ch.n)}<small>{t('Swiss coordinates (LV95), Rega asks for these')}</small></p>{/if}
      <p class="sk-quiet num">{#if Number.isFinite(pos.alt)}{t('Height about {m} m', { m: num(Math.round(pos.alt)) })}{' · '}{/if}{t('accurate to {m} m', { m: num(Math.round(pos.acc ?? 0)) })} · {t('at {time}', { time: time(pos.at) })}</p>
      <button type="button" class="btn" onclick={copy} data-copy><Copy size={18} aria-hidden="true" />{copied ? t('Copied') : t('Copy position')}</button>
    {:else if status === 'denied' || status === 'none'}
      <p class="sk-quiet" role="alert">
        {#if status === 'denied'}
          {again ? t('Still switched off.') + ' ' : ''}{t('The position is switched off for this app. Tell the rescue your place name, or look it up on the map.')}
        {:else}
          {again ? t('Still nothing.') + ' ' : ''}{t('No position yet. Go to an open spot and wait a moment; the phone needs the sky, not the internet.')}
        {/if}
      </p>
      {#if status === 'denied'}<p class="sk-quiet">{t('To allow it: browser settings, «Location».')}</p>{/if}
      <div class="acts">
        <button type="button" class="btn hi" onclick={retry} data-sos-retry><RefreshCw size={18} aria-hidden="true" />{t('Try the position again')}</button>
        <a class="btn" href="#/mountain/map" data-sos-map><MapIcon size={18} aria-hidden="true" />{t('Open the map')}</a>
      </div>
    {:else}
      <p class="sk-quiet">{t('Looking for your position…')}</p>
    {/if}
  </section>

  <section class="surf sk-pad" aria-labelledby="sos-say">
    <h2 class="sk-kicker" id="sos-say">{t('On the phone, say')}</h2>
    <ol class="say">
      <li>{t('Who calls, and from which number.')}</li>
      <li>{t('Where: the position above, or the place name.')}</li>
      <li>{t('What happened, and how many are hurt.')}</li>
      <li>{t('The weather on the spot: wind, sight, a place to land.')}</li>
    </ol>
  </section>

  <p class="sk-quiet"><a href="#/mountain/qr"><QrCode size={14} aria-hidden="true" /> {t('Emergency QR for the lock screen')}</a></p>
</div>

<style>
  .sos {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .calls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .call {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 72px;
    padding: 10px 14px;
    text-align: left;
  }
  .call span {
    display: flex;
    flex-direction: column;
  }
  .call b {
    font-size: var(--fs-sub);
  }
  .call small {
    font-size: var(--fs-small);
    opacity: 0.9;
  }
  .where {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .sk-kicker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .coord {
    margin: 0;
    font-size: var(--fs-page);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: 0.01em;
  }
  .coord.ch {
    font-size: var(--fs-section);
    display: flex;
    flex-direction: column;
  }
  .coord small {
    font-size: var(--fs-small);
    font-weight: 400;
    color: var(--ink-2);
  }
  .where .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .where .acts .btn {
    justify-content: center;
    text-decoration: none;
  }
  .say {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 4px;
  }
  @media (max-width: 420px) {
    .calls {
      grid-template-columns: 1fr;
    }
  }
</style>
