<script>
  /**
   * «Seasonal ideas» of Planen › Woche › Still to plan (Noah 2.11.2026 «c»): the ideas the app suggests in their season
   * (clock change, winter, ski tours, spring) can be renamed and deleted (Undo), and own ideas can be added with a
   * season (from month to month). What the person typed never goes through t().
   * cfg: kalender.js seasonCfg(); onsave(cfg) saves.
   */
  import { Pencil, Trash2, Plus, Undo2 } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { SEASON_STD, SEASON_TITLES } from './kalender.js';
  import { t, locale } from '../i18n.svelte.js';

  let { cfg, onsave } = $props();
  const stdName = (k) => cfg.std[k]?.title ?? t(SEASON_TITLES[k]);
  const hiddenStd = $derived(SEASON_STD.filter((k) => cfg.std[k]?.hidden));
  const shownStd = $derived(SEASON_STD.filter((k) => !cfg.std[k]?.hidden));
  const month = (m) => new Date(Date.UTC(2026, m - 1, 15)).toLocaleDateString(locale(), { timeZone: 'UTC', month: 'long' });
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
  const WHEN = { lights: 'when the clocks change', winter: 'late October to November', ski: 'mid November to December', spring: 'March to mid April' };

  let renaming = $state(null); // { std: key } | { own: id }
  let adding = $state(false);
  let draft = $state({ title: '', from: 10, to: 11 });

  const nameOf = (r) => (r.std ? stdName(r.std) : cfg.own.find((o) => o.id === r.own)?.title ?? '');
  async function rename(name) {
    const v = String(name).trim();
    if (!v) return t('A name is needed.');
    const before = cfg;
    if (renaming.std) onsave({ ...cfg, std: { ...cfg.std, [renaming.std]: { ...cfg.std[renaming.std], title: v } } });
    else onsave({ ...cfg, own: cfg.own.map((o) => (o.id === renaming.own ? { ...o, title: v } : o)) });
    offerDone(t('Renamed to «{name}».', { name: v }), () => onsave(before));
    renaming = null;
  }
  async function remove(r) {
    const name = nameOf(r);
    const ok = await askDelete({ title: t('Delete «{name}»?', { name }), text: t('The idea is no longer suggested. Nothing else changes.') });
    if (ok !== 'delete') return;
    const before = cfg;
    await deleteWithUndo({
      name,
      text: t('«{name}» deleted.', { name }),
      run: async () => onsave(r.std ? { ...cfg, std: { ...cfg.std, [r.std]: { ...cfg.std[r.std], hidden: true } } } : { ...cfg, own: cfg.own.filter((o) => o.id !== r.own) }),
      undo: async () => onsave(before),
    });
  }
  const restore = (k) => {
    const { hidden, ...rest } = cfg.std[k];
    onsave({ ...cfg, std: { ...cfg.std, [k]: rest } });
  };
  function add(ev) {
    ev.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    onsave({ ...cfg, own: [...cfg.own, { id: `own${Date.now().toString(36)}`, title: title.slice(0, 120), from: Number(draft.from), to: Number(draft.to) }] });
    draft = { title: '', from: 10, to: 11 };
    adding = false;
  }
</script>

<div class="si" data-season-ideas>
  <ul>
    {#each shownStd as k (k)}
      <li data-season-row={k}>
        <span class="n">{stdName(k)}<small>{t(WHEN[k])}</small></span>
        <button type="button" class="btn sm" aria-label={t('Rename «{name}»', { name: stdName(k) })} onclick={() => (renaming = { std: k })}><Pencil size={15} aria-hidden="true" /></button>
        <button type="button" class="btn sm" aria-label={t('Delete «{name}»', { name: stdName(k) })} data-season-del={k} onclick={() => remove({ std: k })}><Trash2 size={15} aria-hidden="true" /></button>
      </li>
    {/each}
    {#each cfg.own as o (o.id)}
      <li data-season-row={o.id}>
        <span class="n">{o.title}<small>{month(o.from)} – {month(o.to)}</small></span>
        <button type="button" class="btn sm" aria-label={t('Rename «{name}»', { name: o.title })} onclick={() => (renaming = { own: o.id })}><Pencil size={15} aria-hidden="true" /></button>
        <button type="button" class="btn sm" aria-label={t('Delete «{name}»', { name: o.title })} data-season-del={o.id} onclick={() => remove({ own: o.id })}><Trash2 size={15} aria-hidden="true" /></button>
      </li>
    {/each}
    {#if !shownStd.length && !cfg.own.length}<li class="none">{t('No season ideas. Add your own or bring the standard ones back.')}</li>{/if}
  </ul>
  {#if adding}
    <form onsubmit={add} data-season-form>
      <label>{t('Idea')}<input type="text" bind:value={draft.title} required maxlength="120" placeholder={t('e.g. Wax the chain before winter')} /></label>
      <div class="two">
        <label>{t('From|season')}<select bind:value={draft.from}>{#each MONTHS as m (m)}<option value={m}>{month(m)}</option>{/each}</select></label>
        <label>{t('To|season')}<select bind:value={draft.to}>{#each MONTHS as m (m)}<option value={m}>{month(m)}</option>{/each}</select></label>
      </div>
      <div class="acts"><button type="submit" class="btn hi sm">{t('Save')}</button><button type="button" class="btn sm" onclick={() => (adding = false)}>{t('Cancel')}</button></div>
    </form>
  {:else}
    <button type="button" class="btn sm" data-season-add onclick={() => (adding = true)}><Plus size={15} aria-hidden="true" />{t('Add an idea')}</button>
  {/if}
  {#each hiddenStd as k (k)}
    <button type="button" class="btn sm" data-season-back={k} onclick={() => restore(k)}><Undo2 size={15} aria-hidden="true" />{t('Bring back «{name}»', { name: stdName(k) })}</button>
  {/each}
</div>

{#if renaming}
  <RenameSheet title={t('Rename «{name}»', { name: nameOf(renaming) })} value={nameOf(renaming)} max={120} onsave={rename} onclose={() => (renaming = null)} />
{/if}

<style>
  .si ul {
    margin: 0 0 8px;
    padding: 0;
    list-style: none;
  }
  .si li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .si .n {
    flex: 1;
    min-width: 0;
    font-weight: 600;
  }
  .si small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .si .none {
    color: var(--ink-2);
    font-size: var(--fs-small);
    border-top: 0;
  }
  .si form {
    display: grid;
    gap: 10px;
    margin: 8px 0;
  }
  .si label {
    display: grid;
    gap: 4px;
    text-align: left;
  }
  .si .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .acts {
    display: flex;
    gap: 6px;
  }
  .si > .btn {
    margin: 4px 6px 0 0;
  }
</style>
