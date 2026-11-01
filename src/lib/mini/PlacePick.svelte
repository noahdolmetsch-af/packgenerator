<script>
  /**
   * Mini-Tools: pick a place by name (free Open-Meteo place search, lib/weather.js), or take your home place.
   * value: { name, lat, lon } | null; onpick(place | null); home: your home place or null; label: what it is for.
   */
  import { t } from '../i18n.svelte.js';
  import { searchPlace } from '../weather.js';
  import { Search, House, MapPin } from '@lucide/svelte';

  let { value = null, onpick, home = null, label, testid = 'place' } = $props();
  let q = $state('');
  let found = $state([]);
  let busy = $state(false);
  let msg = $state('');
  let open = $state(false);

  async function search(e) {
    e?.preventDefault?.();
    msg = '';
    if (q.trim().length < 2) return (msg = t('Write at least two letters.'));
    busy = true;
    try {
      found = await searchPlace(q);
      if (!found.length) msg = t('No place found. Try another spelling.');
    } catch {
      msg = t('No connection. Place search needs the internet.');
    } finally {
      busy = false;
    }
  }
  function pick(p) {
    onpick?.({ name: p.detail ? `${p.name}, ${p.detail}` : p.name, lat: p.lat, lon: p.lon });
    found = [];
    q = '';
    open = false;
  }
</script>

<div class="pp" data-pp={testid}>
  {#if value && !open}
    <div class="pp-on">
      <MapPin size={16} aria-hidden="true" />
      <span class="pp-name" data-pp-name>{value.name}</span>
      <button type="button" class="btn sm" onclick={() => (open = true)} data-pp-change>{t('Change')}</button>
    </div>
  {:else}
    <form class="pp-row" onsubmit={search} role="search">
      <input type="search" bind:value={q} placeholder={t('Place, e.g. Olten')} aria-label={label} data-pp-q />
      <button type="submit" class="btn" disabled={busy} data-pp-search><Search size={16} aria-hidden="true" />{t('Search')}</button>
    </form>
    {#if home}
      <button type="button" class="btn sm pp-home" onclick={() => pick(home)} data-pp-home><House size={16} aria-hidden="true" />{t('Home: {place}', { place: home.name })}</button>
    {/if}
    {#if found.length}
      <ul class="pp-found" data-pp-found>
        {#each found as p (`${p.lat},${p.lon}`)}
          <li><button type="button" onclick={() => pick(p)}><b>{p.name}</b>{#if p.detail}<small>{p.detail}</small>{/if}</button></li>
        {/each}
      </ul>
    {/if}
    {#if msg}<p class="pp-msg" role="status">{msg}</p>{/if}
    {#if value}<button type="button" class="btn btn-link sm" onclick={() => (open = false)}>{t('Keep {place}', { place: value.name })}</button>{/if}
  {/if}
</div>

<style>
  .pp {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
  }
  .pp-on {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
  }
  .pp-name {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
    font-weight: 600;
  }
  .pp-row {
    display: flex;
    gap: var(--sp-2);
  }
  .pp-row input {
    flex: 1;
    width: auto;
    min-width: 0;
    min-height: 44px;
  }
  .pp-row .btn,
  .pp-home {
    flex: none;
    justify-self: start;
  }
  .pp-found {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }
  .pp-found button {
    width: 100%;
    min-height: 44px;
    display: grid;
    text-align: left;
    padding: 6px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .pp-found small,
  .pp-msg {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pp-msg {
    margin: 0;
  }
</style>
