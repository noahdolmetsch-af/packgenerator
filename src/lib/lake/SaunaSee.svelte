<script>
  /**
   * Thread «Seetemperatur und Sauna» (Noah 20.10.2026 «3a 4a», built without mockups): «Sauna und See
   * heute?» inside the lake card. Water and air of the measurement with the cold-water scale, one tap
   * ticks the sauna or the swim in Aktiv (a second tap takes it back, with «Rückgängig»), and the swims
   * of the season with the coldest one. Only a suggestion: it can be hidden (setting lake.saunaSee) and
   * shown again under «Hinweis zum Schwimmen».
   *
   * Props: cur ({ water, air, at } of the measurement or null), set (lakeSetOf), today (YYYY-MM-DD).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { LAKE_DAYS_KEY, SCALE_WORDS, waterScale, isSwimAct, isSaunaAct, swimStats, saveLakeSet } from '../lake.js';
  import { actFromTemplate, FUN_IDEAS } from '../flowsugg.js';
  import { putActs } from '../flowdb.js';
  import { tapAct, actName } from '../flow/ui.svelte.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { Flame, Waves, Check } from '@lucide/svelte';

  let { cur = null, set, today } = $props();

  const SAUNA_TPL = { id: 'sauna', name: 'Sauna', nameDe: 'Sauna', icon: 'sauna', ring: 'rest' };
  const SWIM_TPL = FUN_IDEAS.find((i) => i.id === 'swim');

  const q = liveQuery(async () => {
    const [acts, kept] = await Promise.all([db.flowActs.toArray(), db.settings.get(LAKE_DAYS_KEY)]);
    const ids = acts.filter((a) => isSwimAct(a) || isSaunaAct(a)).map((a) => a.id);
    const log = ids.length ? await db.flowLog.where('actId').anyOf(ids).toArray() : [];
    return { acts, log, lakeDays: kept?.value ?? {} };
  });
  const st = $derived($q);

  const sauna = $derived(st?.acts.find(isSaunaAct) ?? null);
  const swim = $derived(st?.acts.find(isSwimAct) ?? null);
  const doneToday = (a) => !!a && !!st?.log.some((e) => e.actId === a.id && e.day === today);
  const saunaDone = $derived(doneToday(sauna));
  const swimDone = $derived(doneToday(swim));
  const stats = $derived(st ? swimStats({ acts: st.acts, log: st.log, lakeDays: st.lakeDays, today, nowWater: cur?.water ?? null }) : null);
  const scale = $derived(waterScale(cur?.water, set));

  const one = (n) => Number(n).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const dayOf = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });

  let busy = $state(false);
  /** Tick (or take back) the sauna or the swim; a missing activity is made from the idea first. */
  async function toggle(which) {
    if (busy) return;
    busy = true;
    try {
      let act = which === 'sauna' ? sauna : swim;
      if (!act) {
        act = actFromTemplate(which === 'sauna' ? SAUNA_TPL : SWIM_TPL, st?.acts ?? []);
        await putActs(db, [act]);
      }
      await tapAct({ act, goals: [] }, today);
    } finally {
      busy = false;
    }
  }
</script>

<div class="ss" data-sauna-see>
  <p class="ss-h">{t('Sauna and lake today?')}</p>
  {#if cur}
    <p class="ss-l num">
      {t('Water {w} °C', { w: one(cur.water) })}{#if scale}{' · '}<b class="ss-sc {scale}" data-scale={scale}>{t(SCALE_WORDS[scale])}</b>{/if}{#if cur.air != null}{' · '}{t('Air {v} °C', { v: one(cur.air) })}{/if}
    </p>
  {/if}
  <div class="ss-b" role="group" aria-label={t('Sauna and lake today?')}>
    <button type="button" class="ss-btn" aria-pressed={saunaDone} disabled={busy || !st} onclick={() => toggle('sauna')} data-tick="sauna">
      {#if saunaDone}<Check size={16} aria-hidden="true" />{:else}<Flame size={16} aria-hidden="true" />{/if}{sauna ? actName(sauna) : t('Sauna')}
    </button>
    <button type="button" class="ss-btn" aria-pressed={swimDone} disabled={busy || !st} onclick={() => toggle('swim')} data-tick="swim">
      {#if swimDone}<Check size={16} aria-hidden="true" />{:else}<Waves size={16} aria-hidden="true" />{/if}{t('Into the lake')}
    </button>
  </div>
  {#if stats && stats.season > 0}
    <p class="ss-stat" data-swims={stats.season}>
      {tn(stats.season, '{n} swim since 1 September', '{n} swims since 1 September')}{#if stats.coldest}{' · '}{t('coldest {w} °C on {day}', { w: one(stats.coldest.water), day: dayOf(stats.coldest.day) })}{/if}
    </p>
  {:else}
    <p class="ss-stat">{t('Tick a swim and the app keeps the water temperature with it: your swims this season and the coldest one.')}</p>
  {/if}
  <button type="button" class="ss-hide" onclick={() => saveLakeSet(db, { saunaSee: false })}>{t('Hide')}</button>
</div>

<style>
  .ss { display: grid; gap: var(--sp-2); padding: var(--sp-3); border-radius: var(--radius); background: var(--paper-2); }
  .ss-h { margin: 0; font-weight: 600; color: var(--ink); font-size: var(--fs-small); }
  .ss-l { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .ss-sc { font-weight: 600; }
  .ss-sc.warm { color: var(--ok); }
  .ss-sc.icy { color: var(--ink); }
  .ss-b { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .ss-btn { display: inline-flex; align-items: center; gap: var(--sp-1); min-height: 44px; padding: 0 var(--sp-3); border: 1px solid var(--line-strong); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  .ss-btn[aria-pressed='true'] { background: var(--ok-soft); border-color: var(--ok); color: var(--ok); }
  .ss-btn:disabled { opacity: 0.6; cursor: default; }
  .ss-btn:focus-visible, .ss-hide:focus-visible { outline: var(--focus-ring); }
  .ss-stat { margin: 0; color: var(--ink-2); font-size: var(--fs-tiny); }
  .ss-hide { justify-self: start; min-height: 44px; border: 0; background: none; padding: 0; color: var(--ink-3); font: inherit; font-size: var(--fs-tiny); text-decoration: underline; cursor: pointer; }
</style>
