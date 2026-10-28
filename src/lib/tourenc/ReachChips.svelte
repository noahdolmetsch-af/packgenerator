<script>
  /**
   * Touren c 65 «Unnötig oder schlecht verstaut»: the look back tells «I did not need it» (the chips above) from
   * «I needed it, but it was hard to reach». A fold under the chips: one chip per used item; a tap marks it
   * (debrief.reach = [itemId]). «Fertig» then suggests a learning «pack it within reach», which Pack shows at the
   * item next time. rows: [{ e, item }] of the trip; d: the debrief; onchange(list).
   */
  import { Hand } from '@lucide/svelte';
  import { t, tn, nameOf } from '../i18n.svelte.js';

  let { rows = [], d, onchange } = $props();
  const reach = $derived(new Set(d?.reach ?? []));
  const used = $derived(rows.filter(({ e }) => !d?.items?.[e.itemId]));
  function toggle(id) {
    const next = new Set(reach);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onchange([...next]);
  }
</script>

{#if used.length}
  <details class="reach" open={reach.size > 0} data-debrief-reach>
    <summary><Hand size={16} aria-hidden="true" /><span>{t('Needed, but hard to reach?')}</span>{#if reach.size}<small class="num">{tn(reach.size, '{n} marked', '{n} marked')}</small>{/if}</summary>
    <p class="tp-small tp-muted">{t('Not the same as «not needed»: tap what you used but had to dig for. Next time the app suggests packing it within reach.')}</p>
    <div class="rchips">
      {#each used as { e, item } (e.itemId)}
        <button type="button" class="rchip" aria-pressed={reach.has(e.itemId)} onclick={() => toggle(e.itemId)} data-reach-item={e.itemId}>{nameOf(item)}</button>
      {/each}
    </div>
  </details>
{/if}

<style>
  .reach {
    margin-top: 12px;
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }
  .reach summary {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    min-height: 40px;
    font-weight: 600;
  }
  .reach summary small {
    margin-left: auto;
    font-weight: 400;
    color: var(--ink-2);
  }
  .reach p {
    margin: 4px 0 8px;
  }
  .rchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .rchip {
    min-height: 36px;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .rchip[aria-pressed='true'] {
    background: var(--warn-soft);
    border-color: var(--warn);
  }
</style>
