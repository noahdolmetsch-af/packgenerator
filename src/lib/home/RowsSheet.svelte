<script>
  /**
   * «Which rows in Up now?» (Noah 05.11.2026 «4a»): the window behind «Choose rows» under «Up now» and under
   * «Customise the start page». One switch for every kind of row that is only a hint (all on at the start), and
   * the list of rows put off with «Later», each with «Show again». Every change is saved at once; closing offers
   * Undo for the whole change. Reminders that protect data or a trip are not in the list.
   */
  import { X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { ROWS_KEY, ROW_KINDS, LATER_DAYS, rowsOf, setKind, showAgain, waiting } from './rows.js';
  import { t, locale } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { today, cfg = null, onclose } = $props();

  const c = $derived(rowsOf(cfg));
  const later = $derived(waiting(cfg, today));
  const dayText = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });

  // svelte-ignore state_referenced_locally
  const before = cfg;
  let changed = false;
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  function save(next) {
    changed = true;
    return db.settings.put({ key: ROWS_KEY, value: $state.snapshot(next) });
  }
  const closed = () => {
    if (changed) offerDone(t('Rows of «Up now» changed.'), () => db.settings.put({ key: ROWS_KEY, value: before }));
    onclose?.();
  };
</script>

<dialog class="sheet vdlg rws" bind:this={dialog} use:backClose onclose={closed} aria-labelledby="rws-h" data-rows-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="rws-h">{t('Which rows in «Up now»?')}</h2>
      <p class="vd-sub">{t('Switch off what you do not want to see. Nothing is deleted, you can switch it on again any time.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <ul class="kinds" data-rows-kinds>
    {#each ROW_KINDS as k (k.kind)}
      <li>
        <label>
          <input type="checkbox" role="switch" checked={!c.off.includes(k.kind)} onchange={(e) => save(setKind(cfg, k.kind, !e.currentTarget.checked))} data-row-kind={k.kind} />
          <span class="nm">{t(k.name)}<small>{t(k.eg)}</small></span>
        </label>
      </li>
    {/each}
  </ul>
  <p class="hint">{t('The backup reminder, care that is due and the questions after a trip always stay: they protect your data and your trips.')}</p>

  <h3>{t('Put off for a week')}</h3>
  {#if later.length}
    <ul class="wait" data-rows-later>
      {#each later as r (r.key)}
        <li>
          <span class="nm">{r.text || r.key}<small>{t('back on {day}', { day: dayText(r.until) })}</small></span>
          <button type="button" class="btn sm" onclick={() => save(showAgain(cfg, r.key))} data-row-again={r.key}>{t('Show again')}</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="hint">{t('Nothing is put off. «Later» on a calm row hides it for {n} days.', { n: LATER_DAYS })}</p>
  {/if}

  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={() => dialog.close()} data-rows-done>{t('Done|customise')}</button>
  </div>
</dialog>

<style>
  h3 {
    margin: 14px 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    min-height: 52px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
  }
  label {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1 1 100%;
    min-height: 44px;
    cursor: pointer;
  }
  .nm {
    flex: 1 1 8rem;
    min-width: 0;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  small {
    display: block;
    font-weight: 400;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 8px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
