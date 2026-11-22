<script>
  /**
   * «Temperaturen nach Höhe» on the weather page (Noah 05.11.2026 «1b 2a und c 3a …», thread «Temperaturen nach Höhe
   * anzeigen»): the air temperature at 1000, 2000 and 3000 m above sea level, next to the lake. Now, 6, 12 and 18 h today
   * and the next two days as low–high. Over the place of the page, or over any places and peaks you pick (Sedrun,
   * Davos, Ascona …, a Swiss peak of about 1000, 2000 or 3000 m: then the temperature AT its summit), or a place of your
   * own (add, rename, delete with Undo). The numbers come from the shared air layers (profil.js), no own request;
   * offline the kept ones show with their time. It is a guess for planning and the card says so.
   * wetter-seite mounts it with one line.
   *
   * Props: place (the place of the page), now.
   */
  import { liveQuery } from 'dexie';
  import { Mountain, Pencil, Trash2, Search, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { REFRESHED } from '../home/refresh.js';
  import { loadProfil } from './profil.js';
  import { HEIGHTS, SPOTS, PEAKS, SEL_KEY, OWN_KEY, HOME_KEY, selOf, ownOf, itemOf, toggleSel, newOwnId, rowsOf, hasValue, zeroLine } from './hoehe.js';
  import { searchPlace } from '../weather.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { t, num, locale } from '../i18n.svelte.js';

  let { place = null, now = Date.now() } = $props();

  const selQ = liveQuery(() => db.settings.get(SEL_KEY));
  const ownQ = liveQuery(() => db.settings.get(OWN_KEY));
  const sel = $derived(selOf($selQ?.value));
  const own = $derived(ownOf($ownQ?.value));
  const items = $derived(sel.map((id) => itemOf(id, { page: place, own })).filter(Boolean));
  const saveSel = (list) => db.settings.put({ key: SEL_KEY, value: list });
  const homeQ = liveQuery(() => db.settings.get(HOME_KEY));
  const onHome = $derived($homeQ?.value !== false);
  const toggleHome = (e) => db.settings.put({ key: HOME_KEY, value: e.currentTarget.checked });
  const saveOwn = (list) => db.settings.put({ key: OWN_KEY, value: list });

  // the air layers of every shown item, by id (one request each, kept 3 h by profil.js)
  let profs = $state({});
  const keyOf = (it) => `${it.lat.toFixed(2)},${it.lon.toFixed(2)}`;
  let asked = {};
  function read(it, force = false) {
    const k = keyOf(it);
    return loadProfil(db, it, { force })
      .then((p) => (profs[it.id] = p ?? null))
      .catch(() => (profs[it.id] = null))
      .finally(() => (asked[it.id] = k));
  }
  $effect(() => {
    for (const it of items) if (asked[it.id] !== keyOf(it)) read(it);
  });
  $effect(() => {
    const again = () => items.forEach((it) => read(it, false));
    globalThis.addEventListener(REFRESHED, again);
    return () => globalThis.removeEventListener(REFRESHED, again);
  });

  const heightsOf = (it) => (it.kind === 'peak' ? [it.z] : HEIGHTS);
  const rowsFor = (it) => (profs[it.id] ? rowsOf(profs[it.id], heightsOf(it), now) : null);
  const deg = (v) => (v == null ? '–' : `${v < 0 && Math.round(Math.abs(v)) > 0 ? '−' : ''}${num(Math.round(Math.abs(v)))}°`); // half a degree rounds away from zero on both sides
  const range = (d) => (d.min == null || d.max == null ? '–' : deg(d.min) === deg(d.max) ? deg(d.min) : `${deg(d.min)} … ${deg(d.max)}`);
  const dayName = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });
  const at = (p) => (p?.old && p.at ? new Date(p.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');
  const groups = [1000, 2000, 3000];

  // choosing, own places
  const isOn = (id) => sel.includes(id);
  const toggle = (id) => saveSel(toggleSel(sel, id));
  let q = $state('');
  let found = $state([]);
  let msg = $state('');
  async function find(e) {
    e.preventDefault();
    msg = '';
    try {
      found = await searchPlace(q);
      if (!found.length) msg = t('No place found.');
    } catch (err) {
      found = [];
      msg = err?.outage ? err.message : t('The place search did not answer. Try again later.');
    }
  }
  async function addOwn(p) {
    const id = newOwnId(own);
    await saveOwn([...own, { id, name: p.name, lat: p.lat, lon: p.lon }]);
    await saveSel([...sel, `own:${id}`]);
    q = '';
    found = [];
  }
  let renaming = $state(null);
  async function del(o) {
    const ok = await askDelete({ title: t('Delete «{name}»?', { name: o.name }), text: t('Only the entry goes; the place itself stays where it is.') });
    if (ok !== 'delete') return;
    const beforeOwn = own;
    const beforeSel = sel;
    await deleteWithUndo({
      run: async () => {
        await saveOwn(own.filter((x) => x.id !== o.id));
        await saveSel(sel.filter((x) => x !== `own:${o.id}`));
      },
      undo: async () => {
        await saveOwn(beforeOwn);
        await saveSel(beforeSel);
      },
      text: t('«{name}» deleted.', { name: o.name }),
      name: o.name,
    });
  }
  const dayCols = $derived((() => {
    const first = Object.values(profs).find((p) => p?.hours?.length);
    return first ? rowsOf(first, [1000], now)[0].days.map((d) => dayName(d.date)) : [];
  })());
</script>

<section class="hh" aria-labelledby="hh-h" data-hoehe>
  <h3 id="hh-h" class="hh-h"><Mountain size={18} aria-hidden="true" />{t('Temperatures by height')}</h3>

  {#each items as it (it.id)}
    {@const rows = rowsFor(it)}
    {@const p = profs[it.id]}
    <article class="hh-item" data-hoehe-item={it.id}>
      <p class="hh-name"><b>{it.kind === 'page' ? (it.name ? t('Over {name}', { name: it.name }) : t('Over your place')) : it.kind === 'peak' ? `${it.name}, ${num(it.z)} m` : t('Over {name}', { name: it.name })}</b>{#if at(p)}<small> · {t('As of {at}', { at: at(p) })}</small>{/if}</p>
      {#if rows && hasValue(rows)}
        <div class="hh-wrap">
          <table class="hh-tab" data-hoehe-table>
            <thead>
              <tr>
                <th scope="col"><span class="sr">{t('Height')}</span></th>
                <th scope="col">{t('Now')}</th>
                <th scope="col">{t('{h} h', { h: 6 })}</th>
                <th scope="col">{t('{h} h', { h: 12 })}</th>
                <th scope="col">{t('{h} h', { h: 18 })}</th>
              </tr>
            </thead>
            <tbody>
              {#each rows as r (r.z)}
                <tr data-hoehe-row={r.z}>
                  <th scope="row">{num(r.z)} m</th>
                  <td class="hh-now" data-hoehe-now>{deg(r.now)}</td>
                  {#each r.slots as s (s.hour)}<td>{deg(s.t)}</td>{/each}
                </tr>
              {/each}
            </tbody>
          </table>
          <!-- the next days as low to high (a second table: on a phone one wide table would be cut off) -->
          <table class="hh-tab hh-days" data-hoehe-days>
            <thead>
              <tr>
                <th scope="col"><span class="sr">{t('Height')}</span></th>
                {#each dayCols as d (d)}<th scope="col">{d}</th>{/each}
              </tr>
            </thead>
            <tbody>
              {#each rows as r (r.z)}
                <tr>
                  <th scope="row">{num(r.z)} m</th>
                  {#each r.days as d (d.date)}<td class="hh-day">{range(d)}</td>{/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if zeroLine(p, now) != null}<p class="hh-note" data-hoehe-zero>{t('0 °C line in the air now: about {m} m', { m: num(zeroLine(p, now)) })}</p>{/if}
      {:else if rows}
        <p class="hh-note" data-hoehe-none>{it.kind === 'peak' ? t('No value for this height now (it lies above or below the air layers of the weather model).') : t('No value for these heights over this place (it lies at {m} m, or higher than the air layers reach).', { m: num(Math.round(p?.elev ?? 0)) })}</p>
      {:else}
        <p class="hh-note" data-hoehe-wait>{typeof navigator !== 'undefined' && navigator.onLine === false ? t('Offline: no air layers kept for this place yet.') : t('Looking up the air layers …')}</p>
      {/if}
    </article>
  {:else}
    <p class="hh-note" data-hoehe-empty>{t('Choose a place or a peak below to see the temperature by height.')}</p>
  {/each}

  <p class="hh-note">{t('The temperature of the free air at that height, from the air layers of the weather model (Open-Meteo). On a slope in the sun it can differ by a few degrees. A guess for planning.')}</p>

  <details class="hh-set" data-hoehe-set>
    <summary>{t('Choose places and peaks')}</summary>
    <label class="hh-check"><input type="checkbox" checked={onHome} onchange={toggleHome} data-hoehe-home />{t('Show the temperatures by height on Today')}</label>
    <div class="hh-chips" role="group" aria-label={t('Places')}>
      <button type="button" class="hh-chip" aria-pressed={isOn('page')} onclick={() => toggle('page')} data-hoehe-pick="page">{place?.name ? place.name : t('This place')}</button>
      {#each SPOTS as s (s.id)}<button type="button" class="hh-chip" aria-pressed={isOn(s.id)} onclick={() => toggle(s.id)} data-hoehe-pick={s.id}>{s.name}</button>{/each}
      {#each own as o (o.id)}<button type="button" class="hh-chip" aria-pressed={isOn(`own:${o.id}`)} onclick={() => toggle(`own:${o.id}`)} data-hoehe-pick={`own:${o.id}`}>{o.name}</button>{/each}
    </div>

    {#each groups as g (g)}
      <p class="hh-grp">{t('Peaks of about {m} m', { m: num(g) })}</p>
      <div class="hh-chips" role="group" aria-label={t('Peaks of about {m} m', { m: num(g) })}>
        {#each PEAKS.filter((p) => (g === 1000 ? p.z < 1500 : g === 2000 ? p.z >= 1500 && p.z < 2750 : p.z >= 2750)) as p (p.id)}
          <button type="button" class="hh-chip" aria-pressed={isOn(`peak:${p.id}`)} onclick={() => toggle(`peak:${p.id}`)} data-hoehe-pick={`peak:${p.id}`}>{p.name} <small>{num(p.z)} m</small></button>
        {/each}
      </div>
    {/each}

    <p class="hh-grp">{t('Your own places')}</p>
    {#if own.length}
      <ul class="hh-own">
        {#each own as o (o.id)}
          <li data-hoehe-own={o.id}><span>{o.name}</span>
            <button type="button" class="btn sm" onclick={() => (renaming = o)} data-hoehe-rename><Pencil size={16} aria-hidden="true" />{t('Rename')}</button>
            <button type="button" class="btn sm" onclick={() => del(o)} data-hoehe-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
          </li>
        {/each}
      </ul>
    {/if}
    <form class="hh-find" onsubmit={find}>
      <label for="hh-q">{t('Add a place of your own')}</label>
      <div class="hh-row">
        <input id="hh-q" class="inp" bind:value={q} placeholder={t('e.g. Splügen')} data-hoehe-q />
        <button type="submit" class="btn sm"><Search size={16} aria-hidden="true" />{t('Search')}</button>
      </div>
    </form>
    {#if msg}<small class="rc-warn" role="status">{msg}</small>{/if}
    {#if found.length}
      <ul class="hh-found" data-hoehe-found>
        {#each found as f (f.lat + ',' + f.lon)}
          <li><button type="button" class="btn sm" onclick={() => addOwn(f)} data-hoehe-add>{f.name}{#if f.detail}<small> · {f.detail}</small>{/if}</button></li>
        {/each}
      </ul>
      <button type="button" class="btn sm" onclick={() => (found = [])}><X size={16} aria-hidden="true" />{t('Close')}</button>
    {/if}
    <p class="hh-note">{t('Everything here is a suggestion: pick as many as you like, take them away again, add your own.')}</p>
  </details>
</section>

{#if renaming}
  {@const o = renaming}
  <RenameSheet kicker={t('Place|hoehe')} title={t('Rename place|zone')} value={o.name} empty={t('A name is needed.')} onsave={async (n) => {
    const name = (n ?? '').trim();
    if (!name) return t('A name is needed.');
    await saveOwn(own.map((x) => (x.id === o.id ? { ...x, name } : x)));
  }} onclose={() => (renaming = null)} />
{/if}

<style>
  .hh {
    display: grid;
    gap: 8px;
    margin: 12px 0 0;
  }
  .hh-h {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .hh-item {
    display: grid;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--paper-2);
  }
  .hh-name {
    margin: 0;
  }
  .hh-name small,
  .hh-note {
    color: var(--ink-2);
  }
  .hh-note {
    margin: 0;
    font-size: var(--fs-small);
  }
  .hh-wrap {
    display: grid;
    gap: 8px;
  }
  .hh-tab {
    width: 100%;
    max-width: 34em;
    border-collapse: collapse;
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
  .hh-tab th,
  .hh-tab td {
    padding: 4px 4px;
    white-space: nowrap;
  }
  .hh-tab thead th {
    color: var(--ink-2);
    font-weight: 500;
  }
  .hh-tab tbody th {
    text-align: left;
    font-weight: 600;
  }
  .hh-now {
    font-weight: 700;
  }
  .hh-days td {
    color: var(--ink-2);
  }
  .hh-set summary {
    cursor: pointer;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .hh-set > * {
    margin-top: 8px;
  }
  .hh-check {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .hh-grp {
    margin: 12px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .hh-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .hh-chip {
    min-height: 36px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .hh-chip small {
    color: var(--ink-2);
  }
  .hh-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .hh-chip[aria-pressed='true'] small {
    color: inherit;
  }
  .hh-own,
  .hh-found {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .hh-own li {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .hh-own li span {
    flex: 1 1 8em;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .hh-find {
    display: grid;
    gap: 4px;
  }
  .hh-row {
    display: flex;
    gap: 8px;
  }
  .hh-row .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
