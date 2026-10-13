<script>
  /**
   * Hobby pages, package 1: Meilensteine (mockup A2, Noah 10.10.2026, H16a, H17a).
   *   #/flow/milestones            all milestones in one place: over all activities, the next star of
   *                                each activity, the stages, the reward and the record wall
   *   #/flow/milestones?act=<id>   filtered: 'cross' (over all) or one activity
   *   #/flow/milestones?tune=1     the numbers and stages opened (change, hide, back to the suggestion)
   * Only the next star of a milestone is shown. Stars reached stay for ever (flowStars).
   * v0.94.0 «Kachel-Wand» (Noah 4a): on top (all), the series over everything and the milestones of
   * trips and bikes (lib/home/MsHome.svelte): all areas on one page.
   * v0.105.0 Design-Refresh P8 «Aktiv» (A8): two columns; main «Bald erreichbar» as rows, «Pro Aktivität»
   * as rows, the cards; side the trophy shelf, the reward and the record wall; the numbers folded below.
   */
  import { Lightbulb, Star } from '@lucide/svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import Rows from '../../lib/flow/kit/Rows.svelte';
  import MsRows from '../../lib/flow/kit/MsRows.svelte';
  import TrophyShelf from '../../lib/flow/kit/TrophyShelf.svelte';
  import RewardRow from '../../lib/flow/hobby/RewardRow.svelte';
  import RecordWall from '../../lib/flow/hobby/RecordWall.svelte';
  import MsCard from '../../lib/flow/hobby/MsCard.svelte';
  import Sugg from '../../lib/flow/hobby/Sugg.svelte';
  import MsHome from '../../lib/home/MsHome.svelte';
  import { db } from '../../lib/db.js';
  import { hobbyQuery, seedHobby } from '../../lib/flow/data.svelte.js';
  import { msContext, allMilestones, newStars, nextPerAct, soonList, recentStars, records as recordsOf, STAGES, TUNE_KEY, REWARD_KEY } from '../../lib/flowms.js';
  import { favActs } from '../../lib/flowtiles.js';
  import { saveStars, putSetting } from '../../lib/flowdb.js';
  import { tileName, msName, starLine, val, dayWord } from '../../lib/flow/hobby/words.js';
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

  /* A8: the rows «Bald erreichbar» and «Pro Aktivität», the trophy shelf (the newest stars, the next open) */
  const soon = $derived(soonList(scoped, 5));
  const perActRows = $derived(perAct.map(({ a, r }) => ({ key: a.id, icon: Star, title: tileName(a), sub: `${msName(r.m)} · ${r.next ? starLine(r.next) : t('all stars')}`, value: r.next ? `${Math.round(r.progress * 100)} %` : '', href: `#/flow/milestones?act=${encodeURIComponent(a.id)}` })));
  const nextUp = $derived(soonList(scoped, 1)[0] ?? scoped.filter((r) => r.next).sort((x, y) => y.progress - x.progress)[0] ?? null);
  const shelf = $derived([
    ...recentStars(scoped, 3).map((x) => ({ id: x.star.id, name: msName(x.r.m), when: dayWord(x.star.day, today), done: true })),
    ...(nextUp ? [{ id: `next-${nextUp.id}`, name: msName(nextUp.m), when: starLine(nextUp.next), done: false }] : []),
  ]);
  const shelfNext = $derived(nextUp ? { name: msName(nextUp.m), value: val(nextUp.value, nextUp.m.unit), target: val(nextUp.target, nextUp.m.unit) } : null);

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

</script>

