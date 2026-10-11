<script>
  /**
   * Hobby pages, package 1: Meilensteine (mockup A2, Noah 10.10.2026, H16a, H17a).
   *   #/flow/milestones            all milestones in one place: over all activities, the next star of
   *                                each activity, the stages, the reward and the record wall
   *   #/flow/milestones?act=<id>   filtered: 'cross' (over all) or one activity
   *   #/flow/milestones?tune=1     the numbers and stages opened (change, hide, back to the suggestion)
   * Only the next star of a milestone is shown. Stars reached stay for ever (flowStars).
   */
  import { ChevronLeft } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import MsBlock from '../../lib/flow/hobby/MsBlock.svelte';
  import MsCard from '../../lib/flow/hobby/MsCard.svelte';
  import CanDo from '../../lib/flow/hobby/CanDo.svelte';
  import Sugg from '../../lib/flow/hobby/Sugg.svelte';
  import { db } from '../../lib/db.js';
  import { hobbyQuery, seedHobby } from '../../lib/flow/data.svelte.js';
  import { msContext, allMilestones, newStars, nextPerAct, records as recordsOf, STAGES, TUNE_KEY, REWARD_KEY } from '../../lib/flowms.js';
  import { favActs } from '../../lib/flowtiles.js';
  import { saveStars, putSetting } from '../../lib/flowdb.js';
  import { tileName, msName } from '../../lib/flow/hobby/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, num } from '../../lib/i18n.svelte.js';

  let { params = new URLSearchParams() } = $props();
  const today = localDay();
  const q = hobbyQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedHobby(data);
  });

  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const list = $derived(ctx ? allMilestones(ctx, stored, data.tune) : []);
  $effect(() => {
    const fresh = newStars(list, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const shown = $derived(list.filter((r) => !r.off));

  /* the filter chips: all, over all, the favourites and every other activity with milestones */
  const filter = $derived(params.get('act') || 'all');
  const favs = $derived(data ? favActs(data.acts) : []);
  const chipActs = $derived.by(() => {
    if (!data) return [];
    const rest = data.acts.filter((a) => !a.paused && !a.fav && shown.some((r) => r.m.actId === a.id && r.reached.length));
    return [...favs, ...rest];
  });
  const actOf = $derived(data?.acts.find((a) => a.id === filter) ?? null);
  const inFilter = (r) => (filter === 'all' ? true : filter === 'cross' ? !r.m.actId : r.m.actId === filter);
  const scoped = $derived(shown.filter(inFilter));
  const cards = $derived(filter === 'all' || filter === 'cross' ? shown.filter((r) => !r.m.actId) : scoped);
  const perAct = $derived.by(() => {
    if (filter !== 'all' || !data) return [];
    const by = nextPerAct(shown);
    return chipActs.map((a) => ({ a, r: by.get(a.id) })).filter((x) => x.r);
  });
  const label = (r) => (r.m.actId && filter !== r.m.actId ? tileName(data?.acts.find((a) => a.id === r.m.actId)) : '');
  const recs = $derived(ctx ? recordsOf(ctx, data.rides) : []);
  const saveReward = (v) => putSetting(db, REWARD_KEY, v);

  /* change the numbers (flow.msTune): own thresholds, hide, back to the suggestion */
  const tuneOpen = $derived(params.get('tune') === '1');
  const tuneList = $derived(list.filter(inFilter));
  const stepsText = (r) => r.steps.join(', ');
  async function setTune(r, patch) {
    const all = { ...(data.tune ?? {}) };
    const now = { ...(all[r.m.key] ?? {}), ...patch };
    for (const k of Object.keys(now)) if (now[k] == null || now[k] === false) delete now[k];
    if (Object.keys(now).length) all[r.m.key] = now;
    else delete all[r.m.key];
    await putSetting(db, TUNE_KEY, Object.keys(all).length ? all : null);
  }
  function setSteps(r, text) {
    const steps = text
      .split(/[,;\s·]+/)
      .map((x) => Number(x.replace(/['’]/g, '')))
      .filter((x) => x > 0);
    return setTune(r, { steps: steps.length ? steps.slice(0, 7) : null });
  }
  const own = (r) => !!data?.tune?.[r.m.key]?.steps;

  const CAN = [
    'all milestones in one place, filtered by activity',
    'only the next star per milestone',
    'highlight «soon within reach» from 80 %',
    'recently reached stars with their date',
    'hang a reward from the wishlist on a star',
    'record wall with your personal bests',
    'change numbers and stages yourself, or hide a milestone',
  ];
</script>

<div class="hob">
  <p class="back"><a href="#/flow/activity"><ChevronLeft size={16} aria-hidden="true" />{t('Back to Activity')}</a></p>
  <PageHead title={t('Milestones')} />

  {#if data}
    <nav class="chips" aria-label={t('Filter by activity')}>
      <a class="chip" href="#/flow/milestones" aria-current={filter === 'all' ? 'page' : undefined}>{t('All')}</a>
      <a class="chip" href="#/flow/milestones?act=cross" aria-current={filter === 'cross' ? 'page' : undefined}>{t('Over all')}</a>
      {#each chipActs as a (a.id)}<a class="chip" href="#/flow/milestones?act={encodeURIComponent(a.id)}" aria-current={filter === a.id ? 'page' : undefined}>{tileName(a)}</a>{/each}
    </nav>

    <h2 class="zlabel hs">{#if actOf}{tileName(actOf)}{:else}{t('Milestones')} <span class="hsub">· {t('over all activities')}</span>{/if}</h2>
    {#if cards.length || scoped.length}
      <MsBlock list={scoped} all={cards} {label} records={filter === 'all' || filter === 'cross' ? recs : []} reward={data.reward} wishlist={data.wishlist} onreward={saveReward} {today} tuneHref="#/flow/milestones?{filter === 'all' ? '' : `act=${encodeURIComponent(filter)}&`}tune=1" />
    {:else}
      <p class="hint">{t('This activity has no milestones yet.')}</p>
    {/if}

    {#if perAct.length}
      <h2 class="zlabel hs">{t('Per activity · next star')}</h2>
      <div class="grid">{#each perAct as x (x.a.id)}<MsCard r={x.r} sub={tileName(x.a)} />{/each}</div>
    {/if}

    <h2 class="zlabel hs">{t('Stages')}</h2>
    <section class="surf pad">
      <ol class="stages">{#each STAGES as s, i (s)}<li>{i + 1} · {t(s)}</li>{/each}</ol>
      <p class="hint">{t('Every milestone has up to 7 stars with these names.')}</p>
    </section>

    <details class="surf pad tune" open={tuneOpen}>
      <summary>{t('Change numbers and stages')}</summary>
      <p class="hint">{t('The numbers are suggestions. Separate them with commas; empty goes back to the suggestion. Stars reached stay.')}</p>
      <ul class="tl">
        {#each tuneList as r (r.id)}
          <li data-tune={r.m.key}>
            <span class="tn"><b>{msName(r.m)}</b>{#if r.m.sugg}<Sugg />{/if}{#if r.m.actId}<small>{tileName(data.acts.find((a) => a.id === r.m.actId))}</small>{/if}</span>
            <label class="ti"><span class="sr">{t('Thresholds of {name}', { name: msName(r.m) })}</span>
              <input class="inp" inputmode="decimal" value={stepsText(r)} onchange={(e) => setSteps(r, e.currentTarget.value)} />
            </label>
            <label class="tc"><input type="checkbox" checked={!r.off} onchange={(e) => setTune(r, { off: !e.currentTarget.checked })} />{t('Show')}</label>
            {#if own(r)}<button type="button" class="btn sm tb" onclick={() => setTune(r, { steps: null })}>{t('Suggestion: {list}', { list: r.m.steps.map((s) => num(s)).join(' · ') })}</button>{/if}
          </li>
        {/each}
      </ul>
    </details>

    <CanDo items={CAN} />
  {/if}
</div>

<style>
  .hob {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 1328px;
    margin: 0 auto;
    min-width: 0;
  }
  .back {
    margin: 0;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    color: var(--accent);
    text-decoration: none;
    font-size: var(--fs-small);
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 6px 14px;
    border: 1.5px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small)/1.3 var(--font-body);
    text-decoration: none;
  }
  .chip[aria-current='page'] {
    border-color: var(--accent);
    background: var(--accent-soft);
    font-weight: 600;
  }
  .hs {
    margin: 18px 0 0;
    color: var(--pc);
  }
  .hsub {
    color: var(--ink-3);
    font-weight: 500;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 899px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 599px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .pad {
    padding: 16px 18px;
    min-width: 0;
  }
  .stages {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .stages li {
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tune summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    font-weight: 600;
    cursor: pointer;
  }
  .tl {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  .tl li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .tn {
    flex: 1 1 200px;
    min-width: 0;
    line-height: 1.3;
  }
  .tn b {
    font-weight: 600;
  }
  .tn small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ti {
    flex: 1 1 220px;
  }
  .ti input {
    width: 100%;
    min-height: 44px;
  }
  .tc {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .tc input {
    width: 20px;
    height: 20px;
  }
  .tb {
    min-height: 44px;
  }
</style>
