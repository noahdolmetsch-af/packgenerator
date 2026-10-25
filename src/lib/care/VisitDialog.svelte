<script>
  import { askDelete, deleteWithUndo } from '../ui/ask.js'; // «Rückmeldungen» 19.10.2026: the app's own question, then 4 s «Undo»
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  /**
   * One workshop visit (Noah, 4.10.2026, answers 7a, 8a): what was done, what it cost, and the
   * receipt pages to open big. The km at the visit can be added later (the receipts have none);
   * with them the app can say what the bike costs per 1000 km.
   */
  import { db } from '../db.js';
  import { removeVisit, restoreVisit } from '../visitdb.js';
  import { PART, parseKm } from '../care.js';
  import { visitTotal } from '../workshop.js';
  import Lightbox from '../ui/Lightbox.svelte';
  import { drawnOn } from '../draw/ink.js';
  import { t } from '../i18n.svelte.js';
  import { X } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';
  import RefundBox from '../werkstatt/RefundBox.svelte'; // Paket B part 3: a refund on the visit

  let { visit, bike, onclose } = $props();
  let dialog;
  let page = $state(null);
  // Paket NE 1146: draw on a receipt page (e.g. circle a price); the record keeps the picture and the drawing
  // svelte-ignore state_referenced_locally
  let pics = $state({ list: visit.photos ?? [], inks: visit.inks });
  async function drawOnPage(cur, { old, src, ink }) {
    pics = drawnOn(pics.list, pics.inks, old, src, ink);
    await db.visits.update(visit.id, { photos: pics.list, inks: pics.inks });
  }
  let kmMsg = $state('');

  $effect(() => {
    dialog.showModal();
  });

  const ACTION = { check: 'checked', service: 'serviced', replace: 'replaced' };
  const chf = (n) => (n == null ? '' : n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const lines = $derived([...(visit.parts ?? [])].sort((a, b) => (b.chf ?? 0) - (a.chf ?? 0)));

  async function saveKm(text) {
    const n = parseKm(text); // v0.30.1 (D1): "8'200", "8.200", "8 200"
    if (Number.isNaN(n)) return (kmMsg = t('Type the km as a whole number, e.g. 8200.'));
    kmMsg = '';
    await db.visits.update(visit.id, { km: n });
  }
  async function remove() {
    if ((await askDelete({ title: t('Remove the visit of {date}?', { date: visit.date }), text: t('Its jobs leave the part history too. You can bring it back for 4 seconds afterwards.'), label: t('Remove') })) !== 'delete') return;
    const name = `${visit.shop}, ${visit.date}`;
    const ok = await deleteWithUndo({
      // «Verschleiss»: the visit's point on the whole-bike counter goes with it (visitdb.js), Undo brings both back
      run: () => removeVisit(visit.id),
      undo: (snap) => restoreVisit(snap),
      text: t('"{name}" removed.', { name }),
      name,
    });
    if (ok) dialog.close();
  }
</script>

<!-- Design-Refresh P7 (V10, Noah 12.10.2026 «v5-v10 freigabe»): the workshop visit as a window of the bike
     pages: «shop, date», «bike · workshop» below, ✕; the jobs in a soft panel; «Remove visit» left, «Close» right. -->
<dialog use:backClose class="sheet vdlg" bind:this={dialog} onclose={onclose} aria-labelledby="visit-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="visit-h" class="title">{visit.shop}, {visit.date}</h2>
      <p class="vd-sub">{bike?.name ?? ''} · {t('Workshop')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="facts num">{visit.invoice ? `${t('Invoice {n}', { n: visit.invoice })} · ` : ''}<b>{visitTotal(visit) == null ? t('Cost unknown') : `CHF ${chf(visitTotal(visit))}`}</b></p>

  <label class="km">
    <span class="lbl">{t('km at the visit')}</span>
    <input class="inp num" type="text" inputmode="numeric" value={visit.km ?? ''} placeholder={t('not known')} onchange={(e) => saveKm(e.currentTarget.value)} />
  </label>
  {#if kmMsg}<p class="err" role="alert">{kmMsg}</p>{:else}<p class="hint">{t("From Strava or Garmin: the bike's total km on that day.")}</p>{/if}

  {#if pics.list.length}
    <h3>{t('Receipt')}</h3>
    <div class="pages">
      {#each pics.list as src, n (n)}
        <button type="button" class="pg" onclick={() => (page = n)} aria-label={t('Open receipt page {n}', { n: n + 1 })}><img {src} alt="" loading="lazy" /><span>{t('Page {n}', { n: n + 1 })}</span></button>
      {/each}
    </div>
  {/if}

  <h3>{t('What was done')}</h3>
  <ul class="jobs vd-panel">
    {#each lines as l, n (n)}
      <li>
        <span class="j"><b>{t(PART[l.part]?.name ?? 'Other')}</b> {ACTION[l.action] ? t(ACTION[l.action]) : ''}{#if l.model}<small>{l.model}</small>{/if}{#if l.what}<small>{l.what}</small>{/if}</span>
        <span class="num c">{chf(l.chf)}</span>
      </li>
    {/each}
  </ul>
  <RefundBox {visit} total={visitTotal(visit)} />

  <div class="foot vd-foot">
    <button type="button" class="link rm" onclick={remove}>{t('Remove visit')}</button>
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
  </div>
</dialog>

{#if page != null}
  <Lightbox ondraw={drawOnPage} list={pics.list.map((src, n) => ({ src, inks: pics.inks, name: `${visit.invoice ?? visit.shop} · ${t('page {n}', { n: n + 1 })}`, sub: visit.date }))} start={page} onclose={() => (page = null)} />
{/if}

<style>
  h2 {
    font-size: var(--fs-section);
    margin: 4px 0 4px;
  }
  h3 {
    margin: 16px 0 6px;
    font-size: var(--fs-body);
  }
  .facts {
    margin: 0 0 10px;
    font-size: var(--fs-body);
  }
  .km {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .km .lbl {
    margin: 0;
  }
  .km .inp {
    width: 120px;
  }
  .hint {
    font-size: var(--fs-small);
    color: var(--ink-3);
    margin: 4px 0 0;
  }
  .err {
    color: var(--bad);
    font-size: var(--fs-small);
    margin: 4px 0 0;
  }
  .pages {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .pg {
    display: flex;
    flex-direction: column;
    width: 92px;
    padding: 0;
    border: 1.5px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    font: 600 var(--fs-small) var(--font-body);
    color: var(--ink-2);
    cursor: pointer;
    overflow: hidden;
  }
  .pg img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    object-position: top;
  }
  .pg span {
    padding: 2px 6px 4px;
  }
  .jobs {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .jobs li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 0;
    font-size: var(--fs-small);
  }
  .jobs li + li {
    border-top: 1px solid var(--line);
  }
  .rm {
    margin-right: auto;
  }
  .j {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .j small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .c {
    flex: none;
  }
  .foot {
    display: flex;
    gap: 12px;
    align-items: center;
    margin: 12px 0 4px;
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-size: var(--fs-small);
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
