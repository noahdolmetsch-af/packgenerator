<script>
  /**
   * Gruppen-Live-Karte (Noah 25.10.2026 «b»): what a friend sees behind the invite link #/gruppe/<gid>/<key>,
   * in the browser, without the app's data and without signing in. The map with the route and everyone who
   * shares; «Share my location» (with a name) puts you on it while this page is open; «Stop sharing»
   * deletes your place. The group ends by itself (at most 24 h) and everything is deleted.
   * For events (Noah 26.10.2026): «I am waiting here», the stops along the route and the route as GPX.
   * Nothing of the app's own data is read; only the name and the member codes stay in this browser.
   */
  import { onMount, onDestroy, untrack } from 'svelte';
  import { Users, MapPin, Square, RefreshCw, Hand, Download } from '@lucide/svelte';
  import { t, locale } from '../lib/i18n.svelte.js';
  import Skeleton from '../lib/ui/Skeleton.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import TourMap from '../lib/spur/TourMap.svelte';
  import GroupList from '../lib/live/GroupList.svelte';
  import { parseGroupLink, readGroup, sharePlace, leaveGroup, memberRows, initials, cleanName, stillWaiting, groupGpx, gpxName, GROUP_ERRORS, GROUP_EVERY_MS } from '../lib/live/group.js';
  import GroupStops from '../lib/live/GroupStops.svelte';
  import { LinkError } from '../lib/spur/link.js';

  let { hash = '' } = $props();
  const link = parseGroupLink(untrack(() => hash)); // the page is made anew for every link ({#key hash})
  const store = link ? `pg-group:${link.gid}` : '';
  const keep = (v) => {
    try {
      if (v) localStorage.setItem(store, JSON.stringify(v));
      else localStorage.removeItem(store);
    } catch {
      /* private window: works without */
    }
  };
  const kept = (() => {
    try {
      return JSON.parse(localStorage.getItem(store) ?? 'null') ?? {};
    } catch {
      return {};
    }
  })();

  let err = $state('');
  let ended = $state(false);
  let loaded = $state(false);
  let title = $state('');
  let route = $state(null);
  let end = $state('');
  let places = $state([]);
  let name = $state(kept.name ?? '');
  let me = $state(kept.mid ? { mid: kept.mid, mdel: kept.mdel } : null);
  let sharing = $state(false);
  // «Ich warte hier» (Noah 26.10.2026): the place where you wait; ends by itself when you ride on
  let waitAt = $state(kept.wait ?? null);
  let stopDots = $state([]);
  let fix = $state(null);
  let sentAt = 0;
  let geoErr = $state('');
  let msg = $state('');
  let now = $state(Date.now());
  let watchId = null;
  let timer = null;

  function fail(e) {
    if (e instanceof LinkError && e.code === 'not_found') {
      ended = true;
      stopWatch();
      keep(null);
      return;
    }
    msg = t(GROUP_ERRORS[e?.code] ?? GROUP_ERRORS.server_error);
  }

  onMount(async () => {
    if (!link) return (err = t(GROUP_ERRORS.broken));
    try {
      const g = await readGroup(link.gid, link.key);
      title = g.title;
      route = g.route;
      end = g.end;
      places = g.places;
      loaded = true;
    } catch (e) {
      if (e instanceof LinkError && e.code === 'not_found') ended = true;
      else err = t(GROUP_ERRORS[e?.code] ?? GROUP_ERRORS.server_error);
      return;
    }
    timer = setInterval(tick, 15_000);
  });
  onDestroy(() => {
    clearInterval(timer);
    stopWatch();
  });

  let readAt = Date.now();
  async function tick() {
    now = Date.now();
    if (ended || document.visibilityState === 'hidden') return;
    if (end && Date.parse(end) <= now) return fail(new LinkError('not_found'));
    if (sharing && fix && now - sentAt >= GROUP_EVERY_MS) return send();
    if (!sharing && now - readAt >= GROUP_EVERY_MS) {
      readAt = now;
      try {
        places = (await readGroup(link.gid, link.key, { withRoute: false })).places;
        msg = '';
      } catch (e) {
        fail(e);
      }
    }
  }

  function refresh() {
    sentAt = 0;
    readAt = 0;
    tick();
  }
  async function send() {
    if (!fix) return;
    sentAt = Date.now();
    try {
      const r = await sharePlace(link, me, name, fix, { wait: !!waitAt });
      me = { mid: r.mid, mdel: r.mdel };
      keep({ name, ...me, wait: waitAt });
      places = r.places;
      msg = '';
    } catch (e) {
      fail(e);
    }
  }

  function share() {
    geoErr = '';
    name = cleanName(name);
    if (!name) return (geoErr = t('Write your name first, so the others know who you are.'));
    if (!navigator.geolocation) return (geoErr = t('This browser cannot find your location.'));
    keep({ name, ...(me ?? {}) });
    sharing = true;
    watchId = navigator.geolocation.watchPosition(
      (p) => {
        const first = !fix;
        fix = { lat: p.coords.latitude, lon: p.coords.longitude, at: p.timestamp || Date.now() };
        if (waitAt && !stillWaiting(waitAt, fix)) {
          waitAt = null;
          sentAt = 0;
        }
        if (first) send();
      },
      (e) => {
        geoErr = e?.code === 1 ? t('The location is not allowed. Allow it in the browser for this page and try again.') : t('No location found yet. Go outside and try again.');
        if (e?.code === 1) stopWatch();
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 60_000 },
    );
  }
  function stopWatch() {
    if (watchId != null) navigator.geolocation?.clearWatch(watchId);
    watchId = null;
    sharing = false;
  }
  function flipWait() {
    waitAt = waitAt ? null : fix ? { lat: fix.lat, lon: fix.lon } : null;
    sentAt = 0;
    send();
  }
  function downloadGpx() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([groupGpx(title, route)], { type: 'application/gpx+xml' }));
    a.download = gpxName(title);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  async function stopSharing() {
    stopWatch();
    fix = null;
    waitAt = null;
    try {
      await leaveGroup(link, me);
      places = places.filter((p) => p.m !== me?.mid);
      me = null;
      keep({ name });
      msg = t('You no longer share your location. Your place is deleted.');
    } catch (e) {
      fail(e);
    }
  }

  const rows = $derived(memberRows(places, route, { now, me: me?.mid ?? null }));
  const seenText = (r) => (r.ago < 1 ? t('seen just now') : t('seen {n} min ago', { n: r.ago }));
  const dots = $derived(rows.map((r) => ({ id: `m-${r.m}`, kind: 'friend', cls: [r.me ? 'me' : '', r.stale ? 'stale' : '', r.wait ? 'wait' : ''].join(' '), pos: r.pos, n: initials(r.name), text: `${r.name || t('Without a name')}, ${seenText(r)}` })));
  const lines = $derived(route ? [{ id: 'route', pts: route.line, n: 1, src: 'plan' }] : []);
  const endTime = $derived(end ? new Date(end).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' }) : '');
  let picked = $state(null);
</script>

<div class="grp-page" data-group-page>
  {#if err}
    <Empty icon={Users} title={t('Group ride not available')} text={err} />
  {:else if ended}
    <div data-group-ended><Empty icon={Users} title={t('The group ride has ended')} text={t(GROUP_ERRORS.not_found)} /></div>
  {:else if !loaded}
    <Skeleton rows={4} />
  {:else}
    <header>
      {#if title}<p class="kick">{t('Group ride')}</p>{/if}
      <h1 data-page-title tabindex="-1">{title || t('Group ride')}</h1>
      <p class="sub">{t('Ends by itself {when}. Then all places are deleted.', { when: endTime })}</p>
    </header>

    {#if lines.length || dots.length}
      <TourMap {lines} points={[...stopDots, ...dots]} height={420} label={t('Group ride')} onpick={(p) => (picked = p)} />
    {/if}
    {#if picked}<p class="card pick">{picked.text} <button type="button" class="tp-link" onclick={() => (picked = null)}>{t('Close')}</button></p>{/if}

    <section class="card grp-box" aria-labelledby="grp-me-h">
      <h2 id="grp-me-h">{t('Your location')}</h2>
      {#if sharing}
        <p class="live" role="status" data-group-sharing><span class="dot" aria-hidden="true"></span>{t('You share your location as {name}.', { name })}</p>
        <p class="tp-small tp-muted">{t('Only while this page is open and the screen is on. Every 2 minutes the others see where you are.')}</p>
        <div class="grp-acts">
          <button type="button" class="btn" class:hi={!waitAt} onclick={flipWait} disabled={!fix} aria-pressed={!!waitAt} data-group-waithere><Hand size={18} aria-hidden="true" />{waitAt ? t('I ride on') : t('I am waiting here')}</button>
          <button type="button" class="btn" onclick={stopSharing} data-group-stop><Square size={18} aria-hidden="true" />{t('Stop sharing')}</button>
        </div>
        {#if waitAt}<p class="tp-small" role="status" data-group-waiting>{t('The others see that you are waiting here. It ends by itself when you ride on.')}</p>{/if}
      {:else}
        <p class="tp-small tp-muted">{t('Nobody sees you until you tap «Share my location». You can stop at any time.')}</p>
        <label class="fld">
          <span>{t('Your name for the others')}</span>
          <input type="text" bind:value={name} maxlength="40" autocomplete="given-name" data-group-name />
        </label>
        <button type="button" class="btn hi" onclick={share} data-group-share><MapPin size={18} aria-hidden="true" />{t('Share my location')}</button>
      {/if}
      {#if geoErr}<p class="rc-warn" role="alert">{geoErr}</p>{/if}
      {#if msg}<p class="tp-small" role="status" data-group-msg>{msg}</p>{/if}
    </section>

    {#if route}
      <GroupStops gid={link.gid} {route} here={fix} onpoints={(l) => (stopDots = l)} />
      <div><button type="button" class="btn sm" onclick={downloadGpx} data-group-gpx><Download size={16} aria-hidden="true" />{t('Route as GPX')}</button></div>
    {/if}

    <section class="card grp-box" aria-labelledby="grp-all-h">
      <h2 id="grp-all-h">{t('In the group')}</h2>
      <GroupList {rows} hasRoute={!!route} />
      <div><button type="button" class="btn sm" onclick={refresh} data-group-refresh><RefreshCw size={16} aria-hidden="true" />{t('Refresh')}</button></div>
    </section>
    <p class="tp-small tp-muted">{t('Names and places are locked with a key that is only in this link. The server cannot read them.')}</p>
  {/if}
</div>

<style>
  .grp-page {
    display: grid;
    gap: var(--sp-4);
    max-width: 760px;
    margin: 0 auto;
    padding: var(--sp-4) var(--sp-4) var(--sp-6);
  }
  .kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  h1 {
    margin: 0;
  }
  .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
  }
  .grp-box {
    display: grid;
    gap: var(--sp-3);
  }
  .grp-box h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .fld {
    display: grid;
    gap: var(--sp-1);
  }
  .live {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font-weight: 600;
  }
  .live .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--bad);
  }
  .pick {
    margin: 0;
  }
  .grp-acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
