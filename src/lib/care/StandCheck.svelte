<script>
  /**
   * Einzelidee Heute 6 (UC-195-I1 «Saisonservice mit Lagerende»): on the page «Wear», after the bike stood
   * still for weeks, «Nach der Standzeit»: what may have changed while it stood (griff.js STAND_CHECKS).
   * Each check: «Geprüft» or «Noch zu tun» (a second tap takes it back); «Noch zu tun» can become a problem
   * in Bike care with one tap. «Alles geprüft» lets it rest until the next standstill; «Ausblenden» too.
   */
  import { liveQuery } from 'dexie';
  import { Snowflake, Check, Wrench } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { STAND_KEY, standChecks, standstill, standRec, markStand, finishStand } from '../griff.js';
  import { changeSetting } from '../griffdb.js';
  import { openNew } from '../nav.js';
  import { offerDone } from '../ui/rename.svelte.js';

  let { bike } = $props();
  const today = localDay();
  const kmQ = liveQuery(() => (bike ? db.kmBook.where('bikeId').equals(bike.id).toArray().catch(() => []) : []));
  const recQ = liveQuery(() => db.settings.get(STAND_KEY));
  const stand = $derived(bike && $kmQ ? standstill($kmQ, bike.id, today) : null);
  const rec = $derived(stand ? standRec($recQ?.value, bike.id, stand.from) : null);
  const checks = $derived(standChecks(bike));
  const show = $derived(!!stand && !!rec && !rec.done);
  const ticked = $derived(rec ? checks.filter((c) => rec.marks[c.key]).length : 0);

  const mark = (key, m) => changeSetting(STAND_KEY, {}, (v) => markStand(v, bike.id, stand.from, key, m));
  async function finish() {
    const old = await changeSetting(STAND_KEY, {}, (v) => finishStand(v, bike.id, stand.from, today));
    offerDone(t('Check after the standstill saved. It comes back after the next long break.'), () => db.settings.put({ key: STAND_KEY, value: old }));
  }
</script>

{#if show}
  <section class="stc" aria-labelledby="stc-h" data-stand-check>
    <h2 id="stc-h"><Snowflake size={18} aria-hidden="true" />{t('After the standstill')}</h2>
    <p class="quiet">
      {stand.back
        ? tn(stand.days, 'The bike stood for {n} day before {day}. Worth a look at what changes while it stands:', 'The bike stood for {n} days before {day}. Worth a look at what changes while it stands:', { day: dateOf(stand.back) })
        : tn(stand.days, 'The bike has not been ridden for {n} day. Before the next ride, check what changes while it stands:', 'The bike has not been ridden for {n} days. Before the next ride, check what changes while it stands:')}
    </p>
    <ul class="stc-l">
      {#each checks as c (c.key)}
        <li data-stand={c.key}>
          <span class="stc-n">{t(c.name)}</span>
          <span class="stc-b">
            <button type="button" class="btn sm" aria-pressed={rec.marks[c.key] === 'ok'} onclick={() => mark(c.key, 'ok')} data-stand-mark="ok"><Check size={14} aria-hidden="true" />{t('Checked')}</button>
            <button type="button" class="btn sm" aria-pressed={rec.marks[c.key] === 'todo'} onclick={() => mark(c.key, 'todo')} data-stand-mark="todo">{t('Still to do')}</button>
            {#if rec.marks[c.key] === 'todo'}<button type="button" class="btn sm" onclick={() => openNew('problem')} data-stand-problem><Wrench size={14} aria-hidden="true" />{t('Note as a problem')}</button>{/if}
          </span>
        </li>
      {/each}
    </ul>
    <p class="quiet">{t('{n} of {of} looked at. Nothing here is a must.', { n: ticked, of: checks.length })}</p>
    <button type="button" class="btn hi sm" onclick={finish} data-stand-done>{ticked === checks.length ? t('All checked') : t('Done for now|stand')}</button>
  </section>
{/if}

<style>
  .stc {
    margin: 0 0 14px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
  }
  .stc h2 {
    margin: 0 0 6px;
    font-size: var(--fs-sub);
  }
  .stc-l {
    display: grid;
    gap: 6px;
    margin: 8px 0;
    padding: 0;
    list-style: none;
  }
  .stc-l li {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    align-items: center;
    padding: 8px 10px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .stc-n {
    flex: 1 1 14rem;
    min-width: 0;
  }
  .stc-b {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .stc-b [aria-pressed='true'] {
    border-color: var(--hi);
    color: var(--hi);
    font-weight: 600;
  }
  h2 :global(svg) {
    vertical-align: -3px;
    margin-right: 6px;
  }
</style>
