<script>
  /**
   * One workshop visit (Noah, 4.10.2026, answers 7a, 8a): what was done, what it cost, and the
   * receipt pages to open big. The km at the visit can be added later (the receipts have none);
   * with them the app can say what the bike costs per 1000 km.
   */
  import { db } from '../db.js';
  import { PART } from '../care.js';
  import { visitTotal } from '../workshop.js';
  import Lightbox from '../ui/Lightbox.svelte';
  import { t } from '../i18n.svelte.js';

  let { visit, bike, onclose } = $props();
  let dialog;
  let page = $state(null);
  let kmMsg = $state('');

  $effect(() => {
    dialog.showModal();
  });

  const ACTION = { check: 'checked', service: 'serviced', replace: 'replaced' };
  const chf = (n) => (n == null ? '' : n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const lines = $derived([...(visit.parts ?? [])].sort((a, b) => (b.chf ?? 0) - (a.chf ?? 0)));

  async function saveKm(text) {
    const n = text.trim() === '' ? null : Math.round(Number(text.replace(/['’,\s]/g, '')));
    if (n !== null && !(n >= 0 && n <= 500000)) return (kmMsg = t('Type the km as a whole number, e.g. 8200.'));
    kmMsg = '';
    await db.visits.update(visit.id, { km: n });
  }
  async function remove() {
    if (!confirm(t('Remove the visit of {date}? Its jobs leave the part history too.', { date: visit.date }))) return;
    await db.visits.delete(visit.id);
    dialog.close();
  }
</script>

<dialog class="sheet" bind:this={dialog} onclose={onclose} aria-labelledby="visit-h">
  <p class="meta">{bike?.name ?? ''} · {t('Workshop')}</p>
  <h2 id="visit-h" class="title">{visit.shop}, {visit.date}</h2>
  <p class="facts num">{visit.invoice ? `${t('Invoice {n}', { n: visit.invoice })} · ` : ''}<b>{visitTotal(visit) == null ? t('Cost unknown') : `CHF ${chf(visitTotal(visit))}`}</b></p>

  <label class="km">
    <span class="lbl">{t('km at the visit')}</span>
    <input class="inp num" type="text" inputmode="numeric" value={visit.km ?? ''} placeholder={t('not known')} onchange={(e) => saveKm(e.currentTarget.value)} />
  </label>
  {#if kmMsg}<p class="err" role="alert">{kmMsg}</p>{:else}<p class="hint">{t("From Strava or Garmin: the bike's total km on that day.")}</p>{/if}

  {#if visit.photos?.length}
    <h3>{t('Receipt')}</h3>
    <div class="pages">
      {#each visit.photos as src, n (n)}
        <button type="button" class="pg" onclick={() => (page = n)} aria-label={t('Open receipt page {n}', { n: n + 1 })}><img {src} alt="" loading="lazy" /><span>{t('Page {n}', { n: n + 1 })}</span></button>
      {/each}
    </div>
  {/if}

  <h3>{t('What was done')}</h3>
  <ul class="jobs">
    {#each lines as l, n (n)}
      <li>
        <span class="j"><b>{t(PART[l.part]?.name ?? 'Other')}</b> {ACTION[l.action] ? t(ACTION[l.action]) : ''}{#if l.model}<small>{l.model}</small>{/if}{#if l.what}<small>{l.what}</small>{/if}</span>
        <span class="num c">{chf(l.chf)}</span>
      </li>
    {/each}
  </ul>

  <div class="foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Close')}</button>
    <button type="button" class="link" onclick={remove}>{t('Remove visit')}</button>
  </div>
</dialog>

{#if page != null}
  <Lightbox list={visit.photos.map((src, n) => ({ src, name: `${visit.invoice ?? visit.shop} · ${t('page {n}', { n: n + 1 })}`, sub: visit.date }))} start={page} onclose={() => (page = null)} />
{/if}

<style>
  .meta {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  h2 {
    font-size: var(--fs-section);
    margin: 4px 0 4px;
  }
  h3 {
    margin: 16px 0 6px;
    font-size: 16px;
  }
  .facts {
    margin: 0 0 10px;
    font-size: 15px;
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
    font-size: 14px;
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
    font: 600 13px var(--font-body);
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
    padding: 0;
  }
  .jobs li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    font-size: 14px;
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
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
