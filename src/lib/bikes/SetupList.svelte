<script>
  /**
   * Taschen-Setups TS1 (Noah 14.10.2026 «TS0–TS5 freigegeben»): the card on top of «Mein Setup» with
   * every bag setup of the bike. Per setup a small drawing, the bags, the total weight with the
   * luggage, a bar bike / empty bags / contents / water, when it was last used and how often, and
   * Öffnen · Kopieren · Umbenennen · ⋯ (Auf anderes Velo kopieren, Löschen). The setup new trips get
   * (the last used) has a green edge; «Standard» is the fallback of old trips and cannot be deleted.
   * Everything is a suggestion: a setup can be changed, copied or deleted at any time.
   */
  import { bikesHash } from '../bikes.js';
  import { setupsOf, setupCalc, usageOf, lastUsedId, copySetup, copyToBike, freeName, STD } from '../setups.js';
  import { writeSetup, deleteSetup, newSetupId } from './setupdb.js';
  import { offerRename } from '../ui/rename.svelte.js';
  import { Plus, Columns2, ChevronRight, Copy, Pencil, Bike, Trash2, Clock3 } from '@lucide/svelte';
  import RigBike from './RigBike.svelte';
  import SetupBar from './SetupBar.svelte';
  import SetupDialog from './SetupDialog.svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { t, tn, num, dateOf, bagName } from '../i18n.svelte.js';
  import { SLOT } from '../bikes.js';

  let { bike, bikes = [], trips = [], items = [], containers = [] } = $props();

  const setups = $derived(setupsOf(bike, trips));
  const used = $derived(usageOf(bike, trips));
  const lastId = $derived(lastUsedId(bike, trips));
  const calcs = $derived(setups.map((s) => setupCalc(s, bike, items, containers)));
  const others = $derived(bikes.filter((b) => b.id !== bike.id));
  const kg = (g) => num(Math.round(g / 100) / 10);
  const nm = (s) => (s.std ? t('Standard|setup') : s.name);
  const bagNames = (c) => c.list.map((b) => (b.bag ? bagName(b.bag.name) : t(SLOT[b.key]?.name ?? b.key))).join(' · ');
  function when(s) {
    const u = used[s.id];
    if (u) return [t('Last: {trip}, {date}', { trip: u.last.title, date: dateOf(u.last.startDate) }), tn(u.n, '{n} trip', '{n} trips')].join(' · ');
    return s.createdAt ? t('New since {date} · no trip yet', { date: dateOf(s.createdAt.slice(0, 10)) }) : t('No trip yet');
  }
  const compareHref = $derived(bikesHash({ tab: 'rig', view: 'compare', bike: bike.id, a: lastId, b: setups.find((s) => s.id !== lastId)?.id ?? null }));

  let dialog = $state.raw(null); // { kind, setup }
  let renaming = $state.raw(null);

  async function create({ name, from }) {
    const src = setups.find((s) => s.id === from) ?? null;
    const made = copySetup(src ?? { bags: {}, items: [] }, { id: newSetupId(), name: freeName(name, setups, t('copy')) });
    await writeSetup(bike.id, made, t('Setup «{name}» created.', { name: made.name }));
    location.hash = bikesHash({ tab: 'rig', view: 'setup', bike: bike.id, setup: made.id });
  }
  async function copy(s) {
    const made = copySetup(s, { id: newSetupId(), name: freeName(nm(s), setups, t('copy')) });
    await writeSetup(bike.id, made, t('Copied as «{name}».', { name: made.name }));
  }
  async function toBike(s, { name, bikeId }) {
    const target = others.find((b) => b.id === bikeId);
    if (!target) return;
    const made = copyToBike(s, target, { id: newSetupId(), name: freeName(name, setupsOf(target, trips), t('copy')) });
    await writeSetup(target.id, made, t('Copied to {bike} as «{name}».', { bike: target.name, name: made.name }));
  }
  async function rename(s, name) {
    const old = s.name;
    await writeSetup(bike.id, { ...s, name });
    offerRename(name, () => writeSetup(bike.id, { ...s, name: old }));
  }
  const remove = (s) => deleteSetup(bike.id, s.id, t('«{name}» deleted.', { name: s.name }));
  const actionsOf = (s) => [
    ...(others.length ? [{ name: t('Copy to another bike …'), icon: Bike, run: () => (dialog = { kind: 'tobike', setup: s }) }] : []),
    ...(s.std ? [] : [{ name: t('Delete …'), icon: Trash2, run: () => (dialog = { kind: 'delete', setup: s }) }]),
  ];
</script>

