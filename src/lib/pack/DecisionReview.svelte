<script>
  import { Shirt, CloudRain, Utensils, Backpack, Check, ChevronDown, CircleAlert } from '@lucide/svelte';
  import { reviewRows } from '../preparation.js';
  import { amountChecks } from '../reasons.js';
  import { formatWeight } from '../gear.js';
  import { nameOf, t, tn } from '../i18n.svelte.js';
  let { trip, items, onapply, oncancel, onconditions } = $props();
  let choices = $state({});
  let saving = $state(false);
  let error = $state('');
  let inspected = $state(null);
  const rows = $derived(reviewRows(trip, items, choices));
  const byId = $derived(Object.fromEntries(items.map(i => [i.id, i])));
  const count = $derived(rows.filter(r => r.selected).length);
  // v0.27.0 (Noah 1a, PF04): an amount capped by its maximum, or a rule next to a material note, stays
  // visible here as an info row, also when nothing is left to choose.
  const checks = $derived(amountChecks(trip, items, new Set(rows.map(r => r.id))));
  const update = (slot, patch) => choices = { ...choices, [slot]: { ...choices[slot], ...patch } };
  // v0.24.0 (Noah, "select all"): every suggestion on or off in one tap.
  const setAll = (on) => choices = Object.fromEntries(rows.map((r) => [r.slot, { ...choices[r.slot], selected: on }]));
  const iconOf = (item) => item?.perHours ? Utensils : item?.rain ? CloudRain : item?.coldBelow != null ? Shirt : Backpack;
  async function accept() {
    saving = true; error = '';
    try { await onapply($state.snapshot(choices)); } catch { error = t('Could not save. Your selection is still here. Please try again.'); }
    finally { saving = false; }
  }
</script>
<section class="review" aria-labelledby="review-h">
  <div class="review-intro">
    <h2 id="review-h">{t('Still to decide')}</h2>
    <p>{t('Suggestions based on your trip, weather and material rules. You decide what goes on the list.')}</p>
    {#if rows.length > 1}
      <p class="all-row">
        <button class="text-button" disabled={count === rows.length} onclick={() => setAll(true)}>{t('Select all')}</button>
        <button class="text-button" disabled={count === 0} onclick={() => setAll(false)}>{t('Select none')}</button>
      </p>
    {/if}
  </div>
  {#if !rows.length && !checks.length}
    <div class="review-empty"><Check size={24} /><div><h3>{t('No open material suggestions')}</h3><p>{t('Check your trip conditions or continue to your packing list.')}</p><button class="text-button" onclick={onconditions}>{t('Edit trip conditions')}</button></div></div>
  {/if}
  <div class="decision-list">
    {#each rows as row (row.slot)}
      {@const item = byId[row.id]}
      {@const Icon = iconOf(byId[row.slot])}
      <div class="decision" class:decided={row.selected}>
        <Icon size={38} strokeWidth={1.6} />
        <div class="decision-reason"><h3>{nameOf(byId[row.slot])}</h3><p>{row.why}{row.optional ? ` · ${t('optional')}` : ''}{row.replaces ? ` · ${t('instead of {name}', { name: nameOf(byId[row.replaces]) })}` : ''}</p></div>
        <div class="decision-choice">
          <label class="choice-field" class:selected={row.selected}>
            <input type="checkbox" checked={row.selected} aria-label={t('Include {name}', { name: nameOf(byId[row.slot]) })} onchange={(e) => update(row.slot, { selected: e.currentTarget.checked })} />
            {#if row.alts.length}
              <select aria-label={t('Alternative for {name}', { name: nameOf(byId[row.slot]) })} value={row.id} onchange={(e) => update(row.slot, { id: e.currentTarget.value, selected: true })}>{#each row.alts as id}<option value={id}>{nameOf(byId[id])}</option>{/each}</select>
            {:else}<span>{nameOf(item)}</span>{/if}
            <small>{item?.weightG == null ? t('not weighed') : formatWeight(item.weightG * row.qty)}</small>
          </label>
          {#if item?.perHours || row.qty > 1}
            <label class="review-qty"><span>{t('Amount')}</span><input type="number" min="1" max={item?.maxQty || 20} value={row.qty} aria-label={t('Amount for {name}', { name: nameOf(item) })} onchange={(e) => update(row.slot, { qty: e.currentTarget.value, selected: true })} /></label>
          {/if}
        </div>
        {#if item?.perHours && item?.note}
          <div class="quantity-review">
            <CircleAlert size={20} /><span>{t('Check amount rule and material note')}</span><button class="text-button" aria-expanded={inspected === row.slot} onclick={() => inspected = inspected === row.slot ? null : row.slot}>{t('Check|review')}</button>
            {#if inspected === row.slot}<div class="quantity-note"><p>{t('Rule: one piece per {hours} h. Suggested for this trip: {qty}.', { hours: item.perHours, qty: row.qty })}</p><p><strong>{t('Material note')}:</strong> {item.note}</p><p>{t('The app does not interpret free text. Confirm the amount above.')}</p></div>{/if}
          </div>
        {/if}
      </div>
    {/each}
    {#each checks as c (c.id)}
      {@const item = byId[c.id]}
      <div class="decision info">
        <CircleAlert size={38} strokeWidth={1.6} />
        <div class="decision-reason"><h3>{nameOf(item)}</h3><p>{c.amount.text}</p></div>
        <div class="quantity-review">
          <CircleAlert size={20} /><span>{c.note ? t('Check amount rule and material note') : t('Check the amount: the maximum is below the need')}</span><button class="text-button" aria-expanded={inspected === c.id} onclick={() => inspected = inspected === c.id ? null : c.id}>{t('Check|review')}</button>
          {#if inspected === c.id}<div class="quantity-note"><p>{t('Rule: one piece per {hours} h. Need for this trip: {need}. On your list: {qty}.', { hours: item.perHours, need: c.amount.need, qty: c.amount.qty })}</p>{#if c.note}<p><strong>{t('Material note')}:</strong> {c.note}</p>{/if}<p>{t('Change the amount in the packing list (tap the row).')}</p></div>{/if}
        </div>
      </div>
    {/each}
    <details class="basic-equipment">
      <summary><Backpack size={38} strokeWidth={1.6} /><span><strong>{t('Material already on your list')}</strong><small>{tn(trip.entries.length, '{n} item', '{n} items')} · {t('Existing items stay on this trip')}</small></span><span class="basic-link">{t('View selected materials')} <ChevronDown size={20} /></span></summary>
      <ul>{#each trip.entries as e (e.itemId)}<li>{byId[e.itemId] ? nameOf(byId[e.itemId]) : e.itemId}<small>× {e.qty || 1}</small></li>{:else}<li>{t('Your list is still empty.')}</li>{/each}</ul>
    </details>
  </div>
  {#if error}<p class="calm-error" role="alert">{error}</p>{/if}
  <footer class="review-footer"><button class="text-button" onclick={oncancel} disabled={saving}>{t('Back')}</button><div><button class="primary" onclick={accept} disabled={saving}>{saving ? t('Saving…') : rows.length ? t('Apply selection') : t('Continue to packing list')}</button><p>{rows.length ? t('{n} selected. Changes are saved only when you confirm.', { n: count }) : t('Your existing packing list stays available.')}</p></div></footer>
</section>
