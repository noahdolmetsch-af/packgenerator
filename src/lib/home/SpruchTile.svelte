<script module>
  /** The sentence of this start of the app: a new start (reload) brings a new one, going back to Heute keeps it. */
  const session = { day: '', pick: null };
</script>

<script>
  /**
   * «Spruch zum Einstieg» PR 1 (Noah 07.11.2026 «Bau spruch pr1»): one short sentence in Bernese German, built from your own
   * numbers (weather, zone minutes, sleep and resting pulse, the next trip). A new one at each fresh start of the app, «New»
   * gives the next. «Why?» shows the number behind it. Observation only. The rules and the 16 sentences are in spruch.js.
   * Move or hide the tile under «Customise the start page».
   */
  import { liveQuery } from 'dexie';
  import { Quote, RefreshCw } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { addDays, AZM_WEEK_KEY, azmWeekOf } from '../health.js';
  import { loadProfil } from '../wetter/profil.js';
  import { summary } from '../wetter/nebelgrenze.js';
  import Empty from '../ui/Empty.svelte';
  import TileHead from './TileHead.svelte';
  import { SPRUCH_KEY, TONE_NAME, SOURCE_NAME, contextOf, pickSpruch, remember } from './spruch.js';

  // forecast: the home forecast of Today; trip/packed: the next trip and how far packing is; place: { lat, lon } of home or null
  let { today, now = new Date(), forecast = null, trip = null, packed = null, place = null, isnew = false } = $props();

  const rowsQ = liveQuery(async () => ({ v: db.healthDays ? await db.healthDays.where('date').aboveOrEqual(addDays(today, -35)).toArray() : [] }));
  const recQ = liveQuery(async () => ({ v: (await db.settings.get(SPRUCH_KEY))?.value ?? null }));
  const goalQ = liveQuery(async () => ({ v: (await db.settings.get(AZM_WEEK_KEY))?.value ?? null }));

  let fog = $state(null);
  let fogDone = $state(!place);
  $effect(() => {
    if (!place) {
      fogDone = true;
      return;
    }
    let live = true;
    loadProfil(db, place)
      .then((f) => live && (fog = summary(f, Date.now(), null)))
      .catch(() => {})
      .finally(() => live && (fogDone = true));
    return () => (live = false);
  });
  // wait for the data, but not for ever: after 1.8 s the sentence is chosen with what there is
  let grace = $state(false);
  $effect(() => {
    const id = setTimeout(() => (grace = true), 1800);
    return () => clearTimeout(id);
  });

  const ctx = $derived(
    contextOf({
      today,
      hour: now.getHours(),
      weekday: ((now.getDay() + 6) % 7) + 1,
      forecast,
      rows: $rowsQ?.v ?? [],
      goal: azmWeekOf($goalQ?.v),
      trip,
      packed,
      fog,
    }),
  );

  let shown = $state(session.day === today ? session.pick : null);
  let decided = session.day === today && session.pick !== null;
  let empty = $state(false);
  let why = $state(false);
  let none = $state(false); // «New» found no other sentence

  const ready = $derived($rowsQ !== undefined && $recQ !== undefined && $goalQ !== undefined && (grace || (forecast && fogDone)));
  $effect(() => {
    if (decided || !ready) return;
    decided = true;
    const p = pickSpruch(ctx, $recQ.v);
    if (p) show(p, $recQ.v);
    else empty = true;
  });

  function show(p, rec) {
    shown = p;
    session.day = today;
    session.pick = p;
    why = false;
    none = false;
    db.settings.put({ key: SPRUCH_KEY, value: remember(rec, p) }).catch(() => {});
  }
  function again() {
    const rec = $recQ?.v ?? null;
    const p = pickSpruch(ctx, rec, { not: shown?.id });
    if (p) show(p, rec);
    else none = true;
  }
</script>

<section class="sp surf" aria-labelledby="sp-h" data-section="spruch">
  <TileHead icon={Quote} id="sp-h" title={t('Saying|tile')} {isnew} />
  {#if shown}
    <p class="txt" lang="gsw" data-spruch={shown.id} aria-live="polite">{shown.text}</p>
    <p class="tags">
      <span class="tag" data-spruch-ton={shown.ton}>{t(TONE_NAME[shown.ton])}</span>
      <span class="src">{t(SOURCE_NAME[shown.src])}</span>
    </p>
    {#if why}<p class="why" data-spruch-why>{t(shown.why.key, shown.why.vars)}</p>{/if}
    {#if none}<p class="why" role="status">{t('No other saying fits right now.')}</p>{/if}
    <p class="acts">
      <button type="button" class="link" aria-expanded={why} onclick={() => (why = !why)} data-spruch-why-btn>{t('Why?|saying')}</button>
      <button type="button" class="btn" onclick={again} data-spruch-new><RefreshCw size={14} aria-hidden="true" />{t('New saying')}</button>
    </p>
  {:else if empty}
    <Empty text={t('No saying yet. It is built from your numbers: the weather at your home place, your zone minutes, your sleep or your next trip.')} action={{ label: t('Set the weather place'), href: '#/wetter' }} action2={{ label: t('Plan a trip|saying'), href: '#/trips' }} />
  {:else}
    <p class="txt wait" aria-hidden="true">&nbsp;</p>
  {/if}
</section>

<style>
  .sp {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .txt {
    margin: 0;
    font-size: var(--fs-body);
    line-height: 1.45;
    overflow-wrap: break-word;
    text-wrap: pretty;
  }
  .wait {
    min-height: 3em;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0;
    font-size: var(--fs-small);
  }
  .tag {
    padding: 1px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .src {
    color: var(--ink-3);
  }
  .why {
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0;
  }
  .acts .link,
  .acts .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .acts .link {
    border: 0;
    background: none;
    padding: 0;
    color: var(--accent);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