<section class="card blk sets" aria-labelledby="ts-h">
  <header class="sh">
    <div>
      <h2 id="ts-h">{t('Bag setups')}</h2>
      <p>{[bike.name, tn(setups.length, '{n} setup', '{n} setups'), t('which bags are on and what goes in which bag')].join(' · ')}</p>
    </div>
    <div class="acts">
      {#if setups.length > 1}<a class="btn" href={compareHref}><Columns2 size={16} aria-hidden="true" />{t('Compare')}</a>{/if}
      <button type="button" class="btn hi" onclick={() => (dialog = { kind: 'new', setup: setups.find((s) => s.id === lastId) })}><Plus size={16} aria-hidden="true" />{t('New setup')}</button>
    </div>
  </header>
  <div class="grid">
    {#each setups as s, i (s.id)}
      {@const c = calcs[i]}
      <article class="sc" class:last={s.id === lastId} aria-labelledby="ts-{s.id}">
        <div class="top">
          <a class="pic" href={bikesHash({ tab: 'rig', view: 'setup', bike: bike.id, setup: s.id })} tabindex="-1" aria-hidden="true"><RigBike bags={c.list} /></a>
          <div class="txt">
            <h3 id="ts-{s.id}">{nm(s)}
              {#if s.id === lastId}<span class="badge ok"><Clock3 size={12} aria-hidden="true" />{t('last used')}</span>{/if}
              {#if s.std}<span class="badge">{t('Standard · for old trips')}</span>{:else if !used[s.id]}<span class="badge new">{t('not used yet')}</span>{/if}
            </h3>
            <p class="bags">{c.list.length ? `${tn(c.list.length, '{n} bag', '{n} bags')}: ${bagNames(c)}` : t('No bags yet')}</p>
            <p class="kg"><b class="num">{kg(c.baseG)} kg</b> <span>{t('base weight · with food and water {kg} kg', { kg: kg(c.totalG) })}</span></p>
          </div>
        </div>
        <SetupBar calc={c} />
        <p class="when"><Clock3 size={14} aria-hidden="true" />{when(s)}</p>
        <div class="row">
          <a class="btn" href={bikesHash({ tab: 'rig', view: 'setup', bike: bike.id, setup: s.id })}><ChevronRight size={16} aria-hidden="true" />{t('Open')}<span class="vh"> {nm(s)}</span></a>
          <button type="button" class="btn quiet" onclick={() => copy(s)}><Copy size={16} aria-hidden="true" />{t('Copy')}<span class="vh"> {nm(s)}</span></button>
          {#if !s.std}<button type="button" class="btn quiet" onclick={() => (renaming = s)}><Pencil size={16} aria-hidden="true" />{t('Rename')}<span class="vh"> {nm(s)}</span></button>{/if}
          {#if actionsOf(s).length}<MoreActions class="more" title={nm(s)} label={t('More for {name}', { name: nm(s) })} actions={actionsOf(s)} />{/if}
        </div>
      </article>
    {/each}
  </div>
  <p class="hint">{t('Base weight: bike from the bike data, empty bags and gear from Gear. Food and water only in the total. Only suggestions: every setup can be changed, copied or deleted.')}</p>
</section>

{#if dialog}
  <SetupDialog
    kind={dialog.kind}
    setup={dialog.setup}
    setups={setups.map((s) => ({ id: s.id, name: nm(s) }))}
    bikes={others}
    name={dialog.kind === 'tobike' ? nm(dialog.setup) : ''}
    onsave={(v) => (dialog.kind === 'new' ? create(v) : dialog.kind === 'tobike' ? toBike(dialog.setup, v) : remove(dialog.setup))}
    onclose={() => (dialog = null)}
  />
{/if}
{#if renaming}
  <RenameSheet kicker={t('Bag setup')} title={t('Rename setup')} value={renaming.name} hint={t('Bags and places stay as they are.')} onsave={(name) => rename(renaming, name)} onclose={() => (renaming = null)} />
{/if}

<style>
  .sets {
    gap: 14px;
  }
  .sh {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px 16px;
  }
  .sh h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .sh p {
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .acts .btn {
    gap: 6px;
    text-decoration: none;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .sc {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--paper);
  }
  .sc.last {
    border: 2px solid var(--ok);
    padding: 13px;
  }
  .top {
    display: grid;
    grid-template-columns: minmax(96px, 150px) minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }
  .pic {
    display: block;
    min-width: 0;
  }
  .txt {
    min-width: 0;
  }
  h3 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.4 var(--font-body);
  }
  .badge.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .badge.new {
    background: var(--warn-soft);
    color: var(--ink-2);
  }
  .bags {
    margin: 4px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .kg {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    margin: 6px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .kg b {
    font-size: var(--fs-section);
    color: var(--ink);
  }
  .when {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .row .btn {
    gap: 6px;
    text-decoration: none;
  }
  .row .quiet {
    border-color: transparent;
    background: none;
  }
  .row :global(.more) {
    margin-left: auto;
  }
  .vh {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .hint {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  @media (max-width: 899px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 420px) {
    .top {
      grid-template-columns: 96px minmax(0, 1fr);
      gap: 10px;
    }
  }
</style>
