<script>
  /**
   * «Meilensteine als Belohnung» (Noah 22.10.2026 «1a 2a 3a 4a 5a»), the milestone slot of a sport page
   * (Aktiv › Meine Sportarten › <Sport>, Aktiv spec 22.10.2026: every sport shows its own milestones):
   *   - «So funktionieren Meilensteine»: three steps, folded (5a);
   *   - the counters of the sport: times done, weeks in a row, this year, hours (2a; every tick counts 1, 1a),
   *     each with its next star, a bar and what counts («zählt: …», 5a);
   *   - challenges: three ready ones to tap, an own one, the running and the reached ones (3a). A reached
   *     challenge is a star that stays (Vitrine). Change or stop any time; stop and delete offer Undo.
   * act, today: the sport's activity (Meditation too) and today. Sport.svelte («Aktiv neu») draws the section
   * «Meilensteine» around it.
   */
  import { liveQuery } from 'dexie';
  import { Star, Trophy, Plus, Trash2 } from '@lucide/svelte';
  import ChallengeSheet from '../ui/ChallengeSheet.svelte';
  import MsHow from '../flow/hobby/MsHow.svelte';
  import { db } from '../db.js';
  import { normAct } from '../flow.js';
  import { msContext, newStars, TUNE_KEY } from '../flowms.js';
  import { actList } from '../flow/starcheck.js';
  import { CHALLENGES_KEY, challengesOf, presetsFor, newActChallenge, challengesFor, actCount, monthEnd } from '../challenge.js';
  import { saveStars, putSetting } from '../flowdb.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { msName, starLine, val, countsLine } from '../flow/hobby/words.js';
  import { dayShort } from '../flow/words.js';
  import { actName } from '../flow/ui.svelte.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { act: given, today } = $props();
  const actId = $derived(given?.id ?? null);

  const q = $derived(
    actId
      ? liveQuery(async () => {
          const [act, log, sessions, stars, tune, chs] = await Promise.all([
            db.flowActs.get(actId),
            db.flowLog.where('actId').equals(actId).toArray(),
            db.flowSessions.where('actId').equals(actId).toArray(),
            db.flowStars.toArray(),
            db.settings.get(TUNE_KEY),
            db.settings.get(CHALLENGES_KEY),
          ]);
          return { act: act ? normAct(act) : null, log, sessions, stars, tune: tune?.value ?? {}, all: challengesOf(chs?.value) };
        })
      : null,
  );
  const data = $derived(q ? $q : null);
  const act = $derived(data?.act ?? null);
  const stored = $derived(new Map((data?.stars ?? []).map((s) => [s.id, s.day])));
  const ctx = $derived(act ? msContext({ acts: [act], log: data.log, sessions: data.sessions, today, challenges: data.all }) : null);
  const list = $derived(ctx ? actList(ctx, act, stored, data.tune) : []);
  $effect(() => {
    const fresh = newStars(list, stored);
    if (fresh.length) saveStars(db, fresh);
  });
  const counters = $derived(list.filter((r) => !r.off && r.m.group !== 'challenge'));
  const starCount = $derived(list.filter((r) => !r.off).reduce((n, r) => n + r.reached.length, 0));
  const mine = $derived(act ? challengesFor(data.all, act.id) : []);
  const running = $derived(mine.filter((c) => c.until >= today && actCount(c, data.log) < c.times));
  const done = $derived(mine.filter((c) => actCount(c, data.log) >= c.times));
  const presets = $derived(act ? presetsFor(act, today) : []);
  const sportWord = $derived(act ? actName(act) : '');

  /* the challenge window: a preset, an own one or a running one to change */
  let sheet = $state(false);
  let draft = $state({ id: null, times: 10, until: '' });
  const openNew = (p = null) => ((draft = { id: null, times: p?.times ?? 10, until: p?.until ?? monthEnd(today) }), (sheet = true));
  const openRunning = (c) => ((draft = { id: c.id, times: c.times, until: c.until }), (sheet = true));
  const saveAll = (next) => putSetting(db, CHALLENGES_KEY, next);
  async function save({ times, until }) {
    const all = data.all;
    const next = draft.id ? all.map((c) => (c.id === draft.id ? { ...c, times, until } : c)) : [...all, newActChallenge({ act, times, until, today })];
    await saveAll(next);
  }
  async function stop() {
    const id = draft.id;
    const before = data.all;
    await deleteWithUndo({
      run: async () => (await saveAll(before.map((c) => (c.id === id ? { ...c, stopped: true } : c))), before),
      undo: (saved) => saveAll(saved),
      text: t('Challenge stopped.'),
      name: t('Challenge|sport'),
    });
  }
  async function remove(c) {
    const answer = await askDelete({ title: t('Delete this challenge?'), text: t('Its star goes with it. Your ticks stay.') });
    if (answer !== 'delete') return;
    const before = data.all;
    const sid = `ch.${c.id}:1`;
    await deleteWithUndo({
      run: async () => {
        const star = await db.flowStars.get(sid);
        await saveAll(before.filter((x) => x.id !== c.id));
        await db.flowStars.delete(sid);
        return { before, star };
      },
      undo: async (saved) => (await saveAll(saved.before), saved.star && (await db.flowStars.put(saved.star))),
      text: t('Challenge deleted.'),
      name: t('Challenge|sport'),
    });
  }
  const PRESET_WORDS = { month: 'by the end of the month', weeks6: 'in the next 6 weeks', year: 'by the end of the year' };
