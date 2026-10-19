<script>
  /**
   * Paket O, extra block «Runden ab Haustür» (#195): your loops from the front door with km, minutes and a
   * link (komoot or a map). «Wie viel Zeit hast du?» shows the loops that fit. Add, change, delete, order.
   */
  import { Plus, Pencil, Trash2, ExternalLink } from '@lucide/svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { putItem, patchItem, dropItems, restoreItems } from '../sportsdb.js';
  import { loopsFor } from '../sportshelp.js';
  import { moveId } from '../sportsbase.js';
  import { t, num } from '../i18n.svelte.js';

  let { sport, items = [] } = $props();

  const all = $derived(items.filter((x) => x.kind === 'loop').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  let time = $state(0);
  const list = $derived(time ? loopsFor(all, time) : all);
  let form = $state(null);
  const safe = (u) => (/^https?:\/\//i.test(String(u ?? '').trim()) ? String(u).trim() : '');

  async function save(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const rec = { name, km: Number(form.km) > 0 ? Number(form.km) : null, min: Number(form.min) > 0 ? Math.round(Number(form.min)) : null, link: safe(form.link) };
    if (form.id) await patchItem(form.id, rec);
    else await putItem({ sport: sport.id, kind: 'loop', ...rec, order: (all.at(-1)?.order ?? 0) + 1 });
    form = null;
  }
  async function del(x) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: x.name }), text: t('Only this loop goes.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => dropItems([x.id]), undo: restoreItems, text: t('"{name}" deleted.', { name: x.name }), name: x.name });
  }
  const reorder = (ids) => Promise.all(ids.map((id, i) => patchItem(id, { order: i + 1 })));
  const step = (x, dir) => reorder(moveId(all.map((y) => y.id), x.id, all.indexOf(x) + dir));
  const dragged = (from, to) => reorder(moveId(all.map((y) => y.id), all[from].id, to));
</script>

{#if all.length}
  <fieldset class="row" style="border:0;padding:0;margin:0 0 8px">
    <legend class="small">{t('How much time do you have?')}</legend>
    {#each [0, 30, 60, 90, 120, 180] as m (m)}
      <button type="button" class="chip" aria-pressed={time === m} onclick={() => (time = m)} data-time={m}>{m ? t('{n} min', { n: m }) : t('All')}</button>
    {/each}
  </fieldset>
{/if}
{#if list.length}
  <ul class="ilist" use:sortable={{ onmove: dragged }}>
    {#each list as x, i (x.id)}
      <li data-sort-id={x.id} data-loop={x.name}>
        {#if !time}<SortGrip name={x.name} onstep={(d) => step(x, d)} />{/if}
        <span class="ent"><b>{x.name}</b><small class="num">{[x.km ? `${num(x.km)} km` : '', x.min ? t('{n} min', { n: x.min }) : ''].filter(Boolean).join(' · ')}</small>{#if x.link}<a class="ibtn" href={x.link} target="_blank" rel="noopener noreferrer" aria-label={t('Open «{name}»', { name: x.name })}><ExternalLink size={16} aria-hidden="true" /></a>{/if}</span>
        <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: x.name })} onclick={() => (form = { id: x.id, name: x.name, km: x.km ?? '', min: x.min ?? '', link: x.link ?? '' })}><Pencil size={16} aria-hidden="true" /></button>
        <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: x.name })} onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" /></button>
        {#if !time}<SortArrows name={x.name} {i} n={list.length} onstep={(d) => step(x, d)} />{/if}
      </li>
    {/each}
  </ul>
{:else if all.length}
  <p class="none">{t('No loop fits in this time.')}</p>
{:else}
  <p class="none">{t('No loop yet. Add the rounds you like to ride from home.')}</p>
{/if}
{#if form}
  <form class="form" onsubmit={save} data-loop-form>
    <label>{t('Name')}<input bind:value={form.name} placeholder={t('e.g. Lake loop')} /></label>
    <label>{t('km')}<input type="number" min="0" step="0.1" bind:value={form.km} /></label>
    <label>{t('Minutes')}<input type="number" min="0" bind:value={form.min} /></label>
    <label class="wide">{t('Link (komoot, map), optional')}<input type="url" bind:value={form.link} placeholder="https://" /></label>
    <button type="submit" class="btn hi" disabled={!form.name.trim()}>{t('Save')}</button>
    <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
  </form>
{:else}
  <button type="button" class="chip dash" onclick={() => (form = { name: '', km: '', min: '', link: '' })} data-add-loop><Plus size={14} aria-hidden="true" />{t('New loop')}</button>
{/if}
