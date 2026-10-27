<script>
  /**
   * Live Navigation PR 3 (Noah 26.10.2026): «Filter» for «Places». Every filter is off at the start;
   * one tap switches it on or off, «All filters off» resets them. The rules are in poifilter.js.
   * Filters that need the route (only ahead, detour, climb, last chance, sort by detour) show only
   * when there is one. «Saved filters» keeps the switched-on set under your name: tap to use it again,
   * rename, sort (arrows and drag), delete (with Undo).
   *
   * Props: filter (normFilter), presets ([{ id, name, filter }]), hasRoute, hasProfile, shown (places
   * left), total (places found).
   */
  import { SlidersHorizontal, ChevronDown, X, Save, RotateCcw } from '@lucide/svelte';
  import { t, tn, num } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { savePrefs } from './poiprefs.js';
  import { FEATS, DETOURS, CLIMBS, SPEED, NO_FILTER, LAST_GAP_KM, normFilter, filterCount, putPreset, renamePreset, removePreset, movePreset } from './poifilter.js';

  let { filter = NO_FILTER, presets = [], hasRoute = false, hasProfile = false, shown = 0, total = 0 } = $props();

  let open = $state(false);
  let name = $state('');
  let speedText = $state('');
  const f = $derived(normFilter(filter));
  const n = $derived(filterCount(f));
  const hid = `pf-${Math.random().toString(36).slice(2, 8)}`;

  const set = (patch) => savePrefs((v) => ({ ...v, filter: normFilter({ ...v.filter, ...patch }) })).catch(() => {});
  const flip = (key) => set({ [key]: !f[key] });
  const flipFeat = (k) => set({ feats: f.feats.includes(k) ? f.feats.filter((x) => x !== k) : [...f.feats, k] });
  const reset = () => savePrefs((v) => ({ ...v, filter: { ...NO_FILTER } })).catch(() => {});
  function setSpeed() {
    const s = Number(String(speedText).replace(',', '.'));
    if (Number.isFinite(s) && s >= SPEED.min && s <= SPEED.max) set({ speed: s });
    speedText = '';
  }

  const usePreset = (p) => savePrefs((v) => ({ ...v, filter: normFilter(p.filter) })).catch(() => {});
  function savePreset() {
    const s = name.trim();
    if (!s) return;
    savePrefs((v) => ({ ...v, presets: putPreset(v.presets, s, v.filter) })).catch(() => {});
    name = '';
  }
  const renameP = (p, s) => savePrefs((v) => ({ ...v, presets: renamePreset(v.presets, p.id, s) })).catch(() => {});
  const moveP = (a, b) => savePrefs((v) => ({ ...v, presets: movePreset(v.presets, a, b) })).catch(() => {});
  async function removeP(p) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: p.name }), text: t('Only the saved filter goes. The places stay.|poi') });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: () => savePrefs((v) => ({ ...v, presets: removePreset(v.presets, p.id) })),
      undo: (before) => savePrefs((v) => ({ ...v, presets: before.presets })),
      text: t('«{name}» deleted.', { name: p.name }),
      name: p.name,
    });
  }

  const opens = $derived([
    { key: 'any', name: t('Any time|poi') },
    { key: 'now', name: t('Open now|poi') },
    { key: 'arrive', name: t('Open when I get there|poi') },
  ]);
  const detours = $derived([{ key: '', name: t('Any|poi') }, ...DETOURS.map((k) => ({ key: String(k), name: t('up to {km} km|poi', { km: num(k) }) }))]);
  const climbs = $derived([{ key: '', name: t('Any|poi') }, ...CLIMBS.map((k) => ({ key: String(k), name: t('up to {m} m|poi', { m: num(k) }) }))]);
  const sorts = $derived([
    { key: 'dist', name: t('Nearest|poi') },
    { key: 'arrive', name: t('Arrival|poi') },
    ...(hasRoute ? [{ key: 'detour', name: t('Smallest detour|poi') }] : []),
  ]);
</script>

