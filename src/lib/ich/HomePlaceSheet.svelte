<script>
  /**
   * Design-Refresh P9 (I10, Noah 12.10.2026 «Runde 20 freigegeben»): «Dein Wohnort», the window from
   * Ich › Settings. Search the place (the place search of the trip weather), tap a hit (✓), «Save»;
   * below, what the app needs it for. Only the place is kept (setting "homePlace"), no location.
   * «Remove» forgets it again. Before P9 the same search opened inline under the row (HomePlaceForm,
   * which the tip on Today still uses).
   */
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { searchPlace } from '../weather.js';
  import { homeForecast } from '../home-weather.js';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { X, Search, MapPin, Check, Sun, Shirt, Route } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';
  import './ich.css';

  let { current = null, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  let q = $state('');
  let found = $state([]);
  let picked = $state(null);
  let searching = $state(false);
  let msg = $state('');

  async function search(event) {
    event.preventDefault();
    searching = true;
    msg = '';
    try {
      found = await searchPlace(q);
      picked = found[0] ?? null;
      if (!found.length) msg = t('No place found. Try another spelling.');
    } catch {
      msg = t('No connection. Place search needs the internet.');
    } finally {
      searching = false;
    }
  }
  const key = (p) => `${p.lat},${p.lon}`;
  async function save() {
    if (!picked) return (msg = t('Search the place and tap it first.'));
    const p = picked;
    await db.settings.put({ key: HOME_PLACE, value: { name: p.detail ? `${p.name}, ${p.detail}` : p.name, lat: p.lat, lon: p.lon } });
    dialog.close();
    await homeForecast(db, { fresh: true });
  }
  async function remove() {
    await db.settings.delete(HOME_PLACE);
    dialog.close();
  }
  const USES = [
    { icon: Sun, name: 'Weather at the weekend', note: 'Tile on Today' },
    { icon: Shirt, name: 'What should I wear?', note: 'for the coldest hour of a ride' },
    { icon: Route, name: 'Weather of a ride from home', note: 'for trips without a start place' },
  ];
</script>

<dialog class="sheet vdlg hpd" bind:this={dialog} use:backClose {onclose} aria-labelledby="hp-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="hp-h" class="title">{t('Your home place')}</h2>
      <p class="vd-sub">{t('Only for the weather · stays on this device')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if current}<p class="now"><MapPin size={16} aria-hidden="true" /> <span>{t('Now: {place}', { place: current })}</span></p>{/if}
  <form class="find" onsubmit={search}>
    <label class="fld"><span class="lbl">{t('Home place, e.g. Aarau')}</span><input class="inp" bind:value={q} autocomplete="off" /></label>
    <button type="submit" class="btn" disabled={searching || q.trim().length < 2}><Search size={16} aria-hidden="true" />{t('Find')}</button>
  </form>
  {#if found.length}
    <ul class="vd-panel hits" aria-label={t('Places found')}>
      {#each found as p (key(p))}
        <li>
          <button type="button" class="ich-row" aria-pressed={!!picked && key(picked) === key(p)} onclick={() => (picked = p)}>
            <span class="ich-ib"><MapPin size={18} aria-hidden="true" /></span>
            <span class="ich-m"><b>{p.name}</b>{#if p.detail}<small>{p.detail}</small>{/if}</span>
            {#if picked && key(picked) === key(p)}<Check class="ich-chev" size={18} aria-hidden="true" />{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  {#if msg}<p class="msg" role="alert">{msg}</p>{/if}

  <h3 class="uh">{t('What the app needs your home place for')}</h3>
  <ul class="card ich-list uses">
    {#each USES as u (u.name)}
      <li class="ich-row"><span class="ich-ib"><u.icon size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(u.name)}</b><small>{t(u.note)}</small></span></li>
    {/each}
  </ul>
  <p class="fine">{t('The search needs the internet. Only the place is saved, no location.')}</p>

  <div class="vd-foot">
    {#if current}<button type="button" class="btn" onclick={remove}>{t('Remove')}</button>{/if}
    <button type="button" class="btn hi" onclick={save} disabled={!picked}><Check size={16} aria-hidden="true" />{t('Save')}</button>
  </div>
</dialog>

<style>
  .now {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .find {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }
  .fld {
    flex: 1;
    min-width: 0;
  }
  .hits {
    margin-top: 12px;
  }
  .hits button[aria-pressed='true'] b {
    font-weight: 600;
  }
  .msg {
    margin: 10px 0 0;
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .uh {
    margin: 18px 0 8px;
    font: 500 var(--fs-body) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .uses {
    background: var(--paper);
  }
  .fine {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
