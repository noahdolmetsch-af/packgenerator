<script>
  /**
   * Paket C › Teilen mit Vorschau (#/me/ruhig/teilen; 996 Ideen UC-146-I1, UC-100-I2):
   * «Vorschau wie beim Empfänger» (the very view of the link, pages/Share.svelte, with your choice of what
   * goes in; a changed choice is confirmed once) and «Ankunft ohne genauen Ort» (as much place as fits the
   * person). The region comes from OpenStreetMap's free Nominatim, one request per tap. Logic: teilen.js.
   */
  import { liveQuery } from 'dexie';
  import { Eye, MapPin, Send, Copy, Plus, Trash2 } from '@lucide/svelte';
  import Card from './Card.svelte';
  import Share from '../../pages/Share.svelte';
  import { db } from '../db.js';
  import { tripStats } from '../trips.js';
  import { sharePayload, encodeShare, SHARE_LONG } from '../share.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { settingQ, saveSetting } from './store.js';
  import { openFromHash } from './open.js';
  import { dmy, realTrips, tripEnd } from './base.js';
  import { SCOPE_STD, scoped, scopeLines, sameScope, PLACE_KEY, LEVELS, arriveOf, addPerson, setPerson, dropPerson, regionOf, arriveMessage } from './teilen.js';

  const today = localDay();
  const first = openFromHash();
  let open = $state({ preview: first === 'preview' || !first, arrive: first === 'arrive' });

  /* Vorschau wie beim Empfänger */
  const dataQ = liveQuery(async () => {
    const [trips, items, containers, bikes] = await Promise.all([db.trips.toArray(), db.items.toArray(), db.containers.toArray(), db.bikes.toArray()]);
    return { trips, items, containers, bikes };
  });
  const trips = $derived(realTrips($dataQ?.trips ?? []).filter((x) => (x.entries ?? []).length).sort((a, b) => (tripEnd(b) >= today) - (tripEnd(a) >= today) || a.startDate.localeCompare(b.startDate)));
  let tripId = $state('');
  const trip = $derived(trips.find((x) => x.id === tripId) ?? trips[0] ?? null);
  const payload = $derived.by(() => {
    if (!trip || !$dataQ) return null;
    const items = $dataQ.items;
    const bike = trip.bikeId ? $dataQ.bikes.find((b) => b.id === trip.bikeId) : null;
    try {
      const stats = tripStats(trip, items, $dataQ.containers, bike, null);
      return sharePayload(trip, stats, Object.fromEntries(items.map((i) => [i.id, i])));
    } catch {
      return null;
    }
  });
  let scope = $state({ ...SCOPE_STD });
  let confirmed = $state(null); // the scope you said yes to
  const view = $derived(payload ? scoped(payload, scope) : null);
  let code = $state('');
  $effect(() => {
    const v = view;
    if (!v) return;
    encodeShare($state.snapshot(v)).then((c) => (code = c));
  });
  const changed = $derived(!confirmed || !sameScope(confirmed, scope));
  const lines = $derived(payload ? scopeLines(payload, scope) : []);
  const base = typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}`;
  const url = $derived(code ? `${base}#/share/${code}` : '');
  async function send() {
    try {
      if (navigator.share) await navigator.share({ title: view.t, url });
      else {
        await navigator.clipboard.writeText(url);
        offerDone(t('Link copied.'));
      }
    } catch {
      /* closed */
    }
  }

  /* Ankunft ohne genauen Ort */
  const aQ = settingQ(PLACE_KEY);
  const a = $derived(arriveOf($aQ));
  const saveA = (x) => saveSetting(PLACE_KEY, x);
  let pName = $state('');
  let who = $state('');
  let level = $state('arrived');
  $effect(() => {
    const p = a.people.find((x) => x.id === who);
    if (p) level = p.level;
  });
  let here = $state(null);
  let region = $state('');
  let busy = $state(false);
  let error = $state('');
  async function locate() {
    error = '';
    busy = true;
    try {
      const pos = await new Promise((ok, fail) => navigator.geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }));
      here = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      if (level !== 'exact') {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=8&accept-language=de&lat=${here.lat.toFixed(3)}&lon=${here.lon.toFixed(3)}`);
        region = res.ok ? regionOf((await res.json())?.address) : '';
        if (!region) error = t('The region could not be found. The message says only that you arrived.');
      }
    } catch {
      error = t('Your position is not available. The message says only that you arrived.');
    }
    busy = false;
  }
  const message = $derived(arriveMessage(level, { arrived: t('I have arrived.'), near: t('Near {region}.'), region, lat: here?.lat ?? null, lon: here?.lon ?? null }));
  async function sendArrive() {
    try {
      if (navigator.share) await navigator.share({ text: message });
      else {
        await navigator.clipboard.writeText(message);
        offerDone(t('Copied.'));
      }
    } catch {
      /* closed */
    }
  }
</script>

<ul class="rh-cards">
  <Card id="preview" icon={Eye} title={t('Preview as the receiver sees it')} lead={t('Before a packing list leaves as a link: exactly what the other person can read')} bind:open={open.preview}>
    {#if trip && view}
      <select class="inp" value={trip.id} onchange={(e) => ((tripId = e.currentTarget.value), (confirmed = null))} aria-label={t('Trip')}>{#each trips as x (x.id)}<option value={x.id}>{x.title} · {dmy(x.startDate)}</option>{/each}</select>
      <label class="rh-field"><span>{t('Title the other person sees')}</span><input class="inp" bind:value={scope.title} placeholder={payload.t} /></label>
      <div class="rh-chips" aria-label={t('What goes in')}>
        <button type="button" class="rh-chip" aria-pressed={scope.date} onclick={() => (scope.date = !scope.date)} data-scope="date">{t('Date')}</button>
        <button type="button" class="rh-chip" aria-pressed={scope.bike} onclick={() => (scope.bike = !scope.bike)} data-scope="bike">{t('Bike')}</button>
        <button type="button" class="rh-chip" aria-pressed={scope.weights} onclick={() => (scope.weights = !scope.weights)} data-scope="weights">{t('Weights')}</button>
      </div>
      <p class="rh-help">{t('Without an account the other person sees only this. Nothing else of your data goes along.')}</p>
      <div class="rh-frame" data-share-preview aria-label={t('Preview')}>
        {#key code}{#if code}<Share {code} />{/if}{/key}
      </div>
      {#if changed}
        <div class="rh-note" data-scope-confirm>
          <b>{t('Check what goes along')}</b>
          <ul>{#each lines as l (l.key)}<li>{t(l.key)}: {l.v == null ? t('not shared') : l.key === 'Date' ? dmy(l.v) : l.v === 'yes' ? t('yes') : l.v}</li>{/each}</ul>
          <button type="button" class="btn sm hi" onclick={() => (confirmed = { ...scope })} data-scope-ok>{t('Yes, that is right')}</button>
        </div>
      {:else}
        <div class="rh-row">
          <button type="button" class="btn hi" onclick={send} disabled={!url} data-share-send><Send size={16} aria-hidden="true" />{t('Share the link')}</button>
          {#if url.length > SHARE_LONG}<span class="rh-help">{t('A long link: some chat apps cut it. Print / PDF in Pack works always.')}</span>{/if}
        </div>
      {/if}
    {:else}<p class="rh-empty">{t('No packing list yet. Once a trip has things on its list, its preview shows here.')}</p>{/if}
  </Card>

  <Card id="arrive" icon={MapPin} title={t('Arrival without the exact place')} lead={t('«I have arrived» with as much place as fits the person')} bind:open={open.arrive}>
    {#if a.people.length}
      <div class="rh-chips" aria-label={t('For whom')}>{#each a.people as p (p.id)}<button type="button" class="rh-chip" aria-pressed={who === p.id} onclick={() => (who = who === p.id ? '' : p.id)}>{p.name}</button>{/each}</div>
    {/if}
    <div class="rh-chips" aria-label={t('How much place')}>{#each LEVELS as l (l.key)}<button type="button" class="rh-chip" aria-pressed={level === l.key} onclick={() => ((level = l.key), (region = ''), (here = null))} data-level={l.key}>{t(l.label)}</button>{/each}</div>
    {#if level !== 'arrived'}<button type="button" class="btn sm" onclick={locate} disabled={busy}><MapPin size={14} aria-hidden="true" />{busy ? t('Looking…') : t('Where am I?')}</button>{/if}
    {#if error}<p class="rh-note">{error}</p>{/if}
    <p class="rh-note" data-arrive-msg>{message}</p>
    <div class="rh-row">
      <button type="button" class="btn hi" onclick={sendArrive}><Send size={16} aria-hidden="true" />{t('Send')}</button>
      <button type="button" class="btn" onclick={async () => { try { await navigator.clipboard.writeText(message); offerDone(t('Copied.')); } catch {} }}><Copy size={16} aria-hidden="true" />{t('Copy')}</button>
    </div>
    <p class="rh-sub">{t('People and how much they see')}</p>
    {#if a.people.length}
      <ul class="rh-list">{#each a.people as p (p.id)}<li>
        <input class="inp rh-grow" value={p.name} onchange={(e) => e.currentTarget.value.trim() && saveA(setPerson(a, p.id, { name: e.currentTarget.value.trim() }))} aria-label={t('Name')} />
        <select class="inp rh-l" value={p.level} onchange={(e) => saveA(setPerson(a, p.id, { level: e.currentTarget.value }))} aria-label={t('How much place for {name}', { name: p.name })}>{#each LEVELS as l (l.key)}<option value={l.key}>{t(l.label)}</option>{/each}</select>
        <button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => saveA(dropPerson(a, p.id))}><Trash2 size={16} /></button>
      </li>{/each}</ul>
    {/if}
    <form class="rh-row" onsubmit={(e) => (e.preventDefault(), saveA(addPerson(a, pName, level)), (pName = ''))}>
      <input class="inp" bind:value={pName} placeholder={t('e.g. Mum, the club')} aria-label={t('New person')} data-person-new />
      <button type="submit" class="btn sm" disabled={!pName.trim()}><Plus size={14} aria-hidden="true" />{t('Add')}</button>
    </form>
  </Card>
</ul>

<style>
  .rh-frame {
    padding: var(--sp-3);
    border: 2px dashed var(--line-strong);
    border-radius: var(--radius-card);
    max-height: 60vh;
    overflow: auto;
    background: var(--ground, var(--paper));
  }
  .rh-frame :global(.no-print) {
    pointer-events: none;
  }
  .rh-note ul {
    margin: 6px 0;
    padding-left: 18px;
  }
  .rh-l {
    width: auto;
    flex: none;
  }
</style>