<div class="pf" data-poi-filter>
  <button type="button" class="pf-toggle" aria-expanded={open} aria-controls={hid} onclick={() => (open = !open)} data-poi-filter-toggle>
    <SlidersHorizontal size={16} aria-hidden="true" />
    <span>{t('Filter|poi')}{#if n}{' '}<span class="pf-n num" data-poi-filter-n>{num(n)}</span>{/if}</span>
    {#if n && total}<span class="pf-left">{t('{a} of {b} places|poi', { a: num(shown), b: num(total) })}</span>{/if}
    <ChevronDown size={18} aria-hidden="true" class={open ? 'pf-up' : ''} />
  </button>

  {#if open}
    <div class="pf-box" id={hid} data-poi-filter-box>
      <p class="pf-hint">{t('Every filter is a suggestion. Tap to switch it on, tap again to switch it off. The places without a match only hide; nothing is deleted.|poi')}</p>

      <h4 class="pf-sub">{t('Open|poi')}</h4>
      <Seg options={opens} value={f.open} onchange={(k) => set({ open: k })} label={t('Open|poi')} full={false} small />
      {#if f.open !== 'any'}
        <div class="pf-wrap">
          <button type="button" class="pf-chip" aria-pressed={!f.unknown} onclick={() => set({ unknown: !f.unknown })} data-poi-f-unknown>{t('Hide places without opening hours|poi')}</button>
        </div>
        <p class="pf-hint">{t('Sundays and public holidays count: on a holiday most shops keep their Sunday hours.|poi')}</p>
      {/if}
      <div class="pf-wrap">
        <button type="button" class="pf-chip" aria-pressed={f.dark} onclick={() => flip('dark')} data-poi-f-dark>{t('Reachable before dark|poi')}</button>
      </div>
      {#if f.open === 'arrive' || f.dark || f.sort === 'arrive'}
        <label class="pf-speed">
          <span>{t('My speed|poi')}</span>
          <input class="inp pf-sp" type="text" inputmode="decimal" bind:value={speedText} onchange={setSpeed} placeholder={String(f.speed)} aria-label={t('My speed in km/h, {min} to {max}|poi', { min: SPEED.min, max: SPEED.max })} data-poi-f-speed />
          <span>km/h</span>
        </label>
        <p class="pf-hint">{t('The arrival is a guess: the km to the place at {kmh} km/h, without breaks.|poi', { kmh: num(f.speed) })}</p>
      {/if}

      {#if hasRoute}
        <h4 class="pf-sub">{t('Along the route|poi')}</h4>
        <div class="pf-wrap">
          <button type="button" class="pf-chip" aria-pressed={f.ahead} onclick={() => flip('ahead')} data-poi-f-ahead>{t('Only ahead of me|poi')}</button>
          <button type="button" class="pf-chip" aria-pressed={f.last} onclick={() => flip('last')} data-poi-f-last>{t('Last chance|poi')}</button>
        </div>
        <p class="pf-hint">{t('«Last chance»: after this place the same kind does not come again for {km} km.|poi', { km: num(LAST_GAP_KM) })}</p>
        <span class="pf-lab" id="{hid}-det">{t('Detour, there and back|poi')}</span>
        <Seg options={detours} value={f.detourKm == null ? '' : String(f.detourKm)} onchange={(k) => set({ detourKm: k ? Number(k) : null })} labelledby="{hid}-det" full={false} small />
        {#if hasProfile}
          <span class="pf-lab" id="{hid}-cl">{t('Climb to get there|poi')}</span>
          <Seg options={climbs} value={f.climbM == null ? '' : String(f.climbM)} onchange={(k) => set({ climbM: k ? Number(k) : null })} labelledby="{hid}-cl" full={false} small />
        {/if}
      {/if}

      <h4 class="pf-sub">{t('What the place has|poi')}</h4>
      <div class="pf-wrap" role="group" aria-label={t('What the place has|poi')}>
        {#each FEATS as x (x.key)}
          <button type="button" class="pf-chip" aria-pressed={f.feats.includes(x.key)} onclick={() => flipFeat(x.key)} data-poi-f-feat={x.key}>{t(x.name)}</button>
        {/each}
      </div>
      <p class="pf-hint">{t('From OpenStreetMap. A place that does not say it there hides, even if it has it.|poi')}</p>
      <div class="pf-wrap">
        <button type="button" class="pf-chip" aria-pressed={f.big} onclick={() => flip('big')} data-poi-f-big>{t('Only bigger shops|poi')}</button>
        <button type="button" class="pf-chip" aria-pressed={f.refill} onclick={() => flip('refill')} data-poi-f-refill>{t('Refill water without shopping|poi')}</button>
        <button type="button" class="pf-chip" aria-pressed={f.rain} onclick={() => flip('rain')} data-poi-f-rain>{t('Rain: places with a roof first|poi')}</button>
      </div>

      <h4 class="pf-sub">{t('Mine|poi')}</h4>
      <div class="pf-wrap">
        <button type="button" class="pf-chip" aria-pressed={f.starred} onclick={() => flip('starred')} data-poi-f-starred>{t('Only saved places|poi')}</button>
        <button type="button" class="pf-chip" aria-pressed={f.hideVisited} onclick={() => flip('hideVisited')} data-poi-f-visited>{t('Hide places I was at|poi')}</button>
      </div>
      <p class="pf-hint">{t('Mark a place with «I was here» in its details.|poi')}</p>

      <h4 class="pf-sub">{t('Sort|poi')}</h4>
      <Seg options={sorts} value={f.sort} onchange={(k) => set({ sort: k })} label={t('Sort|poi')} full={false} small />

      <h4 class="pf-sub">{t('Saved filters|poi')}</h4>
      {#if presets.length}
        <ul class="pf-list" use:sortable={{ onmove: (a, b) => moveP(a, b) }} data-poi-presets>
          {#each presets as p, i (p.id)}
            <li class="pf-row" data-sort-id={p.id} data-poi-preset={p.id}>
              <SortGrip name={p.name} onstep={(d) => moveP(i, i + d)} />
              <button type="button" class="pf-use" onclick={() => usePreset(p)} data-poi-preset-use>{t('Use|poi')}</button>
              <input class="inp pf-inp" value={p.name} maxlength="40" aria-label={t('Name of the saved filter «{name}»|poi', { name: p.name })} onchange={(e) => renameP(p, e.currentTarget.value)} data-poi-preset-name />
              <SortArrows name={p.name} {i} n={presets.length} onstep={(d) => moveP(i, i + d)} />
              <button type="button" class="pf-x" aria-label={t('Delete «{name}»?', { name: p.name })} onclick={() => removeP(p)} data-poi-preset-remove><X size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="pf-hint">{t('Switch filters on, give them a name and save them. Later one tap uses them again.|poi')}</p>
      {/if}
      <div class="pf-save">
        <input class="inp" bind:value={name} maxlength="40" placeholder={t('e.g. Evening shopping|poi')} aria-label={t('Name for the filters|poi')} onkeydown={(e) => e.key === 'Enter' && savePreset()} data-poi-preset-new />
        <button type="button" class="pf-btn" onclick={savePreset} disabled={!name.trim() || !n} data-poi-preset-save><Save size={16} aria-hidden="true" />{t('Save filters|poi')}</button>
      </div>

      {#if n}
        <button type="button" class="pf-btn pf-reset" onclick={reset} data-poi-filter-reset><RotateCcw size={16} aria-hidden="true" />{tn(n, 'Switch {n} filter off', 'Switch all {n} filters off', {})}</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pf {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  .pf-toggle {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .pf-toggle > span:first-of-type {
    flex: none;
  }
  .pf-left {
    flex: 1;
    min-width: 0;
    color: var(--ink-2);
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pf-toggle :global(svg:last-child) {
    margin-left: auto;
    transition: transform 0.15s;
  }
  .pf-toggle :global(.pf-up) {
    transform: rotate(180deg);
  }
  .pf-n {
    display: inline-grid;
    place-items: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--brand);
    color: var(--brand-ink);
    font-size: var(--fs-small);
  }
  .pf-box {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    min-width: 0;
  }
  .pf-sub {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .pf-lab {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pf-hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
    line-height: 1.4;
  }
  .pf-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .pf-chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .pf-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .pf-speed {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: var(--fs-small);
  }
  .pf-sp {
    width: 64px;
  }
  .pf-list {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pf-row {
    display: flex;
    align-items: center;
    gap: var(--sp-1);
    min-width: 0;
  }
  .pf-inp {
    flex: 1;
    min-width: 0;
  }
  .pf-use,
  .pf-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-1);
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--brand);
    border-radius: var(--r-ctl);
    background: var(--brand);
    color: var(--brand-ink);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .pf-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .pf-reset {
    justify-self: start;
    background: var(--paper);
    color: var(--ink);
    border-color: var(--line-strong);
  }
  .pf-x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .pf-save {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .pf-save .inp {
    flex: 1 1 160px;
    min-width: 0;
  }
</style>
