<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «9», mockup G10): split costs. Camp, food, ferry: everyone
   * writes what they paid and for whom (everyone, or some). At the end it says who pays whom how much, with
   * as few payments as possible (fair to the cent). The one who pays taps «Done»; «Copy text» puts the amount
   * into a message (e.g. for TWINT). Your own expenses and payments you change and delete (asked first, with Undo).
   * rows: memberRows with .part; mine: my part; me: my member id; onpart(patch).
   */
  import { Plus, Pencil, Trash2, Check, Copy } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { settle, chf, centsOf, newPart, COSTS_MAX } from './event.js';
  import './event.css';

  let { rows = [], mine = {}, me = null, title = '', onpart = null, canSend = true } = $props();
  const s = $derived(settle(rows));
  const nameOf = (m) => (m === me ? t('you') : rows.find((r) => r.m === m)?.name || t('Without a name'));
  const forText = (c) => (!c.for ? t('for everyone ({n})', { n: rows.length }) : t('for {names}', { names: c.for.map(nameOf).join(', ') }));
  const costs = $derived(mine?.costs ?? []);
  const paid = $derived(mine?.paid ?? []);

  let open = $state(false);
  let editing = $state(null);
  let what = $state('');
  let amount = $state('');
  let forAll = $state(true);
  let picked = $state([]);
  let err = $state('');
  function start(c = null) {
    editing = c?.id ?? null;
    what = c?.what ?? '';
    amount = c ? (c.cents / 100).toFixed(2) : '';
    forAll = !c?.for;
    picked = c?.for ? [...c.for] : rows.map((r) => r.m);
    err = '';
    open = true;
  }
  const flip = (m) => (picked = picked.includes(m) ? picked.filter((x) => x !== m) : [...picked, m]);
  async function save() {
    const cents = centsOf(amount);
    if (!what.trim()) return (err = t('Write what it was for.'));
    if (!cents) return (err = t('Write the amount, e.g. 48 or 12.50.'));
    if (!forAll && !picked.length) return (err = t('Choose for whom.'));
    const c = { id: editing ?? newPart(), what: what.trim().slice(0, 40), cents, for: forAll ? null : picked };
    await onpart?.({ costs: editing ? costs.map((x) => (x.id === editing ? c : x)) : [...costs, c].slice(-COSTS_MAX) });
    open = false;
  }
  async function remove(c) {
    const a = await askDelete({ title: t('Delete «{name}»?', { name: c.what }), text: t('The expense is gone for the whole group, and the sums are new.') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: c.what,
      text: t('«{name}» deleted.', { name: c.what }),
      run: async () => {
        const before = costs;
        await onpart?.({ costs: costs.filter((x) => x.id !== c.id) });
        return before;
      },
      undo: (before) => onpart?.({ costs: before }),
    });
  }
  async function done(x) {
    await onpart?.({ paid: [...paid, { to: x.to, cents: x.cents }] });
  }
  async function unpay(p, i) {
    const label = `${chf(p.cents)} → ${nameOf(p.to)}`;
    const a = await askDelete({ title: t('Delete the payment {what}?', { what: label }), text: t('Then the sum is open again.') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: label,
      text: t('«{name}» deleted.', { name: label }),
      run: async () => {
        const before = paid;
        await onpart?.({ paid: paid.filter((_, k) => k !== i) });
        return before;
      },
      undo: (before) => onpart?.({ paid: before }),
    });
  }
  let copied = $state('');
  async function copyText(x) {
    const text = t('Hi {name}, here are {amount} for {what}.', { name: nameOf(x.to), amount: chf(x.cents), what: title || t('the group ride') });
    try {
      await navigator.clipboard.writeText(text);
      copied = `${x.from}-${x.to}`;
      setTimeout(() => (copied = ''), 2500);
    } catch {
      /* no clipboard: nothing */
    }
  }
</script>

