<script>
  /**
   * «Bausteine» (Noah 15.10.2026; mockups BS1, BS2, BS5, BS6): the blocks of one sheet of one bike, to
   * move with the arrows and by dragging (B2 a+b), to switch on and off (B4 a: off is missing in the PDF
   * and the text too), to take off the sheet and to add from «More building blocks». Used on the page
   * «Bausteine» and right in the sheet («Bausteine ordnen», B3 a+b).
   *
   * The first change on a bike asks once: for all bikes or only for this one (BS4 a). Deleting an own
   * block deletes it on this bike; when other bikes still have it the app asks (BS5 b).
   * part: 'list' (the blocks on the sheet), 'library' («More building blocks») or 'both'.
   * views: { [block id]: { summary, empty } } of this bike. onnotice(text, undo).
   */
  import { ChevronDown, Pencil, ArrowRightLeft, Trash2, Undo, CircleMinus, Plus } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';
  import { fullLayout, blockDef, scopeOf, hasOwnLayout, moveBlock, moveTo, switchBlock, addBlock, takeOff, othersWith, isOwn } from '../../sheetblocks.js';
  import { changeLayout, setScope, deleteOwn } from './blockstore.js';
  import SortGrip from '../../ui/SortGrip.svelte';
  import SortArrows from '../../ui/SortArrows.svelte';
  import { sortable } from '../../ui/sortable.js';
  import MoreActions from '../../ui/MoreActions.svelte';
  import BlockSwitch from './BlockSwitch.svelte';
  import BlockAsk from './BlockAsk.svelte';
  import OwnBlockDialog from './OwnBlockDialog.svelte';

  let { bike, bikes = [], glob, sheet, views = {}, part = 'both', variant = 'page', onnotice } = $props();

  const full = $derived(fullLayout(bike, sheet, glob));
  const list = $derived(full.filter((x) => !x.lib).map((x) => ({ ...x, def: blockDef(x.id, glob) })).filter((x) => x.def));
  const lib = $derived(full.filter((x) => x.lib).map((x) => ({ ...x, def: blockDef(x.id, glob) })).filter((x) => x.def));
  // Gesamttest 20.10.2026 Design 5: at most one «neu» per page, on the first new one
  const firstNew = $derived([...list, ...lib].find((x) => x.def.isNew)?.id ?? null);
  const nameOf = (def) => (def.own ? def.title : t(def.name));
  const both = (def) => def.sheets.length > 1;

  let ask = $state(null); // { kind: 'scope' | 'jobs' | 'delete', … }
  let own = $state(null); // { def } for the own block window (def null: a new one)
  let adding = $state(false);

  /** A change of the order or the switches: asks for the scope the first time on this bike (BS4 a). */
  function change(fn, text) {
    const scope = scopeOf(bike, sheet);
    if (!scope) ask = { kind: 'scope', fn, text };
    else apply(fn, text, scope);
  }
  async function apply(fn, text, scope) {
    const undo = await changeLayout(bike.id, sheet, fn, scope);
    if (text) onnotice?.(text, undo);
  }

  const step = (x, dir) => change((l) => moveBlock(l, x.id, dir), '');
  const dragged = (from, to) => change((l) => moveTo(l, from, to), t('«{block}» moved.', { block: nameOf(list[from].def) }));
  function flip(x, on) {
    // switching off «Please do» asks first: without it the bike shop does not know what to do (6.4)
    if (!on && x.id === 'jobs') return (ask = { kind: 'jobs', x });
    change((l) => switchBlock(l, x.id, on), on ? '' : t('«{block}» switched off.', { block: nameOf(x.def) }));
  }
  const off = (x) => change((l) => takeOff(l, x.id), t('«{block}» taken off the sheet.', { block: nameOf(x.def) }));
  const add = (x) => change((l) => addBlock(l, x.id), t('«{block}» added to the sheet.', { block: nameOf(x.def) }));

  async function scopeTo(scope) {
    const undo = await setScope(bike.id, sheet, scope);
    onnotice?.(scope === 'bike' ? t('{bike} has its own order now.', { bike: bike.name }) : t('Standard set again.'), undo);
  }

  /** BS5 b: delete on this bike; when other bikes have it too, ask whether there as well. */
  async function remove(x) {
    const others = othersWith(bikes, bike.id, x.def.ownId);
    if (others.length) return (ask = { kind: 'delete', x, n: others.length });
    const undo = await deleteOwn(bike.id, x.def.ownId);
    onnotice?.(t('«{block}» deleted.', { block: nameOf(x.def) }), undo);
  }
  async function picked(v) {
    const a = ask;
    if (a.kind === 'scope') return apply(a.fn, a.text, v);
    if (a.kind === 'jobs' && v === 'off') return change((l) => switchBlock(l, 'jobs', false), t('«{block}» switched off.', { block: nameOf(a.x.def) }));
    if (a.kind === 'delete') {
      const undo = await deleteOwn(bike.id, a.x.def.ownId, { everywhere: v === 'all' });
      onnotice?.(v === 'all' ? t('«{block}» deleted on all bikes.', { block: nameOf(a.x.def) }) : t('«{block}» deleted.', { block: nameOf(a.x.def) }), undo);
    }
  }

  function actions(x) {
    const out = [];
    const mine = hasOwnLayout(bike, sheet);
    if (!mine) out.push({ name: t('Only for this bike'), explain: t('{bike} gets its own order. The others keep the standard.', { bike: bike.name }), icon: ArrowRightLeft, run: () => scopeTo('bike') });
    else out.push({ name: t('For all bikes'), explain: t('{bike} takes the standard order again.', { bike: bike.name }), icon: Undo, run: () => scopeTo('all') });
    if (x.def.own) out.push({ name: t('Edit|block'), explain: t('Title, kind, points and where it shows'), icon: Pencil, run: () => (own = { def: x.def }) });
    out.push({ name: t('Take off the sheet'), explain: t('It waits in More building blocks.'), icon: CircleMinus, run: () => off(x) });
    if (x.def.own) out.push({ name: t('Delete block'), explain: t('Deletes it on {bike}.', { bike: bike.name }), icon: Trash2, run: () => remove(x) });
    return out;
  }
