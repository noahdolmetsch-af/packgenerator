<script>
  /**
   * Gepäck nachtragen (Noah 20.10.2026 «2b und a möglich»): choose what was along on a finished tour. Tap
   * the things one by one from your Material (with search), or take over everything of a template or an
   * earlier trip and then take out what was not along. Food and drink are a group of their own. A thing
   * that is not in the Material yet can be added there right here (it then is a normal Material item).
   * onsave(ids) with the chosen item ids.
   */
  import TourSheet from './TourSheet.svelte';
  import { t, tn, nameOf } from '../../i18n.svelte.js';
  import { CATEGORIES } from '../../gear.js';
  import { pickGroups, FOOD } from '../tourgear.js';
  import { dates } from '../../review/fmt.js';
  import { Search, Plus, Check } from '@lucide/svelte';

  let { items = [], chosen = [], sources = [], title = '', onsave, onadd = null, onclose } = $props();
  // svelte-ignore state_referenced_locally
  let picked = $state(new Set(chosen));
  let q = $state('');
  let from = $state('');
  let msg = $state('');
  let newCat = $state(FOOD);
  let sheet = $state();

  const groups = $derived(pickGroups(items, picked, q, nameOf));
  const exact = $derived(!!q.trim() && items.some((i) => nameOf(i).toLowerCase() === q.trim().toLowerCase()));
  function toggle(id) {
    const s = new Set(picked);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    picked = s;
  }
  function takeOver() {
    const src = sources.find((s) => s.id === from);
    if (!src) return;
    const known = new Set(items.map((i) => i.id));
    const add = src.ids.filter((id) => known.has(id) && !picked.has(id));
    picked = new Set([...picked, ...add]);
    msg = tn(add.length, '{n} thing taken over from «{name}». Take out what was not along.', '{n} things taken over from «{name}». Take out what was not along.', { name: src.name });
  }
  async function addNew() {
    const id = await onadd?.(q.trim(), newCat);
    if (!id) return;
    picked = new Set([...picked, id]);
    msg = t('«{name}» is new in the Material.', { name: q.trim() });
    q = '';
  }
  function save() {
    onsave?.([...picked]);
    sheet.close();
  }
</script>

<TourSheet bind:this={sheet} id="gp-h" data="gear" title={title || t('Enter the gear')} text={t('Tap what was along. Food and drink are at the end.')} {onclose}>
  {#snippet body()}
    {#if sources.length}
      <div class="from">
        <label class="lf"><span>{t('Take over from')}</span>
          <select bind:value={from} data-gear-from>
            <option value="">{t('A template or an earlier trip …')}</option>
            {#each sources as s (s.id)}<option value={s.id}>{s.kind === 'template' ? t('Template: {name}', { name: s.name }) : `${s.name}${s.day ? ` · ${dates(s.day)}` : ''}`}</option>{/each}
          </select>
        </label>
        <button type="button" class="btn" disabled={!from} onclick={takeOver} data-gear-take>{t('Take over')}</button>
      </div>
    {/if}
    <label class="srch"><Search size={16} aria-hidden="true" /><input type="search" bind:value={q} placeholder={t('Search the Material')} aria-label={t('Search the Material')} data-gear-search /></label>
    {#if msg}<p class="msg" role="status">{msg}</p>{/if}
    {#if q.trim() && !exact && onadd}
      <div class="new" data-gear-new>
        <span>{t('Not in the Material: add «{name}» as', { name: q.trim() })}</span>
        <select bind:value={newCat} aria-label={t('Category')}>{#each CATEGORIES as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}</select>
        <button type="button" class="btn" onclick={addNew} data-gear-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </div>
    {/if}
    {#each groups as g (g.key)}
      <h3 class="gh" data-pick-group={g.key}>{g.key === FOOD ? t('Food and drink') : t(g.name)}</h3>
      <ul class="pl">
        {#each g.items as i (i.id)}
          <li><label class="pi"><input type="checkbox" checked={picked.has(i.id)} onchange={() => toggle(i.id)} data-gear-item={i.id} /><span class="pn">{nameOf(i)}</span>{#if i.brand}<span class="pb">{i.brand}</span>{/if}</label></li>
        {/each}
      </ul>
    {:else}
      <p class="tp-muted">{q.trim() ? t('Nothing found.') : t('Your Material is empty. Add things here with the search field.')}</p>
    {/each}
  {/snippet}
  {#snippet foot()}
    <span class="cnt num" data-gear-count>{tn(picked.size, '{n} thing chosen', '{n} things chosen')}</span>
    <button type="button" class="btn" onclick={() => sheet.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={save} data-gear-save><Check size={16} aria-hidden="true" />{t('Save')}</button>
  {/snippet}
</TourSheet>

<style>
  .from {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    margin: 0 0 12px;
  }
  .from .lf {
    display: grid;
    flex: 1 1 220px;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .from select,
  .new select {
    min-height: 44px;
    max-width: 100%;
  }
  .srch {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .srch input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    border: 0;
    background: transparent;
    font: inherit;
  }
  .msg {
    margin: 8px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .new {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 10px 0 0;
    font-size: var(--fs-small);
  }
  .gh {
    margin: 16px 0 4px;
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .pl {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pi {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    border-bottom: 1px solid var(--card-line);
    cursor: pointer;
  }
  .pi input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
  }
  .pn {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .pb {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .cnt {
    margin-right: auto;
    align-self: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
