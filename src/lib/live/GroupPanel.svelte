<script>
  /**
   * Gruppen-Live-Karte (Noah 25.10.2026 «b»): on the live map, «Invite the group» makes a group ride and a
   * link to send by WhatsApp or SMS. Friends open it in the browser (#/gruppe/…, no app, no sign-in).
   * Only who shares is on the map; you share too only while «Share my location as» is ticked. The list
   * and the map show everyone with name, km along the route and «last seen». The group ends by itself
   * (24 h), when the ride is stopped, or with «End the group»; then every place is deleted.
   * The group is kept in settings GROUP_KEY { gid, key, del, end, name, share, mid?, mdel? }.
   * onrows(rows): the members for the live map (memberRows of group.js).
   */
  import { onDestroy, untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { Users, Share2, Copy, MessageCircle, Smartphone, X, RefreshCw, Hand } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { askDelete } from '../ui/ask.js';
  import { createGroup, readGroup, sharePlace, leaveGroup, endGroup, groupLinkOf, inviteLinks, memberRows, groupRunning, nearHome, cleanName, stillWaiting, GROUP_KEY, GROUP_EVERY_MS, GROUP_ERRORS } from './group.js';
  import { LinkError } from '../spur/link.js';
  import GroupList from './GroupList.svelte';

  let { title = '', route = null, me = null, onrows = null } = $props();

  const groupQ = liveQuery(async () => (await db.settings.get(GROUP_KEY))?.value ?? null);
  const group = $derived($groupQ === undefined ? undefined : groupRunning($groupQ) ? $groupQ : null);
  const save = (v) => (v ? db.settings.put({ key: GROUP_KEY, value: v }) : db.settings.delete(GROUP_KEY));

  let name = $state('');
  let shareMe = $state(true);
  let busy = $state(false);
  let msg = $state('');
  let places = $state([]);
  let now = $state(Date.now());
  let sentAt = 0;

  // a group that ran out: forget it (Redis deleted it already)
  $effect(() => {
    if ($groupQ && !groupRunning($groupQ)) untrack(() => save(null));
  });

  const hasLine = $derived((route?.line?.length ?? 0) > 1);
  const link = $derived(group ? groupLinkOf(group.gid, group.key) : '');
  const invite = $derived(link ? t('Ride with me: see where everyone of the group is. Open it in the browser, no app needed: {link}', { link }) : '');
  const sendTo = $derived(invite ? inviteLinks(invite) : null);
  const rows = $derived(memberRows(places, hasLine ? route : null, { now, me: group?.mid ?? null }));
  $effect(() => onrows?.(rows));
  const endTime = $derived(group ? new Date(group.end).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' }) : '');

  function fail(e) {
    if (e instanceof LinkError && e.code === 'not_found') {
      places = [];
      save(null);
      msg = t(GROUP_ERRORS.not_found);
      return;
    }
    msg = t(GROUP_ERRORS[e?.code] ?? GROUP_ERRORS.server_error);
  }

  async function make() {
    msg = '';
    const n = cleanName(name);
    if (shareMe && !n) return (msg = t('Write your name first, so the others know who you are.'));
    busy = true;
    try {
      const g = await createGroup({ title, route: hasLine ? route : null });
      await save({ ...g, name: n, share: shareMe });
      sentAt = 0;
      places = [];
    } catch (e) {
      fail(e);
    }
    busy = false;
  }

  // every 2 minutes (and at once when the group or the first place is there): send my place or read the others
  let running = false;
  async function tick(fresh = null) {
    now = Date.now();
    const g = fresh ?? untrack(() => group);
    if (!g || running || navigator.onLine === false || document.visibilityState === 'hidden') return;
    if (now - sentAt < GROUP_EVERY_MS) return;
    running = true;
    sentAt = now;
    try {
      const here = untrack(() => me);
      if (g.share && here && Number.isFinite(here.lat) && !nearHome(hasLine ? route : null, here)) {
        // «Ich warte hier» ends by itself once you ride on
        const wait = stillWaiting(g.wait, here) ? g.wait : null;
        const r = await sharePlace(g, g.mid ? { mid: g.mid, mdel: g.mdel } : null, g.name, { lat: here.lat, lon: here.lon, at: Date.now() }, { wait: !!wait });
        if (r.mid !== g.mid || (g.wait && !wait)) await save({ ...g, mid: r.mid, mdel: r.mdel, wait });
        places = r.places;
      } else {
        places = (await readGroup(g.gid, g.key, { withRoute: false })).places;
      }
      msg = '';
    } catch (e) {
      fail(e);
    }
    running = false;
  }
  const timer = setInterval(tick, 15_000);
  onDestroy(() => clearInterval(timer));
  // a new group, or the first fix: at once
  $effect(() => {
    void group?.gid;
    void (me != null);
    untrack(() => {
      sentAt = 0;
      tick();
    });
  });

  async function flipShare() {
    if (!group) return;
    const on = !group.share;
    if (on && !cleanName(group.name)) return (msg = t('Write your name first, so the others know who you are.'));
    await save({ ...group, share: on });
    if (!on && group.mid) {
      try {
        await leaveGroup(group, { mid: group.mid, mdel: group.mdel });
        places = places.filter((p) => p.m !== group.mid);
      } catch (e) {
        fail(e);
      }
      await save({ ...group, share: false, mid: null, mdel: null });
    } else sentAt = 0;
  }
  // «Ich warte hier» (Noah 26.10.2026): the others see that you wait; sent at once
  async function flipWait() {
    if (!group || !me) return;
    const g = { ...group, wait: group.wait ? null : { lat: me.lat, lon: me.lon } };
    await save(g);
    sentAt = 0;
    tick(g);
  }
  async function rename(v) {
    if (group) await save({ ...group, name: cleanName(v) });
  }

  async function end() {
    const a = await askDelete({ title: t('End the group?'), text: t('Everyone stops seeing the others, and all places of the group are deleted. The link no longer works.'), label: t('End the group') });
    if (a !== 'delete') return;
    try {
      await endGroup(group);
    } catch {
      /* gone already, or offline: the server deletes it at the latest after 24 h */
    }
    places = [];
    await save(null);
    msg = t('The group ride has ended. The places are deleted.');
  }

  let copied = $state(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      document.querySelector('[data-group-link]')?.select();
    }
  }
  async function shareSheet() {
    try {
      await navigator.share({ title: t('Group ride'), text: invite });
    } catch {
      /* closed */
    }
  }
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
</script>

<section class="grp" aria-labelledby="grp-h" data-group-panel>
  <h2 id="grp-h" class="lv-grp-h"><Users size={18} aria-hidden="true" />{t('Group ride')}</h2>
  {#if group === undefined}
    <p class="rc-note">{t('Loading…')}</p>
  {:else if !group}
    <p class="rc-note">{t('Ride with friends: they open a link in the browser, without the app, and everyone who shares is on this map with name, km and when last seen. It ends by itself after the ride, at the latest after 24 hours, and all places are deleted.')}</p>
    <label class="fld">
      <span>{t('Your name for the others')}</span>
      <input type="text" bind:value={name} maxlength="40" autocomplete="given-name" data-group-myname />
    </label>
    <label class="chk"><input type="checkbox" bind:checked={shareMe} data-group-shareme /> {t('Share my location too')}</label>
    <button type="button" class="btn hi" onclick={make} disabled={busy} data-group-invite><Users size={18} aria-hidden="true" />{busy ? t('Loading…') : t('Invite the group')}</button>
  {:else}
    <p class="rc-note">{t('Send the link to your friends. Ends by itself {when}, or when you stop the ride.', { when: endTime })}</p>
    <label class="fld">
      <span>{t('The invite link')}</span>
      <input type="text" readonly value={link} onfocus={(e) => e.currentTarget.select()} data-group-link />
    </label>
    <div class="rc-acts">
      <a class="btn sm" href={sendTo.whatsapp} target="_blank" rel="noopener noreferrer" data-group-whatsapp><MessageCircle size={16} aria-hidden="true" />{t('WhatsApp')}</a>
      <a class="btn sm" href={sendTo.sms} data-group-sms><Smartphone size={16} aria-hidden="true" />{t('SMS')}</a>
      {#if canShare}<button type="button" class="btn sm" onclick={shareSheet}><Share2 size={16} aria-hidden="true" />{t('Share…')}</button>{/if}
      <button type="button" class="btn sm" onclick={copy} data-group-copy><Copy size={16} aria-hidden="true" />{copied ? t('Copied') : t('Copy')}</button>
    </div>
    <label class="chk"><input type="checkbox" checked={!!group.share} onchange={flipShare} data-group-shareme /> {t('Share my location as')} <input class="nm" type="text" value={group.name ?? ''} maxlength="40" aria-label={t('Your name for the others')} onchange={(e) => rename(e.currentTarget.value)} /></label>
    <h3 class="lv-h3">{t('In the group')}</h3>
    <GroupList {rows} hasRoute={!!(hasLine ? route : null)} />
    <div class="rc-acts">
      {#if group.share && me}<button type="button" class="btn sm" aria-pressed={!!group.wait} onclick={flipWait} data-group-waithere><Hand size={16} aria-hidden="true" />{group.wait ? t('I ride on') : t('I am waiting here')}</button>{/if}
      <button type="button" class="btn sm" onclick={() => ((sentAt = 0), tick())} data-group-refresh><RefreshCw size={16} aria-hidden="true" />{t('Refresh')}</button>
      <button type="button" class="btn sm" onclick={end} data-group-end><X size={16} aria-hidden="true" />{t('End the group')}</button>
    </div>
  {/if}
  {#if msg}<p class="rc-note" role="status" data-group-msg>{msg}</p>{/if}
</section>

<style>
  .grp {
    display: grid;
    gap: var(--sp-3);
  }
  .lv-grp-h {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font-size: var(--fs-sub);
  }
  .fld {
    display: grid;
    gap: var(--sp-1);
  }
  .chk {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }
  .chk .nm {
    flex: 1 1 140px;
    min-width: 0;
  }
</style>
