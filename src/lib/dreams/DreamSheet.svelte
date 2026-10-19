<script>
  /**
   * Paket N #32/#287 (Noah 19.10.2026 «1a 2b»): one dream tour, open. Title, kind of tour, the months it
   * fits (the kind's suggestion until you change one; «Back to the suggestion»), days, a note and a link.
   * Changes are saved when the window closes. «Plan the tour» hands over to the page (PlanSheet).
   */
  import { backClose } from '../ui/backclose.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { MONTHS, seasonText, monthsOf, toggleMonth, resetMonths, suggested, kindName } from '../dreams.js';
  import { t } from '../i18n.svelte.js';
  import { X, Route, RotateCcw } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { dream, kinds = [], onchange, onremove, onplan, onclose } = $props();

  let dialog;
  // svelte-ignore state_referenced_locally
  let d = $state(structuredClone($state.snapshot(dream)));
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const months = $derived(monthsOf(d, kinds));
  async function closeIt() {
    const v = $state.snapshot(d);
    if (!v.title?.trim()) v.title = dream.title;
    if (JSON.stringify(v) !== JSON.stringify(dream)) await onchange?.(v);
    dialog.close();
  }
  async function remove() {
    if ((await askDelete({ title: t('Delete the dream "{text}"?', { text: dream.title }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    if (await deleteWithUndo({ run: () => onremove?.(dream.id), undo: (snap) => onchange?.(dream, snap), text: t('"{name}" deleted.', { name: dream.title }), name: dream.title })) dialog.close();
  }
  async function plan() {
    await closeIt();
    onplan?.($state.snapshot(d));
  }
</script>

<dialog use:backClose class="sheet vdlg dsheet" bind:this={dialog} {onclose} oncancel={(e) => (e.preventDefault(), closeIt())} aria-labelledby="dream-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="dream-h" class="title">{d.title || t('Dream')}</h2>
      <p class="vd-sub">{kindName(kinds, d.kind, t)} · {seasonText(months, (m) => t(MONTHS[m - 1]))}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={closeIt}><X size={20} aria-hidden="true" /></button>
  </div>
  <label class="fld"><span class="lbl">{t('Title')}</span><input class="inp" type="text" bind:value={d.title} maxlength="80" /></label>

  <p class="lbl">{t('Kind of tour')}</p>
  <div class="vd-chips" role="group" aria-label={t('Kind of tour')}>
    {#each kinds as k (k.key)}<button type="button" class="vd-chip" aria-pressed={d.kind === k.key} onclick={() => (d.kind = k.key)}>{kindName(kinds, k.key, t)}</button>{/each}
  </div>

  <p class="lbl">{t('Fits in')} <small class="q">· {suggested(d) ? t('suggested from the kind of tour') : t('chosen by you')}</small></p>
  <div class="months" role="group" aria-label={t('Fits in')} data-months>
    {#each MONTHS as m, i (m)}<button type="button" class="vd-chip mo" aria-pressed={months.includes(i + 1)} onclick={() => (d = toggleMonth(d, i + 1, kinds))}>{t(m)}</button>{/each}
  </div>
  {#if !suggested(d)}<button type="button" class="btn btn-link" onclick={() => (d = resetMonths(d))}><RotateCcw size={14} aria-hidden="true" />{t('Back to the suggestion')}</button>{/if}

  <div class="two">
    <label class="fld"><span class="lbl">{t('Days')}</span><input class="inp num" type="number" min="1" max="60" bind:value={d.days} /></label>
    <label class="fld"><span class="lbl">{t('Link')} <small class="q">· {t('optional')}</small></span><input class="inp" type="url" bind:value={d.url} placeholder="https://…" /></label>
  </div>
  <label class="fld"><span class="lbl">{t('Note')} <small class="q">· {t('optional')}</small></span><textarea class="inp" rows="2" bind:value={d.note}></textarea></label>

  <div class="vd-foot">
    <button type="button" class="btn" onclick={remove}>{t('Delete')}</button>
    {#if !d.tripId}<button type="button" class="btn" onclick={plan}><Route size={16} aria-hidden="true" />{t('Plan the tour')}</button>{/if}
    <button type="button" class="btn hi" onclick={closeIt}>{t('Done')}</button>
  </div>
</dialog>

<style>
  .months {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
    margin: 0 0 8px;
  }
  .mo {
    justify-content: center;
    min-width: 0;
    padding-inline: 4px;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10em, 1fr));
    gap: 0 12px;
  }
  .fld {
    display: grid;
    gap: 4px;
    margin: 0 0 12px;
  }
  .q {
    color: var(--ink-3);
    font-weight: 400;
  }
</style>