</script>

{#if act}
  <div class="msl" data-milestone-slot={act.id}>
    <p class="small num" data-ms-stars>{tn(starCount, '{n} star', '{n} stars')}</p>

    <MsHow sport={sportWord} start={false} />

    <ul class="cnt">
      {#each counters as r (r.id)}
        <li data-ms={r.id}>
          <span class="top"><span class="ic" aria-hidden="true"><Star size={16} /></span><b>{msName(r.m)}</b><span class="nx">{r.next ? starLine(r.next) : t('all stars')}</span></span>
          <span class="big num">{val(r.value, r.m.unit)}{#if r.next}<small> {t('of {n}', { n: val(r.target, r.m.unit) })}</small>{/if}</span>
          <span class="bar" role="img" aria-label={t('{n} of {m}', { n: val(r.value, r.m.unit), m: val(r.target, r.m.unit) })}><i style:width="{Math.round(r.progress * 100)}%"></i></span>
          <small>{countsLine(r.m)}</small>
        </li>
      {/each}
    </ul>

    <h3>{t('Challenges')}</h3>
    <p class="small">{t('Pick one or set your own. It counts by itself from your ticks; reached, it is a star.')}</p>
    {#if running.length}
      <ul class="chl">
        {#each running as c (c.id)}
          {@const n = actCount(c, data.log)}
          <li data-challenge={c.id}>
            <span class="tx"><b>{t('{n}× by {until}', { n: num(c.times), until: dayShort(c.until) })}</b><small>{t('{n} of {m}', { n: num(n), m: num(c.times) })}</small></span>
            <span class="bar" aria-hidden="true"><i style:width="{Math.round(Math.min(1, n / c.times) * 100)}%"></i></span>
            <button type="button" class="btn sm" onclick={() => openRunning(c)}>{t('Change')}</button>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="presets">
      {#each presets as p (p.key)}
        <button type="button" class="chip" onclick={() => openNew(p)} data-preset={p.key}><Trophy size={14} aria-hidden="true" />{t('{n}× {when}', { n: num(p.times), when: t(PRESET_WORDS[p.key]) })}</button>
      {/each}
      <button type="button" class="chip dash" onclick={() => openNew()} data-preset="own"><Plus size={14} aria-hidden="true" />{t('Own challenge')}</button>
    </div>
    {#if done.length}
      <ul class="chl done">
        {#each done as c (c.id)}
          <li data-challenge-done={c.id}>
            <span class="ic" aria-hidden="true"><Star size={16} /></span>
            <span class="tx"><b>{t('{n}× by {until}', { n: num(c.times), until: dayShort(c.until) })}</b><small>{t('Reached · a star in the showcase')}</small></span>
            <button type="button" class="btn sm icon" onclick={() => remove(c)} aria-label={t('Delete this challenge?')}><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {/if}

    <p class="links"><a class="lnk" href="#/flow/milestones?act={encodeURIComponent(act.id)}" data-all-milestones>{t('All milestones')}</a> · <a class="lnk" href="#/flow/trophies">{t('Trophy showcase')}</a></p>
  </div>
  <ChallengeSheet bind:open={sheet} what={sportWord} times={draft.times} until={draft.until} min={today} running={!!draft.id} sport onsave={save} onstop={stop} />
{/if}

<style>
  .cnt {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
  }
  .cnt li {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    min-width: 0;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .nx {
    color: var(--warn);
    font-size: var(--fs-small);
  }
  .ic {
    display: inline-grid;
    place-items: center;
    color: var(--warn);
  }
  .big {
    font-size: var(--fs-section);
    font-weight: 700;
  }
  .bar {
    display: block;
    height: 6px;
    border-radius: 4px;
    background: var(--line);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--warn);
  }
  .chl {
    margin: 8px 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 8px;
  }
  .chl li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(60px, 120px) auto;
    align-items: center;
    gap: 10px;
  }
  .chl.done li {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .tx {
    display: grid;
    min-width: 0;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0;
  }
  .presets .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .links {
    margin: 10px 0 0;
  }
</style>
