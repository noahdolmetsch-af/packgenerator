<script>
  /**
   * «Heute entdecken» (Noah 23.11.2026 «1a 2b 3a 4a 5a»): one idea in a row under the chips on Heute, always with its
   * «Warum». The idea is a star that is almost there, a content page that fits your data (the tour suggestions), what is
   * new, or a function you never opened that fits your moment (ideen.js). «Ansehen» goes there; × puts it off until
   * tomorrow (with Undo); «Mehr Ideen» opens three in a window (IdeenSheet.svelte) with «Not for me» and the switch.
   * The data loads once the page is quiet, so Heute starts as fast as before. Only a suggestion.
   */
  import { onMount } from 'svelte';
  import { liveQuery } from 'dexie';
  import { X, Sparkles } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { momentOf } from '../moment.js';
  import { FEATURES } from '../features.js';
  import { DREAMS_KEY, storeOf } from '../dreams.js';
  import { featureData, usedOf } from '../know/featureData.js';
  import { NOT_KEY, notForMeOf, setNotForMe, unsetNotForMe } from '../ruhig/weniger.js';
  import { goFeature } from '../know/featureRun.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { WHATS_NEW, shortVersion } from '../whatsnew.js';
  import { NEWS_HREF } from '../know/wasneu.js';
  import { actName } from '../flow/ui.svelte.js';
  import { msName, val } from '../flow/hobby/words.js';
  import { nextStars, readNextStars } from './nextstars.js';
  import { DISCOVER_KEY, discoverOf, putOff, bringBack } from './discover.js';
  import { IDEAS_KEY, TOUR_FEATURE, TOUR_HREF, LEARNED_HREF, ideasRecOf, ideasOf, learnedOf, setNot, unsetNot, setLast } from './ideen.js';
  import { tabHref } from '../tabs.js';
  import { momentName } from './momentcard.js';

  let { today, hour = 12, weekday = 3, trips = [], debriefDone = () => false, careDue = 0, inbox = 0, newsDays = 0 } = $props();

  // the data loads when the page is quiet (Heute starts as fast as before)
  let go = $state(false);
  onMount(() => {
    const open = () => (go = true);
    if ('requestIdleCallback' in window) {
      const h = requestIdleCallback(open, { timeout: 1500 });
      return () => cancelIdleCallback(h);
    }
    const h = setTimeout(open, 300);
    return () => clearTimeout(h);
  });
  const q = $derived(
    go
      ? liveQuery(async () => {
          const [fd, ns, set, learnings] = await Promise.all([featureData(), readNextStars(db, today), db.settings.bulkGet([DREAMS_KEY, DISCOVER_KEY, IDEAS_KEY, NOT_KEY]), db.learnings.toArray()]);
          return { fd, ns, set, learnings };
        })
      : null,
  );
  const d = $derived(q ? $q : null);
  const now = $derived(momentOf({ today, hour, weekday, trips, debriefDone, careDue, inbox }));
  const rec = $derived(discoverOf(d?.set[1]?.value));
  const ir = $derived(ideasRecOf(d?.set[2]?.value));
  const notForMe = $derived(notForMeOf(d?.set[3]?.value));
  const used = $derived(usedOf(d?.fd));

  const starX = $derived(d && !d.ns.hidden ? nextStars(d.ns.acts, d.ns.ctx, d.ns.stored, d.ns.tune, 1)[0] : null);
  const star = $derived(
    starX ? { id: `${starX.actId}:${starX.r.id}`, actId: starX.actId, left: starX.left, unit: starX.r.m.unit ?? '', value: starX.r.value, target: starX.r.target, progress: starX.r.progress, name: `${actName(starX.act)} · ${msName(starX.r.m)}` } : null,
  );
  const e0 = WHATS_NEW[0];
  const news = $derived(newsDays > 0 && e0 ? { version: e0.version, title: e0.title ?? '', text: e0.lead ?? e0.points?.[0]?.text ?? '' } : null);
  const dreams = $derived(storeOf(d?.set[0]?.value).dreams.length);
  // back from a tour with its debrief still open (the moment «Zurück», moment.js rule 2), and what the app learned lately
  const back = $derived(now.key === 'zurueck' && now.trip ? { id: now.trip.id, tripTitle: now.trip.title ?? '', href: tabHref('debrief', now.trip) } : null);
  const learned = $derived(d ? learnedOf(d.learnings, today) : null);
  const ideas = $derived(d ? ideasOf({ moment: now.key, today, used, notForMe, rec, ir, star, dreams, news, back, learned }) : []);
  const idea = $derived(ideas[0] ?? null);
  const total = FEATURES.length;
  const tried = $derived(used.size);

  // what the row says: every text goes through t()
  const tourF = FEATURES.find((f) => f.id === TOUR_FEATURE);
  function words(x) {
    if (x.kind === 'star') {
      return {
        title: t('Your next star: {left} to go', { left: val(x.left, x.unit) }),
        text: x.name,
        why: t('Almost there: {value} of {target}.', { value: val(x.value, x.unit), target: val(x.target, x.unit) }),
        href: `#/flow/sport/${encodeURIComponent(`act:${x.actId}`)}`,
        label: t('Open'),
      };
    }
    if (x.kind === 'back') {
      return {
        title: t('Debrief of your last tour'),
        text: x.tripTitle,
        why: t('You are back from this tour. A short debrief teaches the app what to pack next time.'),
        href: x.href,
        label: t('Open'),
      };
    }
    if (x.kind === 'learned') {
      return {
        title: t('New learned from your debriefs'),
        text: x.rule,
        why: tn(x.n, '{n} new learning in the last weeks.', '{n} new learnings in the last weeks.'),
        href: LEARNED_HREF,
        label: t('Look at it'),
      };
    }
    if (x.kind === 'content') {
      return {
        title: t('Tour suggestions'),
        text: t('Mountain bike tours from the SchweizMobil network, to your filters.'),
        why: x.dreams > 0 ? tn(x.dreams, 'You keep {n} dream but never opened the tour suggestions.', 'You keep {n} dreams but never opened the tour suggestions.') : t('You never opened the tour suggestions.'),
        href: TOUR_HREF,
        label: t('Look at it'),
      };
    }
    if (x.kind === 'new') {
      return { title: x.title ? t(x.title) : t('New in the app'), text: x.text ? t(x.text) : '', why: t('New in {v}.', { v: shortVersion(x.version) }), href: NEWS_HREF, label: t('Look at it') };
    }
    return { title: t(x.feature.title), text: t(x.feature.text), why: t('Fits {moment} and you never opened it.', { moment: t(momentName(now.key)) }), feature: x.feature, label: t('Try it') };
  }
  const w = $derived(idea ? words(idea) : null);

  // the day's first idea is remembered, so tomorrow another one comes first
  $effect(() => {
    if (idea && ir.last?.id !== idea.id && ir.last?.day !== today) db.settings.put({ key: IDEAS_KEY, value: setLast(ir, today, idea.id) });
  });

  const view = (x) => (x.kind === 'content' ? goFeature(tourF) : x.kind === 'feature' ? goFeature(x.feature) : (location.hash = words(x).href));
  const saveRec = (r) => db.settings.put({ key: DISCOVER_KEY, value: r });
  const saveIr = (r) => db.settings.put({ key: IDEAS_KEY, value: r });
  /** Later: back tomorrow, with Undo. */
  async function later(x) {
    const before = rec;
    await saveRec(putOff(rec, x.id, today));
    offerDone(t('{name} is back tomorrow.', { name: words(x).title }), () => saveRec(before.later[x.id] ? before : bringBack(before, x.id)));
  }
  /** Not for me: a function goes into the list of «What the app can do» (ruhig/weniger.js), the other ideas into this record. */
  async function notMe(x) {
    const name = words(x).title;
    if (x.kind === 'feature' || x.kind === 'content') {
      await db.settings.put({ key: NOT_KEY, value: setNotForMe(notForMe, x.id, '', today) });
      offerDone(t('{name} does not come again.', { name }), () => db.settings.put({ key: NOT_KEY, value: unsetNotForMe(notForMe, x.id) }));
    } else {
      await saveIr(setNot(ir, x.id, today));
      offerDone(t('{name} does not come again.', { name }), () => saveIr(unsetNot(ir, x.id)));
    }
  }
  const setOff = (off) => saveRec({ ...rec, off });

  let more = $state(false);
  let Sheet = $state(null);
  async function openMore() {
    Sheet ??= (await import('./IdeenSheet.svelte')).default;
    more = true;
  }
