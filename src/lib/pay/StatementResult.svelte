<script>
  /**
   * «Kontoauszug geprüft» (mockup QR3, Noah 14.10.2026 04:00 «a»; 03:39 «3a oder b möglich»):
   * the recognised payments are marked paid right away; for a payment without reference the app
   * suggests the open invoice with the same amount: «Ja, zuordnen», «Selbst wählen» or «Nein».
   * «Rückgängig» opens everything this check marked again.
   */
  import { untrack } from 'svelte';
  import { t, tn, dateOf } from '../i18n.svelte.js';
  import { Check, RotateCcw } from '@lucide/svelte';
  import { matchPayments } from './camt.js';
  import { markManyPaid, markManyOpen, writeReminder } from './invoices.js';
  import { formatAmount } from './qrbill.js';

  /** payments: from readCamt; invoices: the list now; onchange(): reload the list; ondone(): close */
  let { payments, invoices, onchange, ondone } = $props();

  // Match once, on the list as it was when the file came in.
  const first = untrack(() => matchPayments(payments, invoices));
  let found = $state(first.found);
  let unclear = $state(first.unclear.map((u) => ({ ...u, state: 'ask', choice: u.suggest.id })));
  const ignored = first.ignored;
  let marked = $state([]); // ids this check marked paid
  let undone = $state(false);

  // Apply the recognised ones once, when the result shows.
  markManyPaid(
    first.found.map((f) => f.inv.id),
    'statement',
  ).then(async (changed) => {
    marked = changed;
    await writeReminder({ lastCheck: new Date().toISOString() });
    onchange?.();
  });

  const openOnes = $derived(invoices.filter((x) => x.status === 'open' && !marked.includes(x.id)));

  async function assign(u, id) {
    const changed = await markManyPaid([id], 'statement');
    marked = [...marked, ...changed];
    u.state = 'done';
    u.assigned = invoices.find((x) => x.id === id);
    onchange?.();
  }
  async function undo() {
    await markManyOpen(marked);
    marked = [];
    undone = true;
    onchange?.();
  }
</script>

<section aria-label={t('Bank statement checked')}>
  <p class="st-res">
    <Check size={18} aria-hidden="true" />
    <span><b>{tn(found.length, '{n} payment recognised', '{n} payments recognised')}</b>{#if unclear.length}, {tn(unclear.length, '{n} is unclear.', '{n} are unclear.')}{:else}.{/if}</span>
  </p>
  {#if found.length || unclear.length}
    <ul class="card ich-list st-list">
      {#each found as f (f.inv.id)}
        <li class="st-row">
          <span class="st-m"><b>{f.inv.name} · {formatAmount(f.pay.amount)} CHF</b><small>{f.how === 'ref' ? t('Reference matches') : t('Invoice number in the message')} · {t('received {date}', { date: dateOf(f.pay.date) })}</small></span>
          <span class="st-ok">{undone ? t('open again') : t('marked as paid')}</span>
        </li>
      {/each}
      {#each unclear as u, i (i)}
        <li class="st-row st-ask">
          <span class="st-m">
            <b>{u.pay.from || t('Unknown')} · {formatAmount(u.pay.amount)} CHF</b>
            {#if u.state === 'done'}
              <small>{t('Assigned to {name}, {purpose}', { name: u.assigned?.name ?? '', purpose: u.assigned?.purpose ?? '' })}</small>
            {:else if u.state === 'no'}
              <small>{t('Left as it is.')}</small>
            {:else}
              <small>{t('No reference · amount matches: {purpose}, {name}?', { purpose: u.suggest.purpose, name: u.suggest.name })}</small>
            {/if}
          </span>
          {#if u.state === 'ask'}
            <span class="st-acts">
              <button class="btn sm" type="button" onclick={() => assign(u, u.suggest.id)}>{t('Yes, assign')}</button>
              <button class="btn sm" type="button" onclick={() => (u.state = 'pick')}>{t('Choose myself')}</button>
              <button class="btn sm" type="button" onclick={() => (u.state = 'no')}>{t('No|answer')}</button>
            </span>
          {:else if u.state === 'pick'}
            <span class="st-acts">
              <label class="st-pick"><span class="lbl">{t('Which invoice?')}</span>
                <select class="sel" bind:value={u.choice}>
                  {#each openOnes as o (o.id)}<option value={o.id}>{o.name} · {o.purpose} · {formatAmount(o.amount)} CHF</option>{/each}
                </select>
              </label>
              <button class="btn sm hi" type="button" disabled={!u.choice} onclick={() => assign(u, u.choice)}>{t('Assign')}</button>
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  <div class="st-btns">
    {#if marked.length}<button class="btn" type="button" onclick={undo}><RotateCcw size={18} aria-hidden="true" />{t('Undo')}</button>{/if}
    <button class="btn" type="button" onclick={() => ondone?.()}>{t('To the invoices')}</button>
  </div>
  <p class="ich-fine">{t('The file stays only on this device. The app ignores the other bookings in the statement.')}{#if ignored}{' '}({tn(ignored, '{n} booking ignored', '{n} bookings ignored')}){/if}</p>
</section>

<style>
  .st-res {
    display: flex;
    gap: 8px;
    align-items: center;
    background: var(--ok-soft);
    border-radius: 14px;
    padding: 12px 16px;
    margin: 0 0 12px;
  }
  .st-list {
    max-width: 760px;
  }
  .st-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 12px;
    align-items: center;
    padding: 12px 16px;
  }
  .st-m {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .st-m b {
    font-weight: 600;
  }
  .st-m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .st-ok {
    color: var(--ok);
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .st-ask {
    background: var(--warn-soft);
  }
  .st-acts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: end;
  }
  .st-pick {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .st-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 14px 0 0;
  }
  @media (max-width: 600px) {
    .st-row {
      grid-template-columns: 1fr;
    }
  }
</style>
