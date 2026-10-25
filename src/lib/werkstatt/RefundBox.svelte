<script>
  /**
   * Paket B part 3, UC-174-I2 «Erstattung mitverfolgen»: a workshop visit can carry a refund
   * (warranty, insurance, goodwill). What you paid and what came back stay apart; «Received» says it came.
   * Stored on the visit as visit.refund = { chf, from, got }. Remove asks first and offers Undo.
   */
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { chfOf, refundOf } from './werkstatt.js';

  let { visit, total = null } = $props();
  // svelte-ignore state_referenced_locally
  let rec = $state(visit.refund ?? null);
  let err = $state('');
  const info = $derived(rec ? refundOf({ refund: rec }, total) : null);
  const money = (n) => n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function put(next) {
    rec = next;
    await db.visits.update(visit.id, { refund: next ? $state.snapshot(next) : null });
  }
  function setChf(text) {
    const n = chfOf(text);
    if (n == null) return (err = t('Type the francs as a number, e.g. 80.'));
    err = '';
    put({ ...rec, chf: n });
  }
  async function remove() {
    if ((await askDelete({ title: t('Remove the refund?'), text: t('The visit stays. You can bring the refund back for 4 seconds afterwards.'), label: t('Remove') })) !== 'delete') return;
    const was = $state.snapshot(rec);
    await deleteWithUndo({ run: () => put(null), undo: () => put(was), text: t('Refund removed.'), name: t('Refund') });
  }
</script>

<section class="rf" data-refund>
  <h3>{t('Refund')}</h3>
  {#if !rec}
    <p class="rf-hint">{t('Warranty, insurance or goodwill pays something back? Note it here, apart from what you paid.')}</p>
    <button type="button" class="link" onclick={() => put({ chf: null, from: '', got: false })} data-refund-add>{t('Add a refund')}</button>
  {:else}
    <div class="rf-row">
      <label><span>{t('CHF back')}</span><input class="inp num" type="text" inputmode="decimal" maxlength="10" value={rec.chf ?? ''} onchange={(e) => setChf(e.currentTarget.value)} data-refund-chf /></label>
      <label class="grow"><span>{t('From whom')}</span><input class="inp" type="text" maxlength="60" placeholder={t('e.g. insurance')} value={rec.from ?? ''} onchange={(e) => put({ ...rec, from: e.currentTarget.value.trim() })} data-refund-from /></label>
    </div>
    <label class="rf-got"><input type="checkbox" checked={!!rec.got} onchange={(e) => put({ ...rec, got: e.currentTarget.checked })} data-refund-got /><span>{t('Received')}</span></label>
    {#if err}<p class="rf-err" role="alert">{err}</p>{/if}
    {#if info}
      <p class="rf-sum num" data-refund-sum>
        {#if info.open}{t('Still open: CHF {chf}', { chf: money(info.chf) })}{:else}{t('Came back: CHF {chf}', { chf: money(info.chf) })}{/if}{#if info.net != null && info.got}{' · '}{t('Your own cost: CHF {chf}', { chf: money(info.net) })}{/if}
      </p>
    {/if}
    <button type="button" class="link" onclick={remove}>{t('Remove the refund')}</button>
  {/if}
</section>

<style>
  .rf {
    margin: 4px 0 0;
  }
  h3 {
    margin: 16px 0 6px;
    font-size: var(--fs-body);
  }
  .rf-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  .rf-row label {
    display: grid;
    gap: 2px;
    font-size: var(--fs-small);
  }
  .rf-row .inp {
    width: 110px;
  }
  .rf-row .grow {
    flex: 1 1 140px;
  }
  .rf-row .grow .inp {
    width: 100%;
    box-sizing: border-box;
  }
  .rf-got {
    display: flex;
    gap: 10px;
    align-items: center;
    margin: 8px 0 0;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .rf-got input {
    width: 20px;
    height: 20px;
    margin: 0;
  }
  .rf-hint,
  .rf-sum,
  .rf-err {
    margin: 4px 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .rf-err {
    color: var(--bad);
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    min-height: 44px;
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
