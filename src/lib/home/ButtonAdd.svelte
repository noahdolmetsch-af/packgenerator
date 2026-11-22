<script>
  /** Gruss B: the line to add a button (a feeling with an emoji, a plan) or a group. onadd(name, emoji). */
  import { Plus } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  let { placeholder, withEmoji = false, button = '', key = '', max = 24, onadd } = $props();
  let name = $state('');
  let emoji = $state('');
  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onadd(name, emoji);
    name = '';
    emoji = '';
  }
</script>

<form class="hb-add" onsubmit={submit}>
  {#if withEmoji}<input class="inp emo" bind:value={emoji} maxlength="8" placeholder="🙂" aria-label={t('Emoji (optional)')} data-hb-emoji />{/if}
  <input class="inp" bind:value={name} maxlength={max} {placeholder} aria-label={placeholder} data-hb-new={key} />
  <button type="submit" class="btn sm" disabled={!name.trim()}><Plus size={14} aria-hidden="true" />{button || t('Add')}</button>
</form>

<style>
  .hb-add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 8px;
  }
  .hb-add > .inp {
    flex: 1 1 160px;
    min-width: 0;
  }
  .hb-add > .emo {
    flex: 0 0 4.5em;
    min-width: 0;
    text-align: center;
  }
</style>
