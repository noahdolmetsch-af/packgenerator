<script>
  /**
   * «Training verbessern» 7 «Einheiten-Bibliothek» (Noah 03.11.2026): sessions the user keeps (name, kind, minutes, zone).
   * In the form of a new session: one tap puts a kept session in. «Keep this session» saves the form. The library can be
   * renamed and cleaned up (delete with Undo, done in the page).
   */
  import { Bookmark, X } from '@lucide/svelte';
  import { t } from '../../i18n.svelte.js';

  let { items = [], canSave = false, onpick, onsave, onrename, ondelete, hours = (m) => `${m} min` } = $props();
</script>

{#if items.length || canSave}
  <div class="lb" data-library>
    {#if items.length}
      <p class="lh">{t('From your library')}</p>
      <div class="lc">
        {#each items as e (e.id)}<button type="button" class="ch" onclick={() => onpick(e)} data-library-pick={e.id}><Bookmark size={14} aria-hidden="true" /><span class="cn">{e.name}</span><span class="num">· {hours(e.mins)}</span>{#if e.zone}<i class="zt z{e.zone}">Z{e.zone}</i>{/if}</button>{/each}
      </div>
    {/if}
    {#if canSave}<button type="button" class="btn btn-link sm" onclick={onsave} data-library-save><Bookmark size={14} aria-hidden="true" />{t('Keep this session')}</button>{/if}
    {#if items.length}
      <details class="lm">
        <summary>{t('Manage the library')}</summary>
        <ul class="ll">
          {#each items as e (e.id)}
            <li><input class="inp" value={e.name} maxlength="60" aria-label={t('Name')} onchange={(ev) => onrename(e.id, ev.currentTarget.value)} data-library-name={e.id} /><button type="button" class="btn btn-link sm" aria-label={t('Remove')} onclick={() => ondelete(e.id)} data-library-delete={e.id}><X size={14} aria-hidden="true" /></button></li>
          {/each}
        </ul>
      </details>
    {/if}
  </div>
{/if}

<style>
  .lb { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
  .lh { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .lc { display: flex; flex-wrap: wrap; gap: 6px; }
  .lm { font-size: var(--fs-small); width: 100%; }
  .ll { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .ll li { display: flex; gap: 6px; align-items: center; }
  .ll .inp { flex: 1; min-width: 0; }
</style>