<section class="card ev-box" aria-labelledby="ec-h" data-event-costs>
  <h2 id="ec-h">{t('Split costs')}</h2>
  <p class="ev-muted">{t('Camp, food, ferry: write who paid. At the end it says who owes whom how much.')}</p>
  {#if s.expenses.length}
    <h3>{t('Expenses')}</h3>
    <ul class="ev-list">
      {#each s.expenses as c (`${c.m}-${c.id}`)}
        <li data-event-cost={c.what}>
          <span class="ev-txt"><b>{c.what}</b><small>{chf(c.cents)} · {c.m === me ? t('paid by you') : t('paid by {name}', { name: c.by || t('Without a name') })} · {forText(c)}</small></span>
          {#if c.m === me}
            <span class="ev-acts">
              <button type="button" class="btn sm" onclick={() => start(c)} aria-label={t('Change «{name}»', { name: c.what })} data-event-cost-edit><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" class="btn sm" onclick={() => remove(c)} aria-label={t('Delete «{name}»', { name: c.what })} data-event-cost-del><Trash2 size={16} aria-hidden="true" /></button>
            </span>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="ev-strong" data-event-cost-total>{t('Total {sum}.', { sum: chf(s.total) })}</p>
    <h3>{t('Who pays whom')}</h3>
    {#if s.transfers.length}
      <ul class="ev-list" data-event-transfers>
        {#each s.transfers as x (`${x.from}-${x.to}`)}
          <li data-event-transfer>
            <span class="ev-txt"><b>{x.from === me ? t('You pay {name}', { name: nameOf(x.to) }) : x.to === me ? t('{name} pays you', { name: nameOf(x.from) }) : t('{from} pays {to}', { from: nameOf(x.from), to: nameOf(x.to) })}</b><small>{chf(x.cents)}</small></span>
            {#if x.from === me}
              <span class="ev-acts">
                <button type="button" class="btn sm" onclick={() => copyText(x)}><Copy size={16} aria-hidden="true" />{copied === `${x.from}-${x.to}` ? t('Copied') : t('Copy text')}</button>
                <button type="button" class="btn sm hi" onclick={() => done(x)} disabled={!canSend} data-event-transfer-done><Check size={16} aria-hidden="true" />{t('Done')}</button>
              </span>
            {/if}
          </li>
        {/each}
      </ul>
      <p class="ev-muted">{t('As few payments as possible. The one who pays taps «Done».')}</p>
    {:else}
      <p class="ev-muted" data-event-settled>{t('All settled.')}</p>
    {/if}
  {/if}
  {#if paid.length}
    <h3>{t('Your payments')}</h3>
    <ul class="ev-list">
      {#each paid as p, i (i)}
        <li>
          <span class="ev-txt"><b>{chf(p.cents)}</b><small>{t('to {name}', { name: nameOf(p.to) })}</small></span>
          <button type="button" class="btn sm" onclick={() => unpay(p, i)} aria-label={t('Delete')}><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if open}
    <div class="ev-box" data-event-cost-form>
      <div class="ev-row2">
        <label class="ev-fld"><span>{t('What for?')}</span><input type="text" bind:value={what} maxlength="40" placeholder={t('e.g. camp site')} data-event-cost-what /></label>
        <label class="ev-fld"><span>{t('Amount in CHF')}</span><input type="text" inputmode="decimal" bind:value={amount} placeholder="48.00" data-event-cost-amount /></label>
      </div>
      <div class="ev-chips" role="group" aria-label={t('For whom?')}>
        <button type="button" class="ev-chip" aria-pressed={forAll} onclick={() => (forAll = true)} data-event-cost-forall>{t('For everyone')}</button>
        <button type="button" class="ev-chip" aria-pressed={!forAll} onclick={() => (forAll = false)} data-event-cost-forsome>{t('For some')}</button>
      </div>
      {#if !forAll}
        <div class="ev-chips">
          {#each rows as r (r.m)}<button type="button" class="ev-chip" aria-pressed={picked.includes(r.m)} onclick={() => flip(r.m)}>{r.m === me ? t('you') : r.name || t('Without a name')}</button>{/each}
        </div>
      {/if}
      {#if err}<p class="rc-warn" role="alert">{err}</p>{/if}
      <div class="ev-acts">
        <button type="button" class="btn hi" onclick={save} disabled={!canSend} data-event-cost-save>{t('Save')}</button>
        <button type="button" class="btn" onclick={() => (open = false)}>{t('Cancel')}</button>
      </div>
    </div>
  {:else}
    <div><button type="button" class="btn" onclick={() => start()} disabled={!canSend} data-event-cost-add><Plus size={18} aria-hidden="true" />{t('Add an expense')}</button></div>
  {/if}
</section>
