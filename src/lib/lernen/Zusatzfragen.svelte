<script>
  /**
   * Paket M #34 «10 Zusatzfragen im Rückblick»: questions that help to learn more from the trip. The ones
   * that fit this trip come first; `first` of them show open, the rest wait under «Mehr fragen».
   * «Fragen anpassen»: switch off, change the text, add your own, delete (with Undo), order with arrows
   * and drag. Answers go into the debrief (d.extra), the settings into 'zusatzfragen'.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { EXTRA_KEY, extraConfig, extraContext, extraForTrip, extraList, setExtraOn, renameExtra, addExtra, dropExtra, orderExtra } from './zusatzfragen.js';
  import { sortable } from '../ui/sortable.js';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SkToast from '../sk/SkToast.svelte';
  import { MessageCircleQuestion, ChevronDown, Settings2, Trash2, Plus } from '@lucide/svelte';

  let { trip, d, persist, rides = [], first = 2 } = $props();

  const cfgQ = liveQuery(() => db.settings.get(EXTRA_KEY).then((r) => r ?? null));
  const cfg = $derived(extraConfig($cfgQ?.value));
  const ctx = $derived(extraContext(trip, rides));
  const shown = $derived(extraForTrip(cfg, ctx, d?.extra ?? {}, first));
  const all = $derived(extraList(cfg, ctx));
  // built-in questions are English in the code (t()); a changed or own text is the user's own
  const textOf = (q) => (q.edited ? q.text : t(q.text));

  let moreOpen = $state(false);
  let editing = $state(false);
  let newText = $state('');
  let undo = $state(null);

  const save = (next) => db.settings.put({ key: EXTRA_KEY, value: { ...next, at: new Date().toISOString() } });
  function answer(id, value) {
    d.extra = { ...(d.extra ?? {}), [id]: value };
    if (!value.trim()) delete d.extra[id];
    persist();
  }
  function add(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    save(addExtra(cfg, newText));
    newText = '';
  }
  function drop(q) {
    const before = $state.snapshot(cfg);
    save(dropExtra(cfg, q.id));
    undo = { text: t('«{name}» deleted', { name: textOf(q) }), undo: () => save(before) };
  }
  function move(from, to) {
    const ids = all.map((q) => q.id);
    const [x] = ids.splice(from, 1);
    ids.splice(to, 0, x);
    save(orderExtra(cfg, ids));
  }
</script>

{#snippet ask(q)}
  <label class="zf-q" data-extra={q.id}>
    <span>{textOf(q)}</span>
    <textarea class="inp" rows="2" value={d.extra?.[q.id] ?? ''} oninput={(e) => answer(q.id, e.currentTarget.value)}></textarea>
  </label>
{/snippet}

<section class="rv-sec zf" aria-labelledby="zf-h" data-zusatzfragen>
  <div class="rv-h">
    <div><h2 id="zf-h"><MessageCircleQuestion size={18} aria-hidden="true" /> {t('More to learn')}</h2><p class="rv-sub">{t('optional questions · the ones that fit this trip first')}</p></div>
    <button type="button" class="tp-link" aria-expanded={editing} onclick={() => (editing = !editing)}><Settings2 size={15} aria-hidden="true" /> {editing ? t('Done|edit') : t('Adjust questions')}</button>
  </div>
  <div class="rv-box pad">
    {#if editing}
      <p class="tp-muted tp-small">{t('Switch questions off, change their text, add your own or delete them. Order with the arrows or by dragging.')}</p>
      <ul class="zf-edit" use:sortable={{ onmove: move }}>
        {#each all as q, i (q.id)}
          <li data-sort-id={q.id}>
            <SortGrip name={textOf(q)} onstep={(dir) => move(i, i + dir)} />
            <input type="checkbox" checked={q.on} aria-label={t('Ask «{name}»', { name: textOf(q) })} onchange={(e) => save(setExtraOn(cfg, q.id, e.currentTarget.checked))} />
            <input class="inp" value={textOf(q)} aria-label={t('Text of the question')} onchange={(e) => save(renameExtra(cfg, q.id, e.currentTarget.value))} />
            <SortArrows name={textOf(q)} {i} n={all.length} onstep={(dir) => move(i, i + dir)} />
            <button type="button" class="zf-del" aria-label={t('Delete «{name}»', { name: textOf(q) })} onclick={() => drop(q)}><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
      <form class="zf-add" onsubmit={add}>
        <input class="inp" bind:value={newText} placeholder={t('Your own question')} aria-label={t('Your own question')} />
        <button type="submit" class="btn k"><Plus size={16} aria-hidden="true" /><span class="kl">{t('Add')}</span></button>
      </form>
    {:else if !shown.open.length && !shown.more.length}
      <p class="tp-muted">{t('All questions are off.')} <button type="button" class="tp-link" onclick={() => (editing = true)}>{t('Adjust questions')}</button></p>
    {:else}
      {#each shown.open as q (q.id)}{@render ask(q)}{/each}
      {#if shown.more.length}
        <button type="button" class="tp-link zf-more" aria-expanded={moreOpen} onclick={() => (moreOpen = !moreOpen)}><ChevronDown size={15} aria-hidden="true" /> {moreOpen ? t('Fewer questions') : t('Ask more ({n})', { n: shown.more.length })}</button>
        {#if moreOpen}{#each shown.more as q (q.id)}{@render ask(q)}{/each}{/if}
      {/if}
    {/if}
  </div>
</section>
<SkToast bind:note={undo} />

<style>
  .zf h2 {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .zf-q {
    display: grid;
    gap: 4px;
    margin: 0 0 12px;
  }
  .zf-q span {
    font-weight: 600;
  }
  .zf-q textarea {
    width: 100%;
    box-sizing: border-box;
    font: inherit;
  }
  .zf-more {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
  .zf-edit {
    list-style: none;
    margin: 8px 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .zf-edit li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .zf-edit .inp {
    flex: 1;
    min-width: 0;
  }
  .zf-edit input[type='checkbox'] {
    width: 22px;
    height: 22px;
    flex: none;
  }
  .zf-del {
    flex: none;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .zf-add {
    display: flex;
    gap: 8px;
  }
  .zf-add .inp {
    flex: 1;
    min-width: 0;
  }
</style>
