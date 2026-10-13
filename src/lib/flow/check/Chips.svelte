<script>
  /**
   * v0.127.0 «Tages-Check» 1 (mockups T1, T2): a row of chips. multi: several at once (a list of ids),
   * else one (a tap on the chosen one takes it back). own: «+ eigenes» opens a small field; the text
   * typed becomes a chip of its own (stored as its text). items: [{ id, label }] with labels in words.
   */
  import { Plus } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';

  let { items = [], value = null, multi = false, own = '', label, onpick, onown = null, name = '' } = $props();
  const on = (id) => (multi ? (value ?? []).includes(id) : value === id);
  let adding = $state(false);
  let text = $state('');
  let field = $state();
  $effect(() => {
    if (adding) field?.focus();
  });
  function add(e) {
    e.preventDefault();
    const s = text.trim();
    if (s) onown?.(s);
    text = '';
    adding = false;
  }
</script>

<div class="chips" role="group" aria-labelledby={label} data-chips={name}>
  {#each items as it (it.id)}
    <button type="button" class="ch" aria-pressed={on(it.id)} data-id={it.id} onclick={() => onpick(it.id)}>{it.label}</button>
  {/each}
  {#if own && onown}
    {#if adding}
      <form class="ownf" onsubmit={add}>
        <input bind:this={field} bind:value={text} class="inp oi" type="text" maxlength="80" aria-label={own} onblur={(e) => (text.trim() ? null : (adding = false))} />
        <button type="submit" class="ch add">{t('Add|chip')}</button>
      </form>
    {:else}
      <button type="button" class="ch dash" onclick={() => (adding = true)}><Plus size={14} aria-hidden="true" />{own}</button>
    {/if}
  {/if}
</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .ch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 44px;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .ch:hover {
    background: var(--paper-2);
  }
  .ch[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .ch.dash {
    border-style: dashed;
    color: var(--ink-2);
  }
  .ch.add {
    border-color: var(--hi);
    color: var(--hi);
  }
  .ownf {
    display: flex;
    flex: 1 1 220px;
    gap: var(--sp-2);
    min-width: 0;
  }
  .oi {
    flex: 1;
    min-width: 0;
  }
</style>