<div class="hob">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }, { href: '#/flow/activity', label: t('Activity|tab') }]} here={t('Milestones')} />
    <PageHead title={t('Milestones')} text={t('Only the next star per milestone · stars reached stay · no ranking')} />
  </header>

  {#if data}
    <div class="tools">
      <nav class="chips" aria-label={t('Filter by activity')}>
        <a class="chip" href="#/flow/milestones" aria-current={filter === 'all' ? 'page' : undefined}>{t('All')}</a>
        <a class="chip" href="#/flow/milestones?act=cross" aria-current={filter === 'cross' ? 'page' : undefined}>{t('Over all')}</a>
        {#each chipActs as a (a.id)}<a class="chip" href="#/flow/milestones?act={encodeURIComponent(a.id)}" aria-current={filter === a.id ? 'page' : undefined}>{tileName(a)}</a>{/each}
      </nav>
      <a class="btn" href="#/flow/milestones?{filter === 'all' ? '' : `act=${encodeURIComponent(filter)}&`}tune=1">{t('Change stages')}</a>
    </div>

    <div class="lay">
      <div class="col">
        <Sec id="soon-h" title={t('Soon within reach')} sub={t('from 80 %')}>
          {#if soon.length}<MsRows list={soon} {label} />{:else}<Empty text={t('Nothing at 80 % yet. The next stars are under «All».')} />{/if}
        </Sec>

        {#if perAct.length}
          <Sec id="per-h" title={t('Per activity · next star')}>
            <Rows rows={perActRows} />
          </Sec>
        {/if}

        <Sec id="all-h" title={actOf ? tileName(actOf) : t('All milestones')} sub={actOf ? '' : t('over all activities')}>
          {#if cards.length || scoped.length}
            <div class="grid">{#each cards as r (r.id)}<MsCard {r} sub={label(r)} />{/each}</div>
          {:else}
            <Empty text={t('This activity has no milestones yet.')} />
          {/if}
        </Sec>

        {#if filter === 'all'}<MsHome />{/if}
      </div>

      <aside class="col">
        <Sec id="shelf-h" title={t('Trophy shelf')} sub={t('reached lately')}>
          <div class="card shelf"><TrophyShelf items={shelf} next={shelfNext} /></div>
        </Sec>
        <Sec id="reward-h" title={t('Reward')}>
          <RewardRow list={scoped.filter((r) => r.next)} reward={data.reward} wishlist={data.wishlist} onsave={saveReward} />
        </Sec>
        {#if (filter === 'all' || filter === 'cross') && recs.length}
          <Sec id="rec-h" title={t('Record wall')}>
            <RecordWall list={recs} {today} />
          </Sec>
        {/if}
        <p class="note"><Lightbulb size={16} aria-hidden="true" /><span>{t('Only the next star per milestone. Stars reached stay, even when a streak breaks. No confetti, no ranking. The numbers are suggestions.')}</span></p>
      </aside>
    </div>

    <details class="card tune" open={tuneOpen}>
      <summary>{t('Change numbers and stages')}</summary>
      <ol class="stages">{#each STAGES as s, i (s)}<li>{i + 1} · {t(s)}</li>{/each}</ol>
      <p class="hint">{t('Every milestone has up to 7 stars with these names.')}</p>
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
  {/if}
</div>

<style>
  /* v0.105.0 Design-Refresh P8 «Aktiv» (A8): two columns as on Aktiv, rows and white cards, the numbers folded */
  .hob {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    max-width: 1240px;
    margin: 0 auto;
    min-width: 0;
  }
  .hob :global(.pagehead) {
    margin: 0;
  }
  .ph {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2) var(--sp-3);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    min-width: 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: none;
  }
  .chip[aria-current='page'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
    align-items: start;
  }
  @media (min-width: 1000px) {
    .lay {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    }
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    min-width: 0;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-3);
  }
  @media (max-width: 599px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .shelf {
    padding: var(--sp-4);
  }
  .note {
    display: flex;
    gap: var(--sp-2);
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .tune {
    padding: var(--sp-2) var(--sp-4) var(--sp-4);
    min-width: 0;
  }
  .stages {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: var(--sp-2) 0 10px;
    padding: 0;
    list-style: none;
  }
  .stages li {
    padding: 2px 10px;
    border-radius: 99px;
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
