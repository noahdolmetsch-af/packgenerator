<script>
  /**
   * Paket O «Bausteine anpassen» (#190): the colour of the sport (#121) and its blocks: switch each on or off,
   * rename it, move it (arrows and drag), add an extra block or an own one (a checklist or notes), delete an
   * own block (its lines too, with Undo). Everything is a suggestion and can be changed back.
   */
  import { Plus, Pencil, Trash2, Eye, EyeOff, X } from '@lucide/svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { COLORS, BLOCK_NAMES, BLOCK_HINTS, blocksOf, toggleBlock, moveBlock, renameBlock, addExtra, removeExtra, addOwnBlock, removeOwnBlock, addableExtras, patchSport } from '../sportsbase.js';
  import { saveCfg, dropItems, restoreItems, readCfg } from '../sportsdb.js';
  import { blockName } from './words.js';
  import { t, tn } from '../i18n.svelte.js';

  let { sport, cfg, color, items = [], onclose } = $props();

  const blocks = $derived(blocksOf(sport.id, cfg));
  const extras = $derived(addableExtras(sport.id, cfg));
  let renaming = $state(null); // { key, name }
  let own = $state(null); // { name, type }

  const save = (next) => saveCfg(next);
  const step = (b, dir) => save(moveBlock(cfg, sport.id, b.key, blocks.indexOf(b) + dir));
  const dragged = (from, to) => save(moveBlock(cfg, sport.id, blocks[from].key, to));
  async function doRename(e) {
    e.preventDefault();
    await save(renameBlock(cfg, sport.id, renaming.key, renaming.name));
    renaming = null;
  }
  async function addOwn(e) {
    e.preventDefault();
    const r = addOwnBlock(cfg, sport.id, own);
    if (r.key) await save(r.cfg);
    own = null;
  }
  async function del(b) {
    if (!b.own) return save(removeExtra(cfg, sport.id, b.key));
    const lines = items.filter((x) => x.block === b.key);
    const name = blockName(b);
    if ((await askDelete({ title: t('Delete block «{name}»?', { name }), text: lines.length ? tn(lines.length, 'Its {n} line goes too.', 'Its {n} lines go too.') : t('It has no lines yet.') })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const before = await readCfg();
        await save(removeOwnBlock(before, sport.id, b.key));
        return { before, lines: await dropItems(lines.map((x) => x.id)) };
      },
      undo: async ({ before, lines: back }) => {
        await save(before);
        await restoreItems(back);
      },
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  const setColor = (hex) => save(patchSport(cfg, sport.id, { color: hex }));
</script>

<section class="card" aria-labelledby="be-h" data-block-edit>
  <div class="hl">
    <h2 id="be-h">{t('Adjust blocks')}</h2>
    <button type="button" class="ibtn" aria-label={t('Close')} onclick={onclose}><X size={18} aria-hidden="true" /></button>
  </div>

  <fieldset class="colors" data-colors>
    <legend class="small">{t('Colour of this sport (lists and the mosaic)')}</legend>
    {#each COLORS as c (c.hex)}
      <label title={t(c.name)}><input type="radio" name="sc-{sport.id}" value={c.hex} checked={color === c.hex} onchange={() => setColor(c.hex)} aria-label={t(c.name)} /><i style="background:{c.hex}"></i></label>
    {/each}
  </fieldset>

  <p class="small">{t('Switch off what you do not need. Drag or use the arrows to change the order.')}</p>
  <ul class="slist bedit" use:sortable={{ onmove: dragged }}>
    {#each blocks as b, i (b.key)}
      <li data-sort-id={b.key} class:off={!b.on} data-edit-block={b.key}>
        <SortGrip name={blockName(b)} onstep={(d) => step(b, d)} />
        {#if renaming?.key === b.key}
          <form class="add" onsubmit={doRename}>
            <label class="vh" for="rn-{b.key}">{t('New name')}</label>
            <input id="rn-{b.key}" bind:value={renaming.name} placeholder={b.own ? '' : t(BLOCK_NAMES[b.key])} />
            <button type="submit" class="btn hi">{t('Save')}</button>
            <button type="button" class="btn" onclick={() => (renaming = null)}>{t('Cancel')}</button>
          </form>
        {:else}
          <span class="t"><b>{blockName(b)}</b><small>{b.own ? (b.type === 'notes' ? t('Own block: notes') : t('Own block: checklist')) : t(BLOCK_HINTS[b.key])}</small></span>
          <button type="button" class="btn switch" aria-pressed={b.on} onclick={() => save(toggleBlock(cfg, sport.id, b.key))} data-toggle={b.key}>{#if b.on}<Eye size={16} aria-hidden="true" />{t('On')}{:else}<EyeOff size={16} aria-hidden="true" />{t('Off')}{/if}</button>
          <button type="button" class="ibtn" aria-label={t('Rename «{name}»', { name: blockName(b) })} onclick={() => (renaming = { key: b.key, name: b.raw ? b.name : '' })}><Pencil size={16} aria-hidden="true" /></button>
          {#if b.type !== 'base'}<button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: blockName(b) })} onclick={() => del(b)} data-del-block={b.key}><Trash2 size={16} aria-hidden="true" /></button>{/if}
        {/if}
        <SortArrows name={blockName(b)} {i} n={blocks.length} onstep={(d) => step(b, d)} />
      </li>
    {/each}
  </ul>
  <p class="small">{t('A renamed block gets its standard name back when you save an empty name.')}</p>

  <h3>{t('Add a block')}</h3>
  <div class="row">
    {#each extras as k (k)}
      <button type="button" class="chip dash" onclick={() => save(addExtra(cfg, sport.id, k))} title={t(BLOCK_HINTS[k])} data-add-extra={k}><Plus size={14} aria-hidden="true" />{t(BLOCK_NAMES[k])}</button>
    {/each}
  </div>
  {#if own}
    <form class="form" onsubmit={addOwn} data-own-form>
      <label>{t('Name')}<input bind:value={own.name} placeholder={t('e.g. Warm-up')} /></label>
      <label>{t('Kind')}<select bind:value={own.type}><option value="check">{t('Checklist')}</option><option value="notes">{t('Notes')}</option></select></label>
      <button type="submit" class="btn hi" disabled={!own.name.trim()}>{t('Add')}</button>
      <button type="button" class="btn" onclick={() => (own = null)}>{t('Cancel')}</button>
    </form>
  {:else}
    <button type="button" class="chip dash" onclick={() => (own = { name: '', type: 'check' })} data-add-own><Plus size={14} aria-hidden="true" />{t('Own block')}</button>
  {/if}
</section>