</script>

{#snippet badges(x)}
  {#if both(x.def)}<span class="bdg">{t('on both sheets')}</span>{/if}
  {#if x.def.own}<span class="bdg">{t('own|block')}</span>{/if}
  {#if x.def.isNew && x.id === firstNew}<span class="bdg new">{t('new|block')}</span>{/if}
{/snippet}

{#if part !== 'library'}
  <ul class="blist {variant}" use:sortable={{ onmove: dragged }} data-testid="block-list" data-sheet={sheet}>
    {#each list as x, i (x.id)}
      {@const v = views[x.id] ?? {}}
      <li class="brow" class:off={!x.on} data-sort-id={x.id} data-block={x.id}>
        <SortGrip name={nameOf(x.def)} onstep={(d) => step(x, d)} />
        <div class="bmain">
          <p class="bname"><b>{nameOf(x.def)}</b>{@render badges(x)}</p>
          <p class="bsum">{#if !x.on}{t('Switched off · not in the PDF and the text')}{:else if v.empty}{t('Empty for this bike · not in the PDF')}{:else}{v.summary ?? ''}{/if}</p>
        </div>
        <div class="bctl">
          <SortArrows name={nameOf(x.def)} {i} n={list.length} onstep={(d) => step(x, d)} />
          <BlockSwitch on={x.on} label={t('Show {block}', { block: nameOf(x.def) })} onchange={(on) => flip(x, on)} />
          <MoreActions small title={nameOf(x.def)} label={t('More for {what}', { what: nameOf(x.def) })} actions={actions(x)} />
        </div>
      </li>
    {:else}
      <li class="empty">{t('No block on this sheet. Add one from More building blocks.')}</li>
    {/each}
  </ul>
{/if}

{#if part === 'both'}
  <div class="addrow">
    <button type="button" class="btn" aria-expanded={adding} onclick={() => (adding = !adding)}><Plus size={16} aria-hidden="true" />{t('Add a block')}<ChevronDown size={16} aria-hidden="true" /></button>
  </div>
{/if}

{#if part === 'library' || (part === 'both' && adding)}
  <ul class="lib" data-testid="block-library">
    {#each lib as x (x.id)}
      {@const v = views[x.id] ?? {}}
      <li class="blib" data-block={x.id}>
        <div class="bmain">
          <p class="bname"><b>{nameOf(x.def)}</b>{@render badges(x)}</p>
          <p class="bsum">{v.empty ? t('empty for {bike}', { bike: bike.name }) : (v.summary ?? '')}</p>
          {#if x.id === 'frameId'}<p class="warn">{t('The frame number goes into the PDF and the text.')}</p>{/if}
        </div>
        <button type="button" class="btn addb" onclick={() => add(x)}><Plus size={16} aria-hidden="true" />{t('Add|block')}</button>
      </li>
    {:else}
      <li class="empty">{t('All blocks are on the sheet.')}</li>
    {/each}
  </ul>
  <button type="button" class="btn newown" onclick={() => (own = { def: null })}><Plus size={16} aria-hidden="true" />{t('New own block')}</button>
{/if}

{#if ask?.kind === 'scope'}
  <BlockAsk
    title={t('Change the order for all bikes or only for {bike}?', { bike: bike.name })}
    options={[
      { value: 'all', label: t('For all bikes'), sub: t('Applies to every bike without its own order.') },
      { value: 'bike', label: t('Only for {bike}', { bike: bike.name }), sub: t('{bike} has its own order. The others keep the standard.', { bike: bike.name }) },
    ]}
    onpick={picked}
    onclose={() => (ask = null)}
  />
{:else if ask?.kind === 'jobs'}
  <BlockAsk
    title={t('Switch off «Please do»?')}
    text={t('Without «Please do» the bike shop does not know what to do.')}
    options={[
      { value: 'off', label: t('Switch off anyway') },
      { value: 'keep', label: t('Keep it') },
    ]}
    onpick={picked}
    onclose={() => (ask = null)}
  />
{:else if ask?.kind === 'delete'}
  <BlockAsk
    title={t('Delete «{block}» on all bikes too?', { block: nameOf(ask.x.def) })}
    text={t('{n} other bikes have this block too. Their texts and ticks go with it.', { n: ask.n })}
    options={[
      { value: 'one', label: t('Only on {bike}', { bike: bike.name }), sub: t('The other bikes keep it.') },
      { value: 'all', label: t('On all bikes'), sub: t('The block goes everywhere.') },
    ]}
    onpick={picked}
    onclose={() => (ask = null)}
  />
{/if}

{#if own}
  <OwnBlockDialog def={own.def} {bike} {bikes} {sheet} onclose={() => (own = null)} onsaved={(def, undo) => onnotice?.(own?.def ? t('Saved.') : t('«{block}» added to the sheet.', { block: def.title }), undo)} />
{/if}

<style>
  .blist,
  .lib {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .brow {
    display: flex;
    align-items: center;
    gap: 4px 8px;
    padding: 6px 8px 6px 2px;
    border: 1px dashed var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .page .brow {
    border-style: solid;
  }
  .brow.off .bname b {
    color: var(--ink-3);
  }
  .bmain {
    flex: 1;
    min-width: 0;
  }
  .bname {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0;
    overflow-wrap: break-word;
  }
  .sheet .bname b {
    color: var(--accent);
    font: 700 var(--fs-tiny) / 1.4 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .bsum {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .bctl {
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .bdg {
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.5 var(--font-body);
  }
  .bdg.new {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .empty {
    padding: 12px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .addrow {
    margin: 10px 0 0;
  }
  .addrow .btn,
  .addb,
  .newown {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .lib {
    margin-top: 10px;
    gap: 0;
  }
  .blib {
    display: flex;
    align-items: center;
    gap: 8px 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .addb {
    flex: none;
  }
  .warn {
    margin: 4px 0 0;
    color: var(--warn);
    font-size: var(--fs-small);
  }
  .newown {
    margin-top: 12px;
  }
  /* a phone: the name and its line on top, the arrows, the switch and «…» below (mockup BS5 390) */
  @media (max-width: 719px) {
    .brow {
      flex-wrap: wrap;
    }
    .bmain {
      flex: 1 1 calc(100% - 60px);
    }
    .bctl {
      flex: 1 1 100%;
      justify-content: space-between;
      padding-left: 40px;
    }
    .blib {
      flex-wrap: wrap;
    }
  }
</style>
