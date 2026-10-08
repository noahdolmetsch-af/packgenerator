<script>
  /**
   * The home place (setting "homePlace", answer 1a): entered once with the place search of the trip
   * weather; then the weekend ride weather shows on Today. v0.30.0: its own file, used by the tip
   * "Weather at your home place" on Today and in the overview.
   */
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { searchPlace } from '../weather.js';
  import { homeForecast } from '../home-weather.js';
  import { t } from '../i18n.svelte.js';

  let { onchosen = () => {} } = $props();

  let q = $state('');
  let found = $state([]);
  let searching = $state(false);
  let placeMsg = $state('');
  async function search(event) {
    event.preventDefault();
    searching = true;
    placeMsg = '';
    try {
      found = await searchPlace(q);
      if (!found.length) placeMsg = t('No place found. Try another spelling.');
    } catch {
      placeMsg = t('No connection. Place search needs the internet.');
    } finally {
      searching = false;
    }
  }
  async function choose(p) {
    const homePlace = { name: p.detail ? `${p.name}, ${p.detail}` : p.name, lat: p.lat, lon: p.lon };
    found = [];
    q = '';
    await db.settings.put({ key: HOME_PLACE, value: homePlace });
    onchosen(homePlace);
    await homeForecast(db);
  }
</script>

<form class="find" onsubmit={search}>
  <input class="inp" bind:value={q} placeholder={t('Home place, e.g. Aarau')} aria-label={t('Your home place')} />
  <button type="submit" class="btn sm" disabled={searching || q.trim().length < 2}>{t('Find')}</button>
</form>
{#if found.length}
  <ul class="found">
    {#each found as p (`${p.lat},${p.lon}`)}<li><button type="button" class="link" onclick={() => choose(p)}>{p.name}</button> <small>{p.detail}</small></li>{/each}
  </ul>
{/if}
{#if placeMsg}<p class="warn" role="alert">{placeMsg}</p>{/if}

<style>
  .find {
    display: flex;
    gap: 6px;
    align-items: center;
    width: 100%;
  }
  .find .inp {
    flex: 1;
    min-width: 0;
  }
  .find .btn {
    min-height: 44px;
  }
  .found {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .found li {
    min-height: 44px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0 6px;
  }
  .found small {
    color: var(--ink-3);
  }
  .link {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: underline;
    cursor: pointer;
  }
  .warn {
    margin: 0;
    font-size: 14px;
    color: var(--ink);
  }
</style>
