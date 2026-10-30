<script>
  /**
   * Velo-Idee 71 «Quittung in Arbeiten aufteilen» (Noah 26.10.2026 «1a 2a»): the window «Quittung
   * aufteilen» of one workshop visit. Left the receipt pages, right every line with its part, its job
   * and the row of the order it belongs to; «Zeile teilen» makes two lines of one, «+ Zeile» adds one,
   * the bin takes one away. Below «Was danach passiert». Nothing is saved before «Zuordnung speichern»;
   * after it a toast offers Undo. The rules are in split.js.
   */
  import { liveQuery } from 'dexie';
  import { X, Split, Plus, Trash2, Check, TriangleAlert, Receipt } from '@lucide/svelte';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { JOB_PARTS, withVisits } from '../workshop.js';
  import { PART, partName } from '../care.js';
  import { orderOf } from '../care/orders.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import Lightbox from '../ui/Lightbox.svelte';
  import { JOBS, blankLine, assigned, linesOf, splitLine, storeLines, splitSummary } from './split.js';
  import '../bikes/velo-dlg.css';

  let { visit, bike, onclose } = $props();
  let dialog;
  $effect(() => {
    dialog.showModal();
  });

  const parts = JOB_PARTS.filter((p) => p.key !== 'other');
  const names = parts.map((p) => ({ key: p.key, words: [p.name, t(p.name), partName({ key: p.key })] }));
  // svelte-ignore state_referenced_locally
  let lines = $state(linesOf(visit, names));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const tasksQ = liveQuery(() => db.maintenance.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  // the stored bike (the caller may pass a view with the visits merged in already)
  // svelte-ignore state_referenced_locally
  const rawQ = liveQuery(() => db.bikes.get(visit.bikeId));
  // the order as it was before this visit: the other visits only, on the day of the visit
  const orderRows = $derived.by(() => {
    const raw = $rawQ;
    if (!raw || !$visitsQ) return [];
    const others = $visitsQ.filter((v) => v.id !== visit.id);
    return orderOf(withVisits(raw, others), $tripsQ ?? [], $tasksQ ?? [], others, visit.date).order?.rows ?? [];
  });
  const sum = $derived(splitSummary(lines, orderRows));
  let page = $state(null);
  const pics = $derived(visit.photos ?? []);
  const chf = (n) => (n == null ? '–' : Number(n).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const pname = (key) => (PART[key] ? partName({ key }) : key);

  const split = (i) => (lines = splitLine(lines, i));
  const add = () => (lines = [...lines, blankLine()]);
  const drop = (i) => (lines = lines.filter((_, n) => n !== i));
  async function save() {
    const before = visit.parts ?? [];
    await db.visits.update(visit.id, { parts: storeLines($state.snapshot(lines)) });
    offerDone(t('Receipt of {date} assigned.', { date: dateOf(visit.date) }), () => db.visits.update(visit.id, { parts: before }));
    dialog.close();
  }
</script>

<dialog use:backClose class="sheet vdlg rsplit" bind:this={dialog} {onclose} aria-labelledby="rs-h" data-receipt-split>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="rs-h">{t('Split the receipt')}</h2>
      <p class="vd-sub">{visit.shop}, {dateOf(visit.date)} · {bike?.name ?? ''}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="lead">{t('Give every line of the receipt a part, a job and your order. Then the km of the parts start anew, and you see what of the order is done.')}</p>

  <div class="cols" class:one={!pics.length}>
    {#if pics.length}
      <section class="rc" aria-labelledby="rs-rc">
        <h3 id="rs-rc"><Receipt size={16} aria-hidden="true" />{t('Receipt')}</h3>
        <div class="pages">
          {#each pics as src, n (n)}
            <button type="button" class="pg" onclick={() => (page = n)} aria-label={t('Open receipt page {n}', { n: n + 1 })}><img {src} alt="" loading="lazy" /></button>
          {/each}
        </div>
      </section>
    {/if}
    <section aria-labelledby="rs-lines">
      <h3 id="rs-lines">{t('Lines|receipt')} <span class="tag" class:ok={sum.total && sum.assigned === sum.total} data-split-count>{t('{n} of {all} assigned', { n: sum.assigned, all: sum.total })}</span></h3>
      <p class="hint">{t('The app suggests, you confirm or change.')}</p>
      <ol class="lines">
        {#each lines as l, i (i)}
          <li class="line" data-split-line={i} data-split-state={assigned(l) ? 'done' : 'open'}>
            <div class="top">
              <span class="st" class:ok={assigned(l)}>{assigned(l) ? t('assigned') : t('open|line')}</span>
              <input class="inp what" aria-label={t('Line {n}', { n: i + 1 })} bind:value={l.what} placeholder={t('e.g. Chain 11-speed')} data-split-what />
              <input class="inp num chf" type="text" inputmode="decimal" aria-label={t('CHF of line {n}', { n: i + 1 })} value={l.chf ?? ''} onchange={(e) => (l.chf = e.currentTarget.value)} data-split-chf />
            </div>
            {#if l.guess}<p class="hint">{t('Suggestion from the word «{word}»', { word: pname(l.part) })}</p>{/if}
            <div class="sels">
              <select class="sel" aria-label={t('Part')} bind:value={l.part} onchange={() => (l.guess = false)} data-split-part>
                <option value="">{t('Choose a part')}</option>
                <option value="other">{t('No part, only cost')}</option>
                {#each parts as p (p.key)}<option value={p.key}>{partName({ key: p.key })}</option>{/each}
              </select>
              <select class="sel" aria-label={t('Job')} bind:value={l.action} data-split-job>
                {#each JOBS as j (j.key)}<option value={j.key}>{t(j.name)}</option>{/each}
              </select>
              <select class="sel" aria-label={t('Order|workshop')} bind:value={l.order} data-split-order>
                <option value={null}>{t('Not in the order')}</option>
                {#each orderRows as r (r.key)}<option value={r.key}>{r.name}</option>{/each}
              </select>
            </div>
            <div class="acts">
              <button type="button" class="lnk" onclick={() => split(i)} data-split-split><Split size={14} aria-hidden="true" />{t('Split the line')}</button>
              <button type="button" class="lnk" onclick={() => drop(i)} aria-label={t('Remove line {n}', { n: i + 1 })} data-split-drop><Trash2 size={14} aria-hidden="true" />{t('Remove')}</button>
            </div>
          </li>
        {:else}
          <li class="hint">{t('No lines yet. Add one per line of the receipt.')}</li>
        {/each}
      </ol>
      <button type="button" class="btn sm" onclick={add} data-split-add><Plus size={14} aria-hidden="true" />{t('Line|receipt')}</button>
    </section>
  </div>

  <section class="after vd-panel" aria-labelledby="rs-after" data-split-after>
    <h3 id="rs-after">{t('What happens then')}</h3>
    {#if sum.starts.length}<p class="ok"><Check size={16} aria-hidden="true" />{t('{parts} start at 0 km from {date}', { parts: sum.starts.map(pname).join(', '), date: dateOf(visit.date) })}</p>{/if}
    {#if sum.order}
      <p class={sum.order.open.length ? 'warn' : 'ok'} data-split-order-sum>
        {#if sum.order.open.length}<TriangleAlert size={16} aria-hidden="true" />{:else}<Check size={16} aria-hidden="true" />{/if}
        {t('Order: {done} of {all} done', { done: sum.order.done, all: sum.order.all })}{#if sum.order.open.length}{' · '}{t('open: {list}. It stays for the next order.', { list: sum.order.open.join(', ') })}{/if}
      </p>
    {/if}
    {#if sum.costs.length}<p><Receipt size={16} aria-hidden="true" />{t('Cost per part')}: {sum.costs.map((c) => `${pname(c.part)} ${chf(c.chf)}`).join(' · ')}</p>{/if}
    <p class="hint num">{t('Sum of the lines: CHF {chf}', { chf: chf(sum.sum) })}</p>
  </section>

  <div class="vd-foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Later')}</button>
    <button type="button" class="btn hi" onclick={save} data-split-save>{t('Save the assignment')}</button>
  </div>
</dialog>

{#if page != null}
  <Lightbox list={pics.map((src, n) => ({ src, name: `${visit.shop} · ${t('page {n}', { n: n + 1 })}`, sub: visit.date }))} start={page} onclose={() => (page = null)} />
{/if}

<style>
  dialog.sheet.vdlg.rsplit {
    width: min(1040px, calc(100vw - 24px));
  }
  .lead,
  .hint {
    margin: 4px 0 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  h3 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 4px;
    font-size: var(--fs-body);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 16px;
    align-items: start;
  }
  .cols.one {
    grid-template-columns: minmax(0, 1fr);
  }
  @media (max-width: 760px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .pages {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pg {
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    overflow: hidden;
    cursor: zoom-in;
    width: 100%;
  }
  .pg img {
    display: block;
    width: 100%;
    max-height: 420px;
    object-fit: contain;
  }
  .tag {
    font-size: var(--fs-small);
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .tag.ok,
  .st.ok {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .lines {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
  }
  .line {
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .line:first-child {
    border-top: 0;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .st {
    font-size: var(--fs-small);
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .what {
    flex: 1 1 160px;
    min-width: 0;
    min-height: 44px;
  }
  .chf {
    width: 6.5rem;
    min-height: 44px;
    text-align: right;
  }
  .line .hint {
    margin: 4px 0 0;
  }
  .sels {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .sels .sel {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 44px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .after {
    margin-top: 14px;
  }
  .after p {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 6px 0;
  }
  .after :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  .after .ok :global(svg) {
    color: var(--accent);
  }
  .after .warn :global(svg) {
    color: var(--warn);
  }
</style>