</script>

{#if idea && w}
  <section class="ir" aria-labelledby="ir-h" data-ideas-row data-idea={idea.id}>
    <div class="m">
      <h2 id="ir-h" class="k"><Sparkles size={14} aria-hidden="true" />{t('Discover today')}</h2>
      <p class="x"><b>{w.title}</b></p>
      {#if w.text}<p class="tx">{w.text}</p>{/if}
      <p class="why" data-idea-why>{w.why}</p>
      <p class="acts">
        <button type="button" class="btn sm hi" onclick={() => view(idea)} data-idea-go>{w.label}</button>
        <button type="button" class="btn btn-link" onclick={openMore} data-ideas-more>{t('More ideas')}</button>
      </p>
    </div>
    <button type="button" class="x-btn" onclick={() => later(idea)} aria-label={t('Later|discover')} title={t('Later|discover')} data-idea-later><X size={16} aria-hidden="true" /></button>
  </section>
{/if}

{#if more && Sheet}
  <Sheet {ideas} {words} {tried} {total} off={rec.off} onview={view} onlater={later} onnot={notMe} onoff={setOff} onclose={() => (more = false)} />
{/if}

<style>
  .ir {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 12px 0 0;
    padding: 10px 6px 10px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2, var(--paper));
    box-sizing: border-box;
  }
  .m {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .k {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font: 700 var(--fs-small) / 1.3 var(--font-body);
    color: var(--hi);
  }
  .x,
  .tx,
  .why {
    margin: 0;
    overflow-wrap: break-word;
  }
  .x {
    color: var(--ink);
  }
  .tx {
    color: var(--ink);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .why {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 4px 0 0;
  }
  .x-btn {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
