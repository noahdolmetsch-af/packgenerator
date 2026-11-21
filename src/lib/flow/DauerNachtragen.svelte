<script>
  /**
   * «Dauer nachtragen» (Noah 21.11.2026, Sportjahr S12): one fold in «Meine Aktivitäten», next to «Übliche Dauer». It lists the ticks that
   * have no measured time (the evaluation counts the usual duration there and says «ca.»). One tap on 15, 30, 45 or 60 min, or an own
   * number, writes the real duration into the tick; from then on it counts as measured. «Undo» takes it back. Nothing else changes.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { einheiten } from './einheiten.js';
  import { USUAL_KEY, usualMap } from './usualmin.js';
  import { TICKS_KEY, prefsOf } from '../stravaticks.js';
  import { dueRows, writeDuration, restoreTick, NACHTRAG_CHIPS } from './nachtragen.js';
  import { actName } from './ui.svelte.js';
  import { dayShort } from './words.js';
  import ActIcon from './ActIcon.svelte';
  import MinInput from './MinInput.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  const SHOWN = 6;
  const q = liveQuery(async () => {
    const [log, activities, acts, usual, ticks] = await Promise.all([db.flowLog.toArray(), db.activities.toArray(), db.flowActs.toArray(), db.settings.get(USUAL_KEY), db.settings.get(TICKS_KEY)]);
    return { log, acts, rows: dueRows(einheiten({ log, activities, acts, usual: usualMap(usual?.value), map: prefsOf(ticks?.value).map }), log) };
  });
  const d = $derived($q);
  const actOf = $derived(new Map((d?.acts ?? []).map((a) => [a.id, a])));
  let all = $state(false);
  const rows = $derived(d?.rows ?? []);
  const shown = $derived(all ? rows : rows.slice(0, SHOWN));

  async function set(r, min) {
    const before = await writeDuration(db, r.id, min);
    if (!before) return;
    const a = actOf.get(r.actId);
    offerDone(t('«{name}»: {n} min saved.', { name: a ? actName(a) : r.actId, n: min }), () => restoreTick(db, before));
  }
</script>

{#if rows.length}
  <details class="card fold nachtrag" data-nachtragen>
    <summary><span>{t('Add the duration')}</span><small>{tn(rows.length, '{n} tick without a measured time', '{n} ticks without a measured time')}</small></summary>
    <p class="hint">{t('These ticks have no minutes, so the evaluation counts the usual duration and marks it «ca.». Tap the real length and it counts as measured.')}</p>
    <ul class="ul">
      {#each shown as r (r.id)}
        {@const a = actOf.get(r.actId)}
        <li data-nachtrag={r.id}>
          <span class="who">
            {#if a}<ActIcon icon={a.icon} ring={a.ring} />{/if}
            <span class="nm">{a ? actName(a) : r.actId}</span>
            <small>{dayShort(r.day)} · {t('ca. {n} min', { n: r.ca })}</small>
          </span>
          <span class="chips">
            {#each NACHTRAG_CHIPS as m (m)}
              <button type="button" class="chip" data-nachtrag-min={m} onclick={() => set(r, m)}>{t('{n} min', { n: m })}</button>
            {/each}
          </span>
          <MinInput value={null} chips={NACHTRAG_CHIPS} onset={(m) => set(r, m)} id={`nachtrag-${r.id}`} />
        </li>
      {/each}
    </ul>
    {#if rows.length > SHOWN}
      <button type="button" class="btn btn-link" onclick={() => (all = !all)} data-nachtrag-more>{all ? t('Show fewer') : t('Show all {n}', { n: rows.length })}</button>
    {/if}
  </details>
{/if}

<style>
  .nachtrag summary small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ul li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .ul li:first-child {
    border-top: 0;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .who small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .nm {
    font-weight: 600;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
