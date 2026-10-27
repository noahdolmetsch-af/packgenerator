<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «1-5 alle», «6 auch für Rennen bauen 7 8 9», mockups G1–G10,
   * «1a»: an own page): Touren › Live-Karte › Gruppenfahrt (#/gruppenfahrt), the page of the group ride you
   * made on the live map. The map with the group and the meeting points, the invite link, and the event board
   * (EventBoard): help calls with sound, thunderstorm ahead, the distance to the others, ready / in camp and
   * race checkpoints, «I need help», meeting points, who has what (suggestions from your packing list), split
   * costs, and your settings for the group (night pause, start, checkpoints).
   * Your place goes out from the live map while you ride; this page sends your entries (with your last place
   * of the last 10 minutes). Kept in settings GROUP_KEY (GroupPanel.svelte).
   */
  import { onDestroy, untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { Users, Copy, MessageCircle, X, Map as MapIcon } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t, locale } from '../lib/i18n.svelte.js';
  import { askDelete } from '../lib/ui/ask.js';
  import Crumb from '../lib/flow/kit/Crumb.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import TourMap from '../lib/spur/TourMap.svelte';
  import EventBoard from '../lib/live/EventBoard.svelte';
  import { readGroup, sharePlace, endGroup, setPlan, groupLinkOf, inviteLinks, memberRows, groupRunning, cleanName, initials, GROUP_KEY, GROUP_ERRORS } from '../lib/live/group.js';
  import { everyMs, inNight, pointDots, readPlan, HELP_MIN } from '../lib/live/event.js';
  import { packSuggestions } from '../lib/live/eventpack.js';
  import { LinkError } from '../lib/spur/link.js';

  const groupQ = liveQuery(async () => (await db.settings.get(GROUP_KEY))?.value ?? null);
  const group = $derived($groupQ === undefined ? undefined : groupRunning($groupQ) ? $groupQ : null);
  const save = (v) => (v ? db.settings.put({ key: GROUP_KEY, value: v }) : db.settings.delete(GROUP_KEY));
  const fresh = () => (untrack(() => group)?.last && Date.now() - untrack(() => group).last.at < 10 * 60_000 ? untrack(() => group).last : null);

  let title = $state('');
  let route = $state(null);
  let plan = $state(readPlan(null));
  let places = $state([]);
  let loaded = $state(false);
  let msg = $state('');
  let now = $state(Date.now());
  let suggest = $state([]);
  let name = $state('');
  packSuggestions(db)
    .then((l) => (suggest = l))
    .catch(() => {});

  function fail(e) {
    if (e instanceof LinkError && e.code === 'not_found') {
      places = [];
      save(null);
      msg = t(GROUP_ERRORS.not_found);
      return;
    }
    msg = t(GROUP_ERRORS[e?.code] ?? GROUP_ERRORS.server_error);
  }

  let readAt = 0;
  let loadedFor = '';
  async function tick(force = false) {
    now = Date.now();
    const g = untrack(() => group);
    if (!g || document.visibilityState === 'hidden' || navigator.onLine === false) return;
    const first = loadedFor !== g.gid;
    if (!force && !first && now - readAt < everyMs(places.length, { night: inNight(plan?.night, now) })) return;
    readAt = now;
    try {
      const r = await readGroup(g.gid, g.key, { withRoute: first });
      if (first) {
        title = r.title;
        route = r.route;
        loadedFor = g.gid;
      }
      places = r.places;
      plan = r.plan;
      loaded = true;
      msg = '';
    } catch (e) {
      fail(e);
    }
  }
  const timer = setInterval(tick, 15_000);
  onDestroy(() => clearInterval(timer));
  $effect(() => {
    void group?.gid;
    untrack(() => tick(true));
  });

  // my entries changed: kept with the group and sent at once (with my last place, when it is fresh)
  async function changePart(patch) {
    const g = group;
    if (!g) return;
    const n = cleanName(g.name || name);
    if (!n) return (msg = t('Write your name first, so the others know who you are.'));
    const part = { ...(g.part ?? {}), ...patch };
    await save({ ...g, name: n, part });
    try {
      const here = g.share && !inNight(plan?.night, Date.now()) ? fresh() : null;
      const r = await sharePlace(g, g.mid ? { mid: g.mid, mdel: g.mdel } : null, n, here, { wait: false, part });
      await save({ ...g, name: n, part, mid: r.mid, mdel: r.mdel });
      places = r.places;
      plan = r.plan;
      msg = '';
    } catch (e) {
      fail(e);
    }
  }
  async function changePlan(p) {
    const g = group;
    if (!g) return;
    plan = p;
    try {
      await setPlan(g, p);
      await save({ ...g, plan: p });
    } catch (e) {
      fail(e);
    }
  }

  const rows = $derived(memberRows(places, route, { now, me: group?.mid ?? null }));
  const link = $derived(group ? groupLinkOf(group.gid, group.key) : '');
  const sendTo = $derived(link ? inviteLinks(t('Ride with me: see where everyone of the group is. Open it in the browser, no app needed: {link}', { link })) : null);
  const endTime = $derived(group ? new Date(group.end).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' }) : '');
  const helping = (r) => !!r.part?.help && now - Date.parse(r.part.help.at) <= HELP_MIN * 60_000;
  const dots = $derived([...pointDots(rows), ...rows.filter((r) => r.pos).map((r) => ({ id: `m-${r.m}`, kind: 'friend', cls: [r.me ? 'me' : '', r.stale ? 'stale' : '', r.wait ? 'wait' : '', helping(r) ? 'help' : ''].join(' '), pos: r.pos, n: initials(r.name), text: r.name || t('Without a name') }))]);
  const lines = $derived(route ? [{ id: 'route', pts: route.line, n: 1, src: 'plan' }] : []);
  let picked = $state(null);

  let copied = $state(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      document.querySelector('[data-gr-link]')?.select();
    }
  }
  async function end() {
    const a = await askDelete({ title: t('End the group?'), text: t('Everyone stops seeing the others, and all places of the group are deleted. The link no longer works.'), label: t('End the group') });
    if (a !== 'delete') return;
    try {
      await endGroup(group);
    } catch {
      /* gone already, or offline: the server deletes it by itself */
    }
    places = [];
    await save(null);
    msg = t('The group ride has ended. The places are deleted.');
  }
</script>

<div class="page gr-page" data-page="groupride">
  <Crumb path={[{ href: '#/trips', label: t('Trips|place') }, { href: '#/live', label: t('Live map') }]} here={t('Group ride')} />
  <h1 tabindex="-1" data-page-title>{title || t('Group ride')}</h1>
  {#if group === undefined}
    <p class="ev-muted">{t('Loading…')}</p>
  {:else if !group}
    <Empty icon={Users} title={t('No group ride running')} text={msg || t('Make a group on the live map with «Invite the group». Friends open the link in the browser, without the app.')} />
    <div><a class="btn hi" href="#/live" data-gr-to-live><MapIcon size={18} aria-hidden="true" />{t('To the live map')}</a></div>
  {:else}
    <p class="gr-sub">{t('Ends by itself {when}. Then all places are deleted.', { when: endTime })}{plan?.night ? ` ${t('Night pause {from}–{to}.', { from: plan.night.from, to: plan.night.to })}` : ''}</p>
    {#if msg}<p class="rc-note" role="status" data-gr-msg>{msg}</p>{/if}
    <div class="gr-grid">
      <div class="gr-main">
        {#if lines.length || dots.length}
          <TourMap {lines} points={dots} height={420} label={t('Group ride')} onpick={(p) => (picked = p)} />
        {/if}
        {#if picked}<p class="card gr-pick">{picked.text} <button type="button" class="tp-link" onclick={() => (picked = null)}>{t('Close')}</button></p>{/if}
        <section class="card ev-box" aria-labelledby="gr-inv-h">
          <h2 id="gr-inv-h">{t('Invite more people')}</h2>
          <label class="ev-fld"><span>{t('The invite link')}</span><input type="text" readonly value={link} onfocus={(e) => e.currentTarget.select()} data-gr-link /></label>
          <div class="ev-acts">
            <a class="btn sm" href={sendTo.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" />{t('WhatsApp')}</a>
            <button type="button" class="btn sm" onclick={copy}><Copy size={16} aria-hidden="true" />{copied ? t('Copied') : t('Copy')}</button>
          </div>
          {#if !cleanName(group.name)}
            <label class="ev-fld"><span>{t('Your name for the others')}</span><input type="text" bind:value={name} maxlength="40" onchange={() => save({ ...group, name: cleanName(name) })} data-gr-name /></label>
          {/if}
          <p class="ev-muted">{t('Your location goes out from the live map while you ride. Here you share your entries.')}</p>
        </section>
      </div>
      {#if loaded}
        <EventBoard {title} {route} {plan} {rows} me={group.mid ?? null} part={group.part ?? {}} here={fresh()} owner {now} {suggest} canSend={!!cleanName(group.name || name)} onpart={changePart} onplan={changePlan} onrefresh={() => tick(true)} />
      {:else}
        <p class="ev-muted">{t('Loading…')}</p>
      {/if}
    </div>
    <div><button type="button" class="btn sm" onclick={end} data-gr-end><X size={16} aria-hidden="true" />{t('End the group')}</button></div>
  {/if}
</div>

<style>
  .gr-page {
    display: grid;
    gap: var(--sp-4);
  }
  .gr-page h1 {
    margin: 0;
  }
  .gr-sub {
    margin: 0;
    color: var(--ink-2);
  }
  .gr-grid {
    display: grid;
    gap: var(--sp-4);
    align-items: start;
  }
  .gr-main {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
  }
  .gr-pick {
    margin: 0;
  }
  @media (min-width: 1000px) {
    .gr-grid {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    }
  }
</style>
