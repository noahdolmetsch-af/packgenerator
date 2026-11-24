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
   * «Meilensteine ordnen» (Noah 23.11.2026 «ja»): on top only «Dein nächster Stern» and «Bald erreichbar»; below one
   * list per sport (real name, playful name small; a tap opens that sport's cards), the milestones over all sports,
   * and ONE block «Geschafft» (trophy shelf, «Ganz geschafft», record wall, year in stars). The sport's name leads
   * every row («Indoor-Velo · Stunden»), so two «Stunden» are never mistaken for one number.
   */
  import { Lightbulb } from '@lucide/svelte';
  import Empty from '../../lib/ui/Empty.svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Sec from '../../lib/flow/kit/Sec.svelte';
  import StarPath from '../../lib/flow/hobby/StarPath.svelte';
  import MsRows from '../../lib/flow/kit/MsRows.svelte';
  import TrophyShelf from '../../lib/flow/kit/TrophyShelf.svelte';
  import RewardRow from '../../lib/flow/hobby/RewardRow.svelte';
  import RecordWall from '../../lib/flow/hobby/RecordWall.svelte';
  import MsCard from '../../lib/flow/hobby/MsCard.svelte';
  import Sugg from '../../lib/flow/hobby/Sugg.svelte';
  import YearStars from '../../lib/flow/hobby/YearStars.svelte';
  import { yearOfStars } from '../../lib/flow/sternjahr.js';
  import DoneShelf from '../../lib/flow/hobby/DoneShelf.svelte';
  import HeroNext from '../../lib/flow/hobby/HeroNext.svelte';
  import { heroOf } from '../../lib/flow/naechster.js';
  import MsHome from '../../lib/home/MsHome.svelte';
  import MsHow from '../../lib/flow/hobby/MsHow.svelte';
  import { db } from '../../lib/db.js';
  import { hobbyQuery, seedHobby } from '../../lib/flow/data.svelte.js';
  import { msContext, allMilestones, newStars, nextPerAct, soonList, recentStars, records as recordsOf, STAGES, TUNE_KEY, REWARD_KEY } from '../../lib/flowms.js';
  import { favActs } from '../../lib/flowtiles.js';
  import { saveStars, putSetting } from '../../lib/flowdb.js';
  import { actNick, msName, starLine, dayWord, areaWord } from '../../lib/flow/hobby/words.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { localDay } from '../../lib/localday.js';
  import { t, num } from '../../lib/i18n.svelte.js';
  import { phone } from '../../lib/media.svelte.js';
  const CARDS_PHONE = 6;
  let allCards = $state(false);

  let { params = new URLSearchParams() } = $props();
  const today = localDay();
  const q = hobbyQuery(today);
  const data = $derived($q);
  $effect(() => {
    seedHobby(data);
  });

  const ctx = $derived(data ? msContext({ acts: data.acts, log: data.log, sessions: data.sessions, today, tripDays: data.tripDays, extra: data.extra, challenges: data.challenges }) : null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const list = $derived(ctx ? allMilestones(ctx, stored, data.tune) : []);
  $effect(() => {
    const fresh = newStars(list, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const shown = $derived(list.filter((r) => !r.off));

  /* the filter chips: all, over all, the favourites and every other activity with milestones */
  const filter = $derived(params.get('act') || 'all');
  // «Meilensteine kürzer» (Noah 27.10.2026 «2a»): on a phone, over all sports, the long parts wait folded
  const fold = $derived(phone.matches && filter === 'all');
  const favs = $derived(data ? favActs(data.acts) : []);
  /* the sports with milestones: the favourites first (they are the chips), the others sit in one select «More sports» */
  const restActs = $derived(data ? data.acts.filter((a) => !a.paused && !a.fav && shown.some((r) => r.m.actId === a.id && r.reached.length)) : []);
  const chipActs = $derived([...favs, ...restActs]);
  const goAct = (e) => {
    const v = e.currentTarget.value;
    if (v) location.hash = `#/flow/milestones?act=${encodeURIComponent(v)}`;
  };
  const actOf = $derived(data?.acts.find((a) => a.id === filter) ?? null);
  const inFilter = (r) => (filter === 'all' ? true : filter === 'cross' ? !r.m.actId : r.m.actId === filter);
  const scoped = $derived(shown.filter(inFilter));
  // «Ganz geschafft» (Noah 21.11.2026 «3a»): milestones with all stars stand on the shelf, not in the list
  // «Dein Jahr in Sternen» (Noah 21.11.2026 «4a»): a look back at the stars of this year, in the scope of the filter
  const yearStars = $derived(yearOfStars(scoped, today));
  const doneList = $derived(scoped.filter((r) => r.done));
  const cards = $derived((filter === 'all' || filter === 'cross' ? shown.filter((r) => !r.m.actId) : scoped).filter((r) => !r.done));
  const perAct = $derived.by(() => {
    if (filter !== 'all' || !data) return [];
    const by = nextPerAct(shown);
    return chipActs.map((a) => ({ a, r: by.get(a.id) })).filter((x) => x.r);
  });
  const actById = (id) => data?.acts.find((a) => a.id === id) ?? null;
  // the sport's real name leads a row of a milestone of a sport («Indoor-Velo · Stunden»); on the sport's own view it is left out
  const titleOf = (r) => (r.m.actId && filter !== r.m.actId && actById(r.m.actId) ? `${actName(actById(r.m.actId))} · ${msName(r.m)}` : msName(r.m));
  // the small line: the sport's playful name, or the area of a data milestone
  const label = (r) => (r.m.actId && filter !== r.m.actId ? actNick(actById(r.m.actId)) : r.m.area ? areaWord(r.m.area) : '');
  const recs = $derived(ctx ? recordsOf(ctx, data.rides) : []);
  const saveReward = (v) => putSetting(db, REWARD_KEY, v);

  /* A8: the rows «Bald erreichbar» and «Pro Aktivität», the trophy shelf (the newest stars, the next open) */
  // «Dein nächster Stern» (Noah 21.11.2026 «1a»): the card on top; «Soon within reach» below does not repeat its star
  const hero = $derived(ctx && data ? heroOf({ list: scoped, ctx, acts: data.acts, plan: data.plan, weeklog: data.weeklog, sessions: data.plannedSessions ?? [], today }) : null);
  const soon = $derived(soonList(hero ? scoped.filter((r) => r.id !== hero.r.id) : scoped, 5));
  // «Der Sternen-Weg» (Noah 21.11.2026 «2a»): per sport the path of its stars instead of a percent row
  const perActRows = $derived(perAct.map(({ a, r }) => ({ key: a.id, title: actName(a), nick: actNick(a), sub: `${msName(r.m)} · ${r.next ? starLine(r.next) : t('all stars')}`, href: `#/flow/milestones?act=${encodeURIComponent(a.id)}`, r })));
  // the trophy shelf shows the newest stars only; the next star stands on the card on top (no second «Weiter» line)
  const shelf = $derived(recentStars(scoped, 3).map((x) => ({ id: x.star.id, name: titleOf(x.r), when: dayWord(x.star.day, today), done: true })));

  /* change the numbers (flow.msTune): own thresholds, hide, back to the suggestion */
  const tuneOpen = $derived(params.get('tune') === '1');
  // Tempo (Noah 05.11.2026): the folds are built when they are opened for the first time, not with the page (the numbers fold alone had ~550 elements)
  const seen = $state({ all: false, areas: false, tune: false });
  $effect(() => {
    if (tuneOpen) seen.tune = true;
  });
  const opened = (key) => (e) => {
    if (e.currentTarget.open) seen[key] = true;
  };
  const tuneList = $derived(list.filter(inFilter).filter((r) => r.m.group !== 'challenge'));
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
    <Crumb path={[{ href: '#/auswerten', label: t('Analysis|place') }]} here={t('Milestones')} />
    <PageHead title={t('Milestones')} text={t('Only the next star per milestone · stars reached stay · no ranking')} />
    <!-- «Challenges» (Noah 21.11.2026 «4a»): the page for challenges with a daily goal sits in Meilensteine -->
    <a class="btn sm" href="#/flow/challenges" data-challenges-link>{t('Challenges|page')} ›</a>
  </header>

  {#if data}
    <div class="tools">
      <nav class="chips" aria-label={t('Filter by activity')}>
        <a class="chip" href="#/flow/milestones" aria-current={filter === 'all' ? 'page' : undefined}>{t('All')}</a>
        <a class="chip" href="#/flow/milestones?act=cross" aria-current={filter === 'cross' ? 'page' : undefined}>{t('Over all')}</a>
        {#each favs as a (a.id)}<a class="chip" href="#/flow/milestones?act={encodeURIComponent(a.id)}" aria-current={filter === a.id ? 'page' : undefined}>{actName(a)}</a>{/each}
        {#if restActs.length}
          <!-- the other sports in one select, not one chip each (Noah 23.11.2026) -->
          <select class="chip pick" aria-label={t('More sports')} value={restActs.some((a) => a.id === filter) ? filter : ''} onchange={goAct} data-ms-more>
            <option value="">{t('More sports')}</option>
            {#each restActs as a (a.id)}<option value={a.id}>{actName(a)}</option>{/each}
          </select>
        {/if}
      </nav>
    </div>

    {#if hero}<HeroNext {hero} label={label(hero.r)} title={titleOf} />{/if}

    <!-- «Belohnung nach oben» (Noah 21.11.2026 «5a»): the reward sits right under the next star, not at the side -->
    <Sec id="reward-h" title={t('Reward')}>
      <RewardRow list={scoped.filter((r) => r.next)} reward={data.reward} wishlist={data.wishlist} onsave={saveReward} quick={hero?.r ?? null} />
    </Sec>

    <div class="lay">
      <div class="col">
        <Sec id="soon-h" title={t('Soon within reach')} sub={t('from 80 %')}>
          {#if soon.length}<MsRows list={soon} {label} title={titleOf} />{:else}<Empty text={t('Nothing at 80 % yet. The next stars are under «All».')} />{/if}
        </Sec>

        {#if perAct.length}
          <Sec id="per-h" title={t('Per activity · your path')} sub={t('Tap a sport to see all its milestones.')}>
            <StarPath rows={perActRows} />
          </Sec>
        {/if}

        {#if filter !== 'all' || cards.length || doneList.length}
          <Sec id="all-h" title={actOf ? actName(actOf) : filter === 'all' ? t('Over all sports') : t('All milestones')} sub={actOf ? actNick(actOf) : ''}>
            {#if cards.length}
              <!-- phone: the first six, the rest after «Alle n zeigen» -->
              {#if fold && cards.length}
                <!-- Noah 27.10.2026 «2a»: on a phone only the next star per sport stays open (above); all cards wait folded -->
                <details class="card fold" data-ms-fold="all" ontoggle={opened('all')}>
                  <summary data-ms-all>{t('Show all {n}', { n: cards.length })}</summary>
                  {#if seen.all}<div class="grid">{#each cards as r (r.id)}<MsCard {r} sub={r.m.area ? '' : label(r)} />{/each}</div>{/if}
                </details>
              {:else}
                <div class="grid">{#each phone.matches && !allCards ? cards.slice(0, CARDS_PHONE) : cards as r (r.id)}<MsCard {r} sub={r.m.area ? '' : label(r)} />{/each}</div>
                {#if phone.matches && !allCards && cards.length > CARDS_PHONE}<button type="button" class="btn btn-link" onclick={() => (allCards = true)} data-ms-all>{t('Show all {n}', { n: cards.length })} ›</button>{/if}
              {/if}
            {:else if doneList.length}
              <Empty text={t('Every milestone here has all its stars. They stand on the shelf «Fully done» above.')} />
            {:else}
              <Empty text={t('This activity has no milestones yet.')} />
            {/if}
          </Sec>
        {/if}

        {#if filter === 'all' && fold}
          <details class="card fold" data-ms-fold="areas" ontoggle={opened('areas')}>
            <summary>{t('Series, trips and bikes')}</summary>
            {#if seen.areas}<MsHome />{/if}
          </details>
        {:else if filter === 'all'}<MsHome />{/if}
      </div>

      <aside class="col">
        <!-- ONE block «Geschafft» (Noah 23.11.2026): the trophy shelf, «Ganz geschafft», the record wall and the year in stars -->
        <Sec id="geschafft-h" title={t('Achieved|ms')} sub={t('Everything you have reached, in one place. Stars stay for ever.')}>
          <div class="card gb" data-geschafft>
            <section aria-labelledby="shelf-h">
              <h3 id="shelf-h">{t('Trophy shelf')}<small>{t('reached lately')}</small></h3>
              {#if shelf.length}<TrophyShelf items={shelf} more="#/flow/trophies" />{:else}<p class="none">{t('Your first star stands here.')}</p>{/if}
            </section>
            {#if doneList.length}<DoneShelf embedded list={doneList} {label} title={titleOf} />{/if}
            {#if (filter === 'all' || filter === 'cross') && recs.length}
              <section aria-labelledby="rec-h">
                <h3 id="rec-h">{t('Record wall')}</h3>
                <RecordWall list={recs} {today} />
              </section>
            {/if}
            {#if yearStars.all}<YearStars embedded y={yearStars} {today} />{/if}
          </div>
        </Sec>
        <p class="note"><Lightbulb size={16} aria-hidden="true" /><span>{t('Only the next star per milestone. Stars reached stay, even when a streak breaks. No confetti, no ranking. The numbers are suggestions.')}</span></p>
      </aside>
    </div>

    <!-- the explanation waits folded at the end (Noah 23.11.2026), the choice is kept on this device -->
    <MsHow start={false} />

    <details class="card tune" open={tuneOpen} ontoggle={opened('tune')}>
      <summary>{t('Change numbers and stages')}</summary>
      {#if seen.tune}
        <ol class="stages">{#each STAGES as s, i (s)}<li>{i + 1} · {t(s)}</li>{/each}</ol>
        <p class="hint">{t('Every milestone has up to 7 stars with these names.')}</p>
        <p class="hint">{t('The numbers are suggestions. Separate them with commas; empty goes back to the suggestion. Stars reached stay.')}</p>
        <ul class="tl">
          {#each tuneList as r (r.id)}
            <li data-tune={r.m.key}>
              <span class="tn"><b>{msName(r.m)}</b>{#if r.m.sugg}<Sugg />{/if}{#if r.m.actId}<small>{actName(actById(r.m.actId))}</small>{:else if r.m.area}<small>{areaWord(r.m.area)}</small>{/if}</span>
              <label class="ti"><span class="sr">{t('Thresholds of {name}', { name: msName(r.m) })}</span>
                <input class="inp" inputmode="decimal" value={stepsText(r)} onchange={(e) => setSteps(r, e.currentTarget.value)} />
              </label>
              <label class="tc"><input type="checkbox" checked={!r.off} onchange={(e) => setTune(r, { off: !e.currentTarget.checked })} />{t('Show')}</label>
              {#if own(r)}<button type="button" class="btn sm tb" onclick={() => setTune(r, { steps: null })}>{t('Suggestion: {list}', { list: r.m.steps.map((s) => num(s)).join(' · ') })}</button>{/if}
            </li>
          {/each}
        </ul>
      {/if}
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
  .gb {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    padding: var(--sp-4);
    min-width: 0;
  }
  .gb h3 {
    margin: 0 0 var(--sp-2);
    font: 700 var(--fs-section) / 1.25 var(--font-body);
  }
  .gb h3 small {
    margin-left: var(--sp-2);
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .none {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pick {
    appearance: auto;
    max-width: 100%;
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
  .fold {
    min-width: 0;
    padding: 0 var(--sp-4);
  }
  .fold > summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    font-weight: 600;
    cursor: pointer;
  }
  .fold[open] {
    padding-bottom: var(--sp-4);
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
