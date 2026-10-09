<script>
  /** v0.39.0 (AP28): the ready check a trip from this template starts with (empty: the usual one). */
  import { X } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { tpl, onchange } = $props();
  let text = $state('');
  function add(e) {
    e.preventDefault();
    const label = text.trim();
    if (!label) return;
    text = '';
    onchange?.((x) => ({ ...x, ready: [...(x.ready ?? []), { id: `own-${Date.now().toString(36)}`, label }] }));
  }
  const remove = (id) => onchange?.((x) => ({ ...x, ready: (x.ready ?? []).filter((r) => r.id !== id) }));
</script>

<div class="rf">
  {#if !(tpl.ready ?? []).length}<p class="note">{t('Empty: a trip from it gets your usual ready check.')}</p>{/if}
  <ul>
    {#each tpl.ready ?? [] as r (r.id)}
      <li><span>{t(r.label)}</span><button type="button" class="x" aria-label={t('Remove {name}', { name: t(r.label) })} onclick={() => remove(r.id)}><X size={16} aria-hidden="true" /></button></li>
    {/each}
  </ul>
  <form class="add" onsubmit={add}>
    <input class="inp" bind:value={text} placeholder={t('e.g. Lights charged')} aria-label={t('New check')} />
    <button type="submit" class="btn">{t('Add')}</button>
  </form>
</div>

<style>
  .rf {
    padding: 4px 0 12px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    border-bottom: 1px solid var(--line);
  }
  li span {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .x {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .add {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .note {
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--ink-3);
  }
</style>
