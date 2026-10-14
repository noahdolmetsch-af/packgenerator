<script>
  /**
   * «Noch zu entscheiden»: the suggestions from the trip, the weather and the material rules; nothing
   * goes on the list until Noah confirms.
   * v0.106.0 Design-Refresh P5 (T9, approved 12.10.2026 «Runde 20 freigegeben»): the suggestions as one
   * light list (check box, what and why, a small tag «freiwillig», «Alternative» or «Menge prüfen»),
   * «Alle · Keine · Auswahl übernehmen» under it, «Material bereits auf deiner Liste» below, and on the
   * right «Woher die Vorschläge kommen» (trip weather, days and hours, the rules) with «Tourbedingungen
   * ändern». Same rows, same choices, same saving as before.
   */
  import { CloudSun, Tent, Package, Check, ChevronRight, CircleAlert, TriangleAlert } from '@lucide/svelte';
  import Empty from '../ui/Empty.svelte';
  import { reviewRows } from '../preparation.js';
  import { amountChecks } from '../reasons.js';
  import { formatWeight } from '../gear.js';
  import { RAIN } from '../trips.js';
  import { nameOf, t, tn, num } from '../i18n.svelte.js';
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
  const weightOf = (item, qty) => (item?.weightG == null ? t('not weighed') : formatWeight(item.weightG * qty));
  const tagOf = (row, item) => (item?.perHours && item?.note ? { text: t('Check amount'), warn: true } : row.replaces ? { text: t('Alternative|tag') } : row.optional ? { text: t('optional') } : null);
  // «Woher die Vorschläge kommen»: what the trip says today
  const wxText = $derived(trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max}° · ${t(RAIN[trip.wx.rain ?? 'none'])}` : t('No weather set'));
  const days = $derived(Math.max(1, Number(trip.days) || 1));
  async function accept() {
    saving = true; error = '';
    try { await onapply($state.snapshot(choices)); } catch { error = t('Could not save. Your selection is still here. Please try again.'); }
    finally { saving = false; }
  }
</script>
<section class="review" aria-labelledby="review-h">
  <div class="rcols">
    <div class="rmain">
      <div class="rsec">
        <h2 id="review-h" class="sh">{t('Still to decide')}</h2>
        <p class="ssub">{t('Suggestions based on your trip, weather and material rules. You decide what goes on the list.')}</p>
        {#if !rows.length && !checks.length}
          <Empty icon={Check} level={3} title={t('No open material suggestions')} text={t('Check your trip conditions or continue to your packing list.')} />
        {:else}
          <div class="card list">
            {#each rows as row (row.slot)}
              {@const item = byId[row.id]}
              {@const tag = tagOf(row, byId[row.slot])}
              <div class="decision" class:decided={row.selected}>
                <input class="ck" type="checkbox" checked={row.selected} aria-label={t('Include {name}', { name: nameOf(byId[row.slot]) })} onchange={(e) => update(row.slot, { selected: e.currentTarget.checked })} />
                <div class="decision-reason">
                  <h3>{nameOf(byId[row.slot])}</h3>
                  <p>{row.why}{row.replaces ? ` · ${t('instead of {name}', { name: nameOf(byId[row.replaces]) })}` : ''} · <span class="num">{weightOf(item, row.qty)}</span></p>
                  {#if row.alts.length || item?.perHours || row.qty > 1}
                    <div class="decision-choice">
                      {#if row.alts.length}<select class="sel" aria-label={t('Alternative for {name}', { name: nameOf(byId[row.slot]) })} value={row.id} onchange={(e) => update(row.slot, { id: e.currentTarget.value, selected: true })}>{#each row.alts as id}<option value={id}>{nameOf(byId[id])}</option>{/each}</select>{/if}
                      {#if item?.perHours || row.qty > 1}
                        <label class="review-qty"><span>{t('Amount')}</span><input class="inp num" type="number" inputmode="numeric" min="1" max={item?.maxQty || 20} value={row.qty} aria-label={t('Amount for {name}', { name: nameOf(item) })} onchange={(e) => update(row.slot, { qty: e.currentTarget.value, selected: true })} /></label>
                      {/if}
                    </div>
                  {/if}
                  {#if item?.perHours && item?.note}
                    <div class="quantity-review">
                      <CircleAlert size={18} aria-hidden="true" /><span>{t('Check amount rule and material note')}</span><button type="button" class="tp-link" aria-expanded={inspected === row.slot} onclick={() => inspected = inspected === row.slot ? null : row.slot}>{t('Check|review')}</button>
                      {#if inspected === row.slot}<div class="quantity-note"><p>{t('Rule: one piece per {hours} h. Suggested for this trip: {qty}.', { hours: item.perHours, qty: row.qty })}</p><p><strong>{t('Material note')}:</strong> {item.note}</p><p>{t('The app does not interpret free text. Confirm the amount above.')}</p></div>{/if}
                    </div>
                  {/if}
                </div>
                {#if tag}<i class="pill tag" class:warn={tag.warn}>{tag.text}</i>{/if}
              </div>
            {/each}
            {#each checks as c (c.id)}
              {@const item = byId[c.id]}
              <div class="decision info">
                <span class="ck ic" aria-hidden="true"><CircleAlert size={18} /></span>
                <div class="decision-reason">
                  <h3>{nameOf(item)}</h3><p>{c.amount.text}</p>
                  <div class="quantity-review">
                    <CircleAlert size={18} aria-hidden="true" /><span>{c.note ? t('Check amount rule and material note') : t('Check the amount: the maximum is below the need')}</span><button type="button" class="tp-link" aria-expanded={inspected === c.id} onclick={() => inspected = inspected === c.id ? null : c.id}>{t('Check|review')}</button>
                    {#if inspected === c.id}<div class="quantity-note"><p>{t('Rule: one piece per {hours} h. Need for this trip: {need}. On your list: {qty}.', { hours: item.perHours, need: c.amount.need, qty: c.amount.qty })}</p>{#if c.note}<p><strong>{t('Material note')}:</strong> {c.note}</p>{/if}<p>{t('Change the amount in the packing list (tap the row).')}</p></div>{/if}
                  </div>
                </div>
                <i class="pill tag warn">{t('Check amount')}</i>
              </div>
            {/each}
          </div>
        {/if}
        {#if error}<p class="calm-error" role="alert">{error}</p>{/if}
        <footer class="review-footer">
          <p class="cnt">{rows.length ? t('{n} selected. Changes are saved only when you confirm.', { n: count }) : t('Your existing packing list stays available.')}</p>
          <div class="acts">
            <button type="button" class="btn btn-link" onclick={oncancel} disabled={saving}>{t('Back')}</button>
            {#if rows.length > 1}
              <button type="button" class="btn btn-link" disabled={count === rows.length} onclick={() => setAll(true)}>{t('All|select')}</button>
              <button type="button" class="btn btn-link" disabled={count === 0} onclick={() => setAll(false)}>{t('None|select')}</button>
            {/if}
            <button type="button" class="btn hi" onclick={accept} disabled={saving}>{saving ? t('Saving…') : rows.length ? t('Apply selection') : t('Continue to packing list')}</button>
          </div>
        </footer>
      </div>

      <details class="rsec basic-equipment">
        <summary><span class="bt"><b class="sh">{t('Material already on your list')}</b><small>{tn(trip.entries.length, '{n} item', '{n} items')} · {t('Existing items stay on this trip')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
        <ul class="card done">{#each trip.entries as e (e.itemId)}<li><span class="ok" aria-hidden="true"><Check size={16} /></span><span class="nm">{byId[e.itemId] ? nameOf(byId[e.itemId]) : e.itemId}</span><small class="num">× {e.qty || 1}</small></li>{:else}<li>{t('Your list is still empty.')}</li>{/each}</ul>
      </details>
    </div>

    <aside class="rside" aria-labelledby="src-h">
      <div class="shead"><h2 id="src-h" class="sh">{t('Where the suggestions come from')}</h2><button type="button" class="tp-link" onclick={onconditions}>{t('Edit trip conditions')}<ChevronRight size={16} aria-hidden="true" /></button></div>
      <ul class="card src">
        <li><span class="ic" aria-hidden="true"><CloudSun size={18} /></span><span class="bt"><b>{t('Trip weather|source')}</b><small class="num">{wxText}</small></span></li>
        <li><span class="ic" aria-hidden="true"><Tent size={18} /></span><span class="bt"><b>{tn(days, '{n} day', '{n} days')}</b><small class="num">{trip.hours ? t('{n} h riding a day', { n: num(trip.hours) }) : t('No riding hours set')}</small></span></li>
        <li><span class="ic" aria-hidden="true"><Package size={18} /></span><span class="bt"><b>{t('Material rules')}</b><small>{tn(rows.length + checks.length, '{n} suggestion', '{n} suggestions')}</small></span></li>
      </ul>
      <p class="note"><TriangleAlert size={16} aria-hidden="true" /><span>{t('The app does not interpret free text. Confirm the amount above.')}</span></p>
    </aside>
  </div>
</section>

<style>
  .rcols { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
  @media (min-width: 900px) { .rcols { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); align-items: start; } }
  .rmain, .rside { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-content: start; min-width: 0; }
  .rside { gap: 0; }
  .sh { margin: 0; font: 600 var(--fs-sub) / 1.3 var(--font-body); color: var(--ink); overflow-wrap: break-word; }
  .ssub { margin: 2px 0 8px; color: var(--ink-2); font-size: var(--fs-small); }
  .shead { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0 12px; margin-bottom: 4px; }
  .shead .tp-link { font-size: var(--fs-small); text-decoration: none; }
  .list { padding-top: 4px; padding-bottom: 4px; }
  .decision { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; }
  .decision + .decision { border-top: 1px solid var(--line); }
  .ck { flex: none; width: 22px; height: 22px; margin: 2px 0 0; accent-color: var(--hi); }
  .ck.ic { display: grid; place-items: center; color: var(--warn); }
  .decision-reason { flex: 1; min-width: 0; }
  .decision-reason h3 { margin: 0; font: 500 var(--fs-body) / 1.3 var(--font-body); overflow-wrap: break-word; }
  .decision-reason p { margin: 2px 0 0; color: var(--ink-2); font-size: var(--fs-small); overflow-wrap: break-word; }
  .tag { flex: none; margin-top: 2px; font-style: normal; background: none; color: var(--ink); }
  .tag.warn { background: var(--warn-soft); color: var(--warn); }
  .decision-choice { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: 8px; }
  .decision-choice .sel { flex: 1 1 14em; width: auto; }
  .review-qty { display: flex; align-items: center; gap: 6px; font-size: var(--fs-small); color: var(--ink-2); }
  .review-qty .inp { width: 72px; }
  .quantity-review { display: flex; flex-wrap: wrap; align-items: center; gap: 0 10px; margin-top: 8px; padding: 2px 12px; border-radius: var(--r-ctl); background: var(--warn-soft); font-size: var(--fs-small); }
  .quantity-review > :global(svg) { flex: none; color: var(--warn); }
  .quantity-review > span { flex: 1 1 12em; min-width: 0; }
  .quantity-review .tp-link { font-size: var(--fs-small); }
  .quantity-note { width: 100%; }
  .quantity-note p { margin: 4px 0 8px; }
  .review-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; margin-top: 10px; }
  .cnt { flex: 1 1 16em; margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .acts { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 4px; }
  .acts .btn.hi { margin-left: 8px; }
  @media (max-width: 719px) { .acts { width: 100%; } .acts .btn.hi { flex: 1 1 100%; margin: 4px 0 0; } }
  .basic-equipment > summary { display: flex; align-items: center; gap: 12px; min-height: 48px; cursor: pointer; list-style: none; }
  .basic-equipment > summary::-webkit-details-marker { display: none; }
  .basic-equipment :global(.chev) { flex: none; color: var(--ink-3); transition: transform 0.15s; }
  .basic-equipment[open] :global(.chev) { transform: rotate(90deg); }
  .bt { flex: 1; min-width: 0; overflow-wrap: break-word; }
  .bt b { display: block; }
  .bt small { display: block; color: var(--ink-2); font-size: var(--fs-small); }
  .src .bt b { font-weight: 500; font-size: var(--fs-body); }
  .done, .src { list-style: none; margin: 8px 0 0; padding-top: 4px; padding-bottom: 4px; }
  .src { margin: 0; }
  .done li, .src li { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 6px 0; }
  .done li + li, .src li + li { border-top: 1px solid var(--line); }
  .done .nm { flex: 1; min-width: 0; overflow-wrap: break-word; }
  .done small { color: var(--ink-2); }
  .ok { display: grid; flex: none; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: var(--paper-2); color: var(--ink-2); }
  .ic { display: grid; flex: none; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: var(--paper-2); color: var(--ink-2); }
  .note { display: flex; align-items: flex-start; gap: 10px; margin: 14px 0 0; padding: 0 12px; color: var(--ink-2); font-size: var(--fs-small); }
  .note :global(svg) { flex: none; margin-top: 2px; }
  .calm-error { margin: 12px 0 0; color: var(--bad); background: var(--warn-soft); padding: 12px; border-radius: var(--r-ctl); }
</style>
