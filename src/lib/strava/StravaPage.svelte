<script>
  /**
   * v0.116.0 «Strava-Verbindung» (E3, mockups S1–S3 approved by Noah 12.10.2026 13:39): Velo › Pflege › Strava.
   * - S1 not connected on this device: the three steps Garmin → Strava → Pack Generator, «Mit Strava
   *   verbinden», what happens afterwards, and «Mehr › Datei importieren (Reserve)» (decision 5a).
   * - S2 right after connecting: the first fetch takes every old ride (decision 3b) and shows what it
   *   found: already there (CSV), already in the km (before a bike's start value), newly assigned, to
   *   check, the km per bike.
   * - S3 connected: «Jetzt holen», the two settings (decisions 1a, 2a), Strava bike ↔ app bike (same
   *   names connected, changeable, «Zählt nicht»), the questions «Velo in Strava geändert» (4b),
   *   the file import as reserve and «Trennen» (the rides stay, unless you choose otherwise).
   * Everything is a suggestion and changeable at any time.
   */
  import { untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { RefreshCw, Link2, Lock, Copy, Check, Bike, FileText, Bell, ArrowRight, Unlink, ChevronRight, Lightbulb } from '@lucide/svelte';
  import VeloHead from '../bikes/VeloHead.svelte';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { RULES_KEY, saveRules } from '../kmbookdb.js';
  import { entryId } from '../kmbook.js';
  import { errorText } from '../stravasync.js';
  import { strava, fetchNow, connect, disconnect, afterConnect, savePrefs, autoAssign, undoAutoAssign, autoText, CHECK_HASH } from './client.svelte.js';
  import { UNDO_MS } from '../ui/undo.js';
  import StravaChanges from './StravaChanges.svelte';
  import Skeleton from '../ui/Skeleton.svelte';
  import { t, tn, num, dateOf, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';

  let { bikeId = null } = $props();

  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bookQ = liveQuery(() => db.kmBook.toArray());
  const rulesQ = liveQuery(() => db.settings.get(RULES_KEY));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const entries = $derived($bookQ ?? []);
  const rules = $derived($rulesQ?.value ?? []);
  const nameOf = (id) => bikes.find((b) => b.id === id)?.name ?? '–';
  const care = $derived(bikesHash({ tab: 'care', bike: bikeId, open: !!bikeId }));
  const crumbs = $derived([{ label: t('Bike'), href: bikesHash({ tab: 'setup', bike: bikeId }) }, { label: t('Care|tab'), href: care }]);
  const fileImport = $derived(bikesHash({ tab: 'care', bike: bikeId, view: 'import' }));
  const prefs = $derived(strava.prefs);
  const fromStrava = $derived(entries.filter((e) => e.source === 'strava'));
  const withId = $derived(entries.filter((e) => e.stravaId && e.state !== 'removed').length);
  const waiting = $derived(fromStrava.filter((e) => e.state === 'open').length);

  const timeOf = (iso) => {
    const d = new Date(iso);
    const hm = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    return localDay(d) === localDay() ? t('today {time}', { time: hm }) : `${dateOf(localDay(d))} ${hm}`;
  };

  /* ---------- S2: the first fetch right after connecting ---------- */
  let summary = $state(null);
  let firstBusy = $state(false);
  let started = false;
  $effect(() => {
    if (strava.justConnected && strava.key && !started) {
      started = true;
      first();
    }
  });
  async function first() {
    strava.justConnected = false;
    firstBusy = true;
    await afterConnect();
    const last = await fetchNow();
    firstBusy = false;
    if (last) summary = last;
    rematch();
  }
  const per = $derived(Object.entries(summary?.perBike ?? {}).sort((a, b) => b[1].km - a[1].km));
  const seg = (n) => (summary?.counts.found ? `${Math.max(n ? 1 : 0, Math.round((n / summary.counts.found) * 1000) / 10)}%` : '0');

  /* ---------- S3 ---------- */
  let fetched = $state(null);
  async function now() {
    fetched = null;
    fetched = await fetchNow();
    rematch();
  }

  // Gesamttest 20.10.2026 B1 (Noah «1a»): rides whose Strava bike now has an app bike of the same name
  // (or a rule) are assigned on opening, after a fetch and after a change below, with «Undo».
  let auto = $state(null); // { n, put }
  let autoTimer;
  function rematch() {
    autoAssign(db)
      .then((r) => {
        if (!r?.n) return;
        clearTimeout(autoTimer);
        auto = r;
        autoTimer = setTimeout(() => (auto = null), UNDO_MS);
      })
      .catch(() => {});
  }
  async function undoAuto() {
    const put = $state.snapshot(auto?.put ?? []);
    const bikes0 = $state.snapshot(auto?.bikes ?? []);
    auto = null;
    if (put.length) await undoAutoAssign(db, put, bikes0);
  }
  $effect(() => {
    // right after connecting, the first fetch comes first (first() looks again after it)
    if (!untrack(() => strava.justConnected)) rematch();
    return () => clearTimeout(autoTimer);
  });
  const setPref = (patch) => savePrefs(db, patch);

  /** Strava bike ↔ app bike: a gear rule (the import's rules) when it is not the bike of the same name; «Zählt nicht»: ignore. */
  const norm = (x) => String(x ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const sameName = (g) => bikes.find((b) => norm(b.name) === norm(g.name) && norm(g.name)) ?? null;
  const ruleOf = (g) => rules.find((r) => r.kind === 'gear' && norm(r.value) === norm(g.name)) ?? null;
  function mapOf(g) {
    if (prefs.ignore.includes(String(g.id))) return { value: 'none', by: 'user' };
    const r = ruleOf(g);
    if (r) return { value: r.bikeIds[0] ?? '', by: 'user' };
    const s = sameName(g);
    return s ? { value: s.id, by: 'name' } : { value: '', by: null };
  }
  async function setMap(g, value) {
    const id = String(g.id);
    const ignore = prefs.ignore.filter((x) => x !== id);
    let next = rules.filter((r) => !(r.kind === 'gear' && norm(r.value) === norm(g.name)));
    if (value === 'none') ignore.push(id);
    else if (!(value && sameName(g)?.id === value)) next = [...next, { id: entryId(), kind: 'gear', value: g.name, bikeIds: value ? [value] : [] }];
    await saveRules(db, JSON.parse(JSON.stringify(next)));
    await savePrefs(db, { ignore });
    rematch();
  }
  const gearSub = (g) => [g.primary ? t('main bike in Strava') : '', g.retired ? t('retired in Strava') : '', g.km != null ? t('{km} km in Strava', { km: num(g.km) }) : ''].filter(Boolean).join(' · ');

  /* ---------- Trennen ---------- */
  let asking = $state(false);
  let parting = $state(false);
  async function part(removeRides) {
    parting = true;
    const ok = await disconnect({ removeRides });
    parting = false;
    if (ok) {
      asking = false;
      summary = null;
    }
  }
</script>

{#snippet fileRow()}
  <a class="orow" href={fileImport}><span class="ib"><FileText size={18} aria-hidden="true" /></span><span class="m"><b>{t('Import a file (reserve)')}</b><small>{t('Strava export or Garmin files, as before · in case Strava does not work once')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
{/snippet}

{#snippet err()}
  {#if strava.error}<p class="serr" role="alert">{t(errorText(strava.error))}</p>{/if}
{/snippet}

<div class="sp">
  {#if !strava.key}
    <!-- S1 -->
    <VeloHead {crumbs} here="Strava" title={t('Connect Strava')} sub={t('So that every ride lands on the right bike by itself. Voluntary, you can disconnect at any time.')} />
    <div class="cols">
      <div class="main">
        <section class="vsec" aria-labelledby="s1-h">
          <div class="vh"><div class="vh-t"><h2 id="s1-h">{t('How every ride gets onto the right bike')}</h2><p class="vh-s">{t('three steps, the app does only the last one')}</p></div></div>
          <ol class="card steps">
            {#each [['Garmin', t('One profile per bike, e.g. «Gravel» or «MTB».')], ['Strava', t('Picks the default bike per ride type. You can change it per ride.')], ['Pack Generator', t('Fetches the rides with their bike. The km land on the right bike.')]] as [name, text], i (i)}
              <li><span class="sn" aria-hidden="true">{i + 1}</span><b>{name}</b><span>{text}</span></li>
              {#if i < 2}<li class="arr" aria-hidden="true"><ArrowRight size={16} /></li>{/if}
            {/each}
          </ol>
        </section>
        <div class="card cn">
          <button type="button" class="btn hi big" onclick={() => connect()}><Link2 size={18} aria-hidden="true" />{t('Connect with Strava')}</button>
          <p class="lock"><Lock size={14} aria-hidden="true" /><span><b>{t('Only your rides, read only. Disconnect at any time.')}</b> {t('The app writes nothing to Strava and sees no photos or contacts.')}</span></p>
          {@render err()}
        </div>
      </div>
      <aside class="side">
        <section class="vsec" aria-labelledby="s1a-h">
          <div class="vh"><div class="vh-t"><h2 id="s1a-h">{t('What happens afterwards')}</h2><p class="vh-s">{t('you see everything before it counts')}</p></div></div>
          <ul class="card vlist">
            <li class="orow"><span class="ib"><RefreshCw size={18} aria-hidden="true" /></span><span class="m"><b>{t('Fetch all old rides')}</b><small>{t('once, when you first connect')}</small></span></li>
            <li class="orow"><span class="ib"><Copy size={18} aria-hidden="true" /></span><span class="m"><b>{t('Recognise doubles')}</b><small>{t('rides from your CSV import do not count twice')}</small></span></li>
            <li class="orow"><span class="ib"><Check size={18} aria-hidden="true" /></span><span class="m"><b>{t('Before the bike start stays aside')}</b><small>{t('already in the km you entered')}</small></span></li>
            <li class="orow"><span class="ib"><Bike size={18} aria-hidden="true" /></span><span class="m"><b>{t('New rides by themselves')}</b><small>{t('when the app opens, or only with the button')}</small></span></li>
          </ul>
        </section>
        <section class="vsec" aria-labelledby="s1m-h">
          <div class="vh"><div class="vh-t"><h2 id="s1m-h">{t('More')}</h2></div></div>
          <div class="card vlist">{@render fileRow()}</div>
        </section>
      </aside>
    </div>
  {:else if firstBusy || summary}
    <!-- S2 -->
    <VeloHead {crumbs} here="Strava" title={firstBusy ? t('Fetching all rides …') : t('All rides fetched')} sub={firstBusy ? t('Once, all old rides. This takes a moment.') : `${prefs.athlete ? `${t('Connected as «{name}»', { name: prefs.athlete })} · ` : ''}${t('first fetch done, {when}', { when: timeOf(summary.at) })}`} />
    {#if firstBusy}
      <p class="card wait" role="status"><RefreshCw size={18} aria-hidden="true" />{t('Fetching rides …')}</p>
      <!-- FE9 «Ruhiges Laden» (Noah 13.10.2026): the summary's place held by calm bars, nothing jumps -->
      <div class="skw"><Skeleton rows={5} /></div>
    {:else}
      {@const c = summary.counts}
      <div class="cols">
        <div class="main">
          <section class="card sum" aria-labelledby="s2-h">
            <h2 id="s2-h" class="found"><span class="bignum num">{num(c.found)}</span> {t('rides found')}</h2>
            <div class="sbar" aria-hidden="true"><i class="k" style:width={seg(c.known)}></i><i class="s" style:width={seg(c.inStart)}></i><i class="a" style:width={seg(c.assigned)}></i><i class="c" style:width={seg(c.check)}></i></div>
            <ul class="srows">
              <li><span class="dot k" aria-hidden="true"></span><span class="m"><b><span class="num">{num(c.known)}</span> {t('already there')}</b><small>{t('recognised from your CSV import, do not count twice')}</small></span><span class="chip">{t('not counted')}</span></li>
              <li><span class="dot s" aria-hidden="true"></span><span class="m"><b><span class="num">{num(c.inStart)}</span> {t('already in the km')}</b><small>{t("before the bike's start value")}</small></span><span class="chip">{t('not counted')}</span></li>
              <li><span class="dot a" aria-hidden="true"></span><span class="m"><b><span class="num">{num(c.assigned)}</span> {t('newly assigned')}</b><small>{t('with their Strava bike')}</small></span><span class="chip ok">{t('counted')}</span></li>
              <li><span class="dot c" aria-hidden="true"></span><span class="m"><b><span class="num">{num(c.check)}</span> {t('to check')}</b><small>{t('no bike in Strava · with a suggestion')}</small></span>{#if c.check}<a class="btn sm" href={CHECK_HASH}>{t('Check')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}</li>
            </ul>
            {#if c.other || c.ignored}<p class="quiet">{[c.other ? tn(c.other, 'Left out: {n} other activity (runs, hikes …).', 'Left out: {n} other activities (runs, hikes …).') : '', c.ignored ? tn(c.ignored, '{n} ride of a bike that does not count.', '{n} rides of bikes that do not count.') : ''].filter(Boolean).join(' ')}</p>{/if}
          </section>
          <p class="tip"><Lightbulb size={16} aria-hidden="true" />{t('Nothing is fixed. You can give every ride to another bike later or choose «Does not count».')}</p>
        </div>
        <aside class="side">
          <section class="vsec" aria-labelledby="s2p-h">
            <div class="vh"><div class="vh-t"><h2 id="s2p-h">{t('Per bike')}</h2><p class="vh-s">{tn(summary.assigned, 'only the {n} new ride', 'only the {n} new rides')}</p></div></div>
            {#if per.length}
              <ul class="card vlist">
                {#each per as [id, p] (id)}
                  {@const b = bikes.find((x) => x.id === id)}
                  <li class="orow"><span class="ib"><Bike size={18} aria-hidden="true" /></span><span class="m"><b>{nameOf(id)}</b><small class="num">{[tn(p.n, '+{n} ride', '+{n} rides'), b?.km != null ? t('now {km} km', { km: num(b.km) }) : ''].filter(Boolean).join(' · ')}</small></span><span class="plus num">+{num(Math.round(p.km))} km</span></li>
                {/each}
              </ul>
            {:else}
              <p class="card quiet pad">{t('No new km: every ride was already counted.')}</p>
            {/if}
          </section>
          <div class="fb">
            <button type="button" class="btn hi" onclick={() => (summary = null)}>{t('Done')}</button>
            {#if c.check}<a class="btn" href={CHECK_HASH}>{tn(c.check, 'See {n} to check', 'See {n} to check')}</a>{/if}
          </div>
          <p class="quiet">{t('Undo: under Strava › Disconnect you can remove all fetched rides again.')}</p>
        </aside>
      </div>
    {/if}
    {@render err()}
  {:else}
    <!-- S3 -->
    <VeloHead {crumbs} here="Strava" title="Strava" sub={t('Fetch rides with their bike from Strava · everything changeable')} />
    <div class="cols">
      <div class="main">
        <div class="card conn">
          <span class="on" aria-hidden="true"></span>
          <span class="m">
            <b>{t('Connected')} · {prefs.lastSync ? t('last fetched {when}', { when: timeOf(prefs.lastSync) }) : t('not fetched yet')}</b>
            <small class="num">{prefs.athlete ? `${t('as «{name}»', { name: prefs.athlete })} · ` : ''}{tn(withId, '{n} ride', '{n} rides')}</small>
          </span>
          <button type="button" class="btn hi" disabled={strava.busy} onclick={now}><RefreshCw size={16} aria-hidden="true" />{strava.busy ? t('Fetching …') : t('Fetch now')}</button>
          {#if fetched}
            <p class="got" role="status">{fetched.n ? tn(fetched.n, '{n} new ride fetched', '{n} new rides fetched') : t('No new rides')}{#if fetched.km}{' · '}+{num(Math.round(fetched.km))} km{/if}{#if fetched.check}{' · '}{tn(fetched.check, '{n} to check', '{n} to check')}{/if}</p>
          {/if}
          {@render err()}
        </div>
        {#if auto}
          <p class="got auto" role="status"><span>{autoText(auto)}</span><button type="button" class="ulnk" onclick={undoAuto}>{t('Undo')}</button></p>
        {/if}
        {#if waiting}
          <a class="card wlink" href={CHECK_HASH}><span class="m"><b>{tn(waiting, '{n} ride to check', '{n} rides to check')}</b><small>{t('no bike in Strava · one tap «Fits»')}</small></span><ChevronRight size={18} aria-hidden="true" /></a>
        {/if}

        <section class="vsec" aria-labelledby="s3f-h">
          <div class="vh"><div class="vh-t"><h2 id="s3f-h">{t('Fetching rides')}</h2><p class="vh-s">{t('when the app looks at Strava')}</p></div></div>
          <div class="card vlist" role="radiogroup" aria-labelledby="s3f-h">
            <label class="opt"><input type="radio" name="sfetch" checked={prefs.fetch === 'auto'} onchange={() => setPref({ fetch: 'auto' })} /><span class="m"><b>{t('Automatically when opening')} <span class="rec">{t('recommended')}</span></b><small>{t('at most every 15 minutes · «Fetch now» always works')}</small></span></label>
            <label class="opt"><input type="radio" name="sfetch" checked={prefs.fetch === 'button'} onchange={() => setPref({ fetch: 'button' })} /><span class="m"><b>{t('Only with the button')}</b><small>{t('only when you tap «Fetch now»')}</small></span></label>
          </div>
        </section>

        <section class="vsec" aria-labelledby="s3n-h">
          <div class="vh"><div class="vh-t"><h2 id="s3n-h">{t('Ride without a bike')}</h2><p class="vh-s">{t('when no bike is set in Strava')}</p></div></div>
          <div class="card vlist" role="radiogroup" aria-labelledby="s3n-h">
            <label class="opt"><input type="radio" name="snobike" checked={prefs.noBike === 'check'} onchange={() => setPref({ noBike: 'check' })} /><span class="m"><b>{t('To check, with a suggestion')} <span class="rec">{t('recommended')}</span></b><small>{t('the app suggests a bike, you tap «Fits» once')}</small></span></label>
            <label class="opt"><input type="radio" name="snobike" checked={prefs.noBike === 'auto'} onchange={() => setPref({ noBike: 'auto' })} /><span class="m"><b>{t('The app assigns by ride type')}</b><small>{t('e.g. «Gravel Ride» → the bike you mostly ride for it · you can change it later')}</small></span></label>
          </div>
        </section>

        <section class="vsec" aria-labelledby="s3m-h">
          <div class="vh"><div class="vh-t"><h2 id="s3m-h">{t('Bike in Strava ↔ bike in the app')}</h2><p class="vh-s">{t('same names are connected already · tap to change')}</p></div></div>
          {#if prefs.gear.length}
            <ul class="card vlist">
              {#each prefs.gear as g (g.id)}
                {@const m = mapOf(g)}
                <li class="map" data-gear={g.id}>
                  <span class="gi" aria-hidden="true"><Bike size={16} /></span>
                  <span class="m"><b>{g.name}</b>{#if gearSub(g)}<small>{gearSub(g)}</small>{/if}</span>
                  <select class="sel" aria-label={t('App bike for «{gear}»', { gear: g.name })} value={m.value} onchange={(e) => setMap(g, e.currentTarget.value)}>
                    <option value="">{t('no bike: to check')}</option>
                    {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
                    <option value="none">{t('Does not count')}</option>
                  </select>
                  {#if m.by}<span class="chip" class:ok={m.by === 'name'}>{m.by === 'name' ? t('same name') : t('by you')}</span>{/if}
                </li>
              {/each}
            </ul>
          {:else}
            <p class="card quiet pad">{t('Your Strava bikes appear here after the first fetch.')}</p>
          {/if}
        </section>
      </div>

      <aside class="side">
        <section class="vsec" aria-labelledby="s3c-h">
          <div class="vh"><div class="vh-t"><h2 id="s3c-h">{t('Bike changed in Strava')}</h2></div></div>
          <StravaChanges />
          <div class="card vlist">
            <div class="orow"><span class="ib"><Bell size={18} aria-hidden="true" /></span><span class="m"><b>{t('Always ask')}</b><small>{t('A notice on Today and at the bike: «Take over» or «Keep»')}</small></span></div>
          </div>
        </section>
        <section class="vsec" aria-labelledby="s3x-h">
          <div class="vh"><div class="vh-t"><h2 id="s3x-h">{t('More')}</h2></div></div>
          <div class="card vlist">{@render fileRow()}</div>
        </section>
        {#if asking}
          <div class="card part" role="group" aria-label={t('Disconnect Strava')}>
            <b>{t('Disconnect Strava?')}</b>
            <p class="quiet">{t('The app stops fetching. Strava is told to withdraw the access.')}</p>
            <button type="button" class="btn hi" disabled={parting} onclick={() => part(false)}>{t('Disconnect, keep the rides')}</button>
            {#if fromStrava.length}<button type="button" class="btn" disabled={parting} onclick={() => part(true)}>{tn(fromStrava.length, 'Disconnect and remove {n} fetched ride', 'Disconnect and remove {n} fetched rides')}</button>{/if}
            <button type="button" class="lnk" onclick={() => (asking = false)}>{t('Cancel')}</button>
          </div>
        {:else}
          <p class="off"><button type="button" class="lnk" onclick={() => (asking = true)}><Unlink size={16} aria-hidden="true" />{t('Disconnect')}</button><small>{t('Fetched rides stay if you want · you are asked.')}</small></p>
        {/if}
      </aside>
    </div>
  {/if}
</div>

<style>
  .sp {
    margin: 0 0 24px;
  }
  .cols,
  .main,
  .side {
    min-width: 0;
  }
  .main,
  .side {
    display: grid;
    gap: 16px;
    align-content: start;
  }
  .cols {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 1000px) {
    .cols {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      gap: 24px;
      align-items: start;
    }
  }
  .vsec {
    margin: 0;
  }
  .vh {
    margin: 0 2px 10px;
  }
  .vh h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .vh-s {
    margin: 2px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .vlist {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .vlist > :global(* + *) {
    border-top: 1px solid var(--line);
  }
  .orow,
  .opt,
  .map {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 60px;
    padding: 8px 0;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  .orow:visited {
    color: var(--ink);
  }
  a.orow:hover b {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .orow :global(.chev) {
    flex: none;
    color: var(--ink-3);
  }
  .ib {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .m {
    flex: 1 1 12em;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .m b {
    font-weight: 500;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
    overflow-wrap: break-word;
  }
  /* S1: the three steps side by side, under each other on a phone */
  .steps {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 8px;
    align-items: stretch;
    margin: 0;
    padding: 14px;
    list-style: none;
  }
  .steps li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .steps li > span:last-child {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .steps li.arr {
    display: grid;
    place-items: center;
    padding: 0;
    background: none;
    color: var(--ink-3);
  }
  .sn {
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--hi);
    color: var(--hi-ink);
    font: 600 var(--fs-small) / 1 var(--font-body);
  }
  @media (max-width: 720px) {
    .steps {
      grid-template-columns: minmax(0, 1fr);
    }
    .steps li.arr {
      transform: rotate(90deg);
      min-height: 24px;
    }
  }
  .cn,
  .conn,
  .part {
    display: grid;
    gap: 12px;
    padding: 16px;
  }
  .big {
    justify-content: center;
    width: 100%;
    min-height: 52px;
  }
  .lock {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lock b {
    color: var(--ink);
    font-weight: 600;
  }
  .serr {
    margin: 0;
    color: var(--bad);
    font-weight: 500;
  }
  .skw {
    margin-top: 12px;
  }
  .wait {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    padding: 16px;
  }
  /* S2 */
  .sum {
    padding: 16px;
  }
  .found {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 12px;
    color: var(--ink-2);
    font: 500 var(--fs-body) / 1.2 var(--font-body);
  }
  .found .bignum {
    color: var(--ink);
    font: 700 var(--fs-display) / 1 var(--font-body);
  }
  .sbar {
    display: flex;
    gap: 2px;
    height: 10px;
    margin: 0 0 6px;
    border-radius: 5px;
    overflow: hidden;
    background: var(--paper-2);
  }
  .sbar i,
  .dot {
    display: block;
    flex: none;
  }
  .k {
    background: var(--hi);
  }
  .s {
    background: var(--line-strong);
  }
  .a {
    background: var(--warn);
  }
  .c {
    background: var(--bad);
  }
  .srows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .srows li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .srows li:last-child {
    border-bottom: 0;
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .chip {
    flex: none;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
  }
  .chip.ok,
  .rec {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .rec {
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 999px;
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
    white-space: nowrap;
  }
  .tip {
    display: flex;
    gap: 8px;
    margin: 0 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .plus {
    flex: none;
    color: var(--ok);
    font-weight: 600;
  }
  .fb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .quiet {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pad {
    padding: 16px;
  }
  /* S3 */
  .conn {
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
  }
  .conn > .got,
  .conn > .serr {
    grid-column: 1 / -1;
  }
  .on {
    width: 12px;
    height: 12px;
    border: 3px solid var(--ok-soft);
    border-radius: 50%;
    background: var(--ok);
  }
  .got {
    margin: 0;
    color: var(--ok);
    font-weight: 500;
  }
  .got.auto {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    padding: 4px 16px;
    border-radius: var(--radius-card);
    background: var(--ok-soft);
    color: var(--ink);
  }
  .ulnk {
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  @media (max-width: 560px) {
    .conn {
      grid-template-columns: auto minmax(0, 1fr);
    }
    .conn > .btn {
      grid-column: 1 / -1;
      justify-content: center;
    }
  }
  .wlink {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px 16px;
    border-color: var(--warn);
    background: var(--warn-soft);
    color: var(--ink);
    text-decoration: none;
  }
  .opt {
    cursor: pointer;
  }
  .opt input {
    flex: none;
    width: 22px;
    height: 22px;
    margin: 0;
    accent-color: var(--hi);
  }
  .map {
    flex-wrap: wrap;
  }
  .gi {
    flex: none;
    color: var(--ink-2);
  }
  .map .m {
    flex: 1 1 10em;
  }
  .map select {
    flex: 0 1 220px;
    min-width: 0;
    min-height: 44px;
  }
  @media (max-width: 560px) {
    .map select {
      flex: 1 1 100%;
    }
  }
  .lnk {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body) / 1.3 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .off {
    display: grid;
    gap: 2px;
    margin: 0;
  }
  .off small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .part .btn {
    justify-content: center;
  }
</style>
