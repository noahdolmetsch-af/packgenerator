<script>
  /**
   * «Garmin-Seiten» GA-A2 (Noah 14.10.2026 «GA-A1–A3 freigegeben»): the model pages of one Garmin
   * profile of a bike, drawn for the Edge 1040 or the Edge 850 (the 850 replaced the 540, Noah 18.10.2026).
   * Profiles as chips (1a: the bike's own and «Bikepacking», own ones by «+ Profile»), each page
   * with «on the Edge», more pages below. The sensors of the bike decide the suggestion.
   * Everything is stored on the bike (bike.garmin) at the first change.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { Copy, Plus, Info, Bike as BikeIcon } from '@lucide/svelte';
  import VeloHead from './VeloHead.svelte';
  import EdgeScreen from './EdgeScreen.svelte';
  import Empty from '../ui/Empty.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { wantBike } from '../nav.js';
  import { PAGES, PAGE, KIND_LABEL, SENSORS, SENSOR_LABEL, garminOf, toStore, profileName, fieldsOf, hiddenOf, togglePage, addPage, addProfile, renameProfile, removeProfile, setSensor, copyFrom } from '../garmin.js';
  import { t, tn } from '../i18n.svelte.js';

  let { bikeId = null, profileId = null, device = $bindable('1040') } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  const g = $derived(bike ? garminOf(bike) : null);
  const prof = $derived(g ? g.profiles.find((p) => p.id === profileId) ?? g.profiles[0] : null);
  const rest = $derived(prof ? PAGES.filter((p) => !prof.pages.includes(p.id)) : []);

  async function save(next) {
    if (!next || !bike) return;
    await db.bikes.update(bike.id, { garmin: toStore(next) });
  }
  const go = (id) => (location.hash = bikesHash({ tab: 'garmin', bike: bike.id, view: id }));

  let naming = $state(null); // { id: null | profile id, name }
  async function saveName(name) {
    const n = name.trim().slice(0, 40);
    if (!n) return t('A profile needs a name.');
    if (naming.id) await save(renameProfile(g, naming.id, n));
    else {
      const id = `p-${Date.now().toString(36)}`;
      await save(addProfile(g, bike, n, id));
      go(id);
    }
  }
  async function dropProfile() {
    if (!confirm(t('Remove the Garmin profile "{name}"?', { name: prof.name }))) return;
    await save(removeProfile(g, prof.id));
    go(g.profiles[0].id);
  }
  const others = $derived(bikes.filter((b) => b.id !== bike?.id));
  async function copy(e) {
    const other = others.find((b) => b.id === e.currentTarget.value);
    e.currentTarget.value = '';
    if (other && confirm(t('Take over the Garmin pages of {bike}? The pages of this bike are replaced.', { bike: other.name }))) await save(copyFrom(other, bike));
  }
</script>

<div class="gp">
  {#if !bikes.length && $bikesQ}
    <h1 class="title">{t('Garmin pages')}</h1>
    <Empty icon={BikeIcon} title={t('No bikes yet')} text={t('Add your bike, or bring your data along with a backup.')} action={{ label: t('Add bike'), href: '#/bikes', onclick: wantBike }} />
  {:else if bike && g && prof}
    <VeloHead
      crumbs={[{ label: t('Bike'), href: bikesHash({ tab: 'setup' }) }, { label: bike.name, href: bikesHash({ tab: 'setup', bike: bike.id }) }]}
      here={t('Garmin pages')}
      title={t('Garmin pages')}
      sub={t('Model pages for this bike. Keep them here once, then set up the Edge like this.')}
    >
      {#if others.length}
        <label class="btn copy"><Copy size={16} aria-hidden="true" />{t('Take over from another bike')}
          <select aria-label={t('Take over from another bike')} onchange={copy}><option value="">{t('Take over from another bike')}</option>{#each others as b (b.id)}<option value={b.id}>{b.name}</option>{/each}</select>
        </label>
      {/if}
    </VeloHead>

    <div class="bar">
      <div class="chips" role="group" aria-label={t('Garmin profile')}>
        {#each g.profiles as p (p.id)}
          <a class="chip" aria-current={p.id === prof.id ? 'page' : undefined} href={bikesHash({ tab: 'garmin', bike: bike.id, view: p.id })}>{profileName(p, bike)} <small class="num">{p.pages.length - (p.off ?? []).length}</small></a>
        {/each}
        <button type="button" class="chip" onclick={() => (naming = { id: null, name: g.profiles.some((p) => p.name === 'Bikepacking') ? '' : 'Bikepacking' })}><Plus size={14} aria-hidden="true" />{t('Profile')}</button>
      </div>
      <span class="sp"></span>
      <div class="chips" role="group" aria-label={t('Device')}>
        <button type="button" class="chip" aria-pressed={device === '1040'} onclick={() => (device = '1040')}>Edge 1040</button>
        <button type="button" class="chip" aria-pressed={device === '850'} onclick={() => (device = '850')}>Edge 850</button>
      </div>
    </div>
    {#if !prof.own}
      <p class="pacts"><button type="button" class="link" onclick={() => (naming = { id: prof.id, name: prof.name })}>{t('Rename')}</button> · <button type="button" class="link" onclick={dropProfile}>{t('Remove profile')}</button></p>
    {/if}

    <div class="tiles">
      {#each prof.pages as id, i (id)}
        {@const p = PAGE[id]}
        {@const on = !(prof.off ?? []).includes(id)}
        {@const n = fieldsOf(id, device, g.sensors, hiddenOf(g, id, device)).length}
        <div class="tile" class:off={!on}>
          <a class="shot" href={bikesHash({ tab: 'garmin', bike: bike.id, view: prof.id, page: id })} aria-label={t('Open {page}', { page: `${id} ${t(p.name)}` })}><EdgeScreen pageId={id} {device} {g} width={150} idx={i} total={prof.pages.length} /></a>
          <div class="tt">
            <a class="nm" href={bikesHash({ tab: 'garmin', bike: bike.id, view: prof.id, page: id })}>{id} {t(p.name)}</a>
            <div class="badges"><span class="badge k-{p.kind}">{t(KIND_LABEL[p.kind])} · {n}</span>{#if p.fields.some((x) => x.ciq)}<span class="badge">Connect IQ</span>{/if}</div>
            <button type="button" class="tgl" role="switch" aria-checked={on} onclick={() => save(togglePage(g, prof.id, id))}><span class="knob" class:no={!on}></span>{t('on the Edge')}</button>
          </div>
        </div>
      {/each}
      {#if rest.length}
        <div class="tile add">
          <Plus size={20} aria-hidden="true" /><b>{t('Add a page')}</b>
          <ul>{#each rest as p (p.id)}<li><button type="button" onclick={() => save(addPage(g, prof.id, p.id))}><span>{p.id} {t(p.name)}</span><Plus size={14} aria-hidden="true" /></button></li>{/each}</ul>
        </div>
      {/if}
    </div>

    <div class="note">
      <Info size={18} aria-hidden="true" />
      <div>
        <p>{t('A suggestion from the sensors of this bike. Every page can be switched off, swapped or replaced. The Edge 1040 and the Edge 850 show the same fields; hide a field on one of them if you like.')}</p>
        <div class="sens" role="group" aria-label={t('Sensors on this bike')}>
          {#each SENSORS as s (s)}<button type="button" class="chip sm" aria-pressed={g.sensors[s]} onclick={() => save(setSensor(g, bike, s, !g.sensors[s]))}>{t(SENSOR_LABEL[s])}</button>{/each}
        </div>
      </div>
    </div>
  {/if}
</div>

{#if naming}
  <RenameSheet
    kicker={t('Garmin profile')}
    title={naming.id ? t('Rename profile') : t('New Garmin profile')}
    value={naming.name}
    hint={t('Use the same name as the activity profile on your Edge.')}
    onsave={saveName}
    onclose={() => (naming = null)}
  />
{/if}

<style>
  .gp {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .gp :global(.vhead) {
    margin-bottom: 4px;
  }
  .copy {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .copy select {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .bar {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .sp {
    flex: 1 1 auto;
  }
  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1 var(--font-body);
    text-decoration: none;
    cursor: pointer;
  }
  .chip.sm {
    min-height: 34px;
    padding: 0 12px;
  }
  .chip[aria-current='page'],
  .chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .chip small {
    opacity: 0.7;
    font-weight: 400;
  }
  .pacts {
    margin: -8px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .link {
    border: 0;
    background: none;
    padding: 4px 0;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    padding: 14px 12px 12px;
    min-width: 0;
  }
  .tile.off .shot {
    opacity: 0.45;
  }
  .shot {
    display: block;
    max-width: 100%;
    color: inherit;
    text-decoration: none;
  }
  .tt {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .nm {
    color: var(--ink);
    font-weight: 600;
    font-size: var(--fs-small);
    text-decoration: none;
  }
  .nm:hover {
    text-decoration: underline;
  }
  .badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .badge {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
    white-space: nowrap;
  }
  .k-easy {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .k-mid {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .k-deep {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .tgl {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    border: 0;
    background: none;
    padding: 0;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-tiny);
    cursor: pointer;
  }
  .knob {
    width: 34px;
    height: 20px;
    border-radius: 10px;
    background: var(--hi);
    position: relative;
    flex: none;
  }
  .knob::after {
    content: '';
    position: absolute;
    top: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--paper);
  }
  .knob.no {
    background: var(--line-strong);
  }
  .knob.no::after {
    right: auto;
    left: 2px;
  }
  .tile.add {
    border-style: dashed;
    justify-content: center;
    color: var(--ink-2);
    min-height: 200px;
  }
  .tile.add ul {
    margin: 0;
    padding: 0;
    list-style: none;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tile.add button {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 6px 8px;
    border: 0;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
  }
  .note {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: var(--paper-2);
    border-radius: 12px;
    padding: 12px 14px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .note p {
    margin: 0 0 8px;
  }
  .note :global(svg) {
    flex: none;
  }
  .sens {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  @media (max-width: 700px) {
    .tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .tile {
      padding: 10px 8px;
    }
  }
</style>
