<script>
  /**
   * «Art der Sportart» (Noah 27.11.2026 «3b a»): one window for all sports. Every sport in a row with the kinds as buttons; a tap sets the kind,
   * a tap on the chosen one takes it back. It saves at once (nothing to confirm), «Fertig» closes. The kinds are a list of «Listen und Typen».
   * acts: the sports (flowActs); onclose().
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { saveAct } from '../flowdb.js';
  import { normAct } from '../flow.js';
  import { actName } from './ui.svelte.js';
  import { artOptions, artOf } from './arten.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { acts = [], onclose } = $props();
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const list = $derived(acts.map(normAct).filter((a) => !a.paused).sort((a, b) => a.order - b.order));
  const kinds = $derived(artOptions());
  const choose = (a, key) => saveAct(db, { ...a, art: artOf(a) === key ? null : key });
</script>

<dialog class="sheet vdlg art" bind:this={dialog} use:backClose {onclose} aria-labelledby="art-h" data-art-sheet>
  <div class="vd-head">
    <div class="vd-t"><h2 id="art-h">{t('Kind of sport')}</h2></div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="hint">{t('Choose the kind of each sport. A tap on the chosen kind takes it back. It counts for the mix of your week.')}</p>
  <ul class="rows">
    {#each list as a (a.id)}
      <li data-art-act={a.id}>
        <b>{actName(a)}</b>
        <div class="chips" role="group" aria-label={t('Kind of «{name}»', { name: actName(a) })}>
          {#each kinds as k (k.key)}
            <button type="button" class="chip" aria-pressed={artOf(a) === k.key} data-art-pick={k.key} onclick={() => choose(a, k.key)}>{k.name}</button>
          {/each}
        </div>
      </li>
    {/each}
  </ul>
  <p class="hint"><a href="#/me/lists?sportArts" data-art-kinds onclick={() => dialog.close()}>{t('Change the kinds')} ›</a></p>
  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={() => dialog.close()} data-art-done>{t('Done|sheet')}</button>
  </div>
</dialog>

<style>
  .rows {
    margin: 14px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .rows li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
  }
  .rows b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border: 2px solid var(--ink);
    background: var(--paper-2);
    font-weight: 600;
  }
  .hint {
    margin: 18px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
