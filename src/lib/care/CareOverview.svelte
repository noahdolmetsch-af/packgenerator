<script>
  /**
   * v0.48.0 «Pflege-Übersicht C» (Noah, «Drei Seiten» C 1-15 a): the top of Velopflege.
   * - one ring per bike (0-100, the share of parts with nothing due; brakes and drivetrain double),
   *   km since the last check and «n due»; a tap opens that bike;
   * - «Due now»: every due row over all bikes (Gesamttest 20.10.2026 B6; was three), each with its one button and the part's flow;
   * - the problems of all bikes as one flat list (ProblemList), a milestone («8 weeks without a
   *   breakdown»), km since the last check as bars;
   * - beside: for the bike shop (the order), the costs of the year, the bike diary.
   */
  import { Trophy, Droplet, Wrench, Check, ChevronRight, BookOpen, ArrowLeftRight, Ruler, Tag, Bike, Package, TriangleAlert, RefreshCw, Gauge, Image as ImageIcon, MessageCircleQuestion } from '@lucide/svelte';
  import MessenDialog from '../bikes/MessenDialog.svelte'; // «Werte messen» W5 + W6
  import { ringScore, ringTone, dueCards, kmSinceService, calmWeeks, diary, costYear } from './overview.js';
  import { whoYear } from '../bikes/who.js';
  import ProblemList from './ProblemList.svelte';
  import Btn from '../ui/Btn.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { explain } from '../ui/explain.js';
  import { Eye, PenLine } from '@lucide/svelte';
  import { bikesHash } from '../bikes.js';
  import { openNew } from '../nav.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';
  import { chfText } from '../money.js';
  import { phone } from '../media.svelte.js';
  import { PHONE_ROWS } from '../touren/kurz.js';
  import { ChevronDown } from '@lucide/svelte';
  // SK X5 + X15 (SKX3); Impeccable (18.10.2026, Velopflege 2): the links of a due row live in its «…»,
  // the workshop booking link is entered once under «More».
  import { slotOf, PARKTOOL_URL, LINKS, linkOn } from '../sk/links.js';
  import { skLinks, watchLinks } from '../sk/linkstore.svelte.js';
  import { setOwnLink, removeOwnLink, setLinkOff } from '../sk/store.js';
  import OwnLinkSheet from '../sk/OwnLinkSheet.svelte';
  import SkToast from '../sk/SkToast.svelte';
  import { ExternalLink, CalendarCheck, EyeOff } from '@lucide/svelte';

  let { checks = [], problems = [], tasks = [], visits = [], today, bikeIdOf, onopen, ondone, onflow, onorder, onrepair, onwork } = $props();
  let messen = $state(null); // «Werte messen»: 'chain' | 'pressure'

  const bikes = $derived(checks.map((c) => c.bike));
  const rings = $derived(checks.map((c) => ({ c, ring: ringScore(c.bike, c.time, today), km: kmSinceService(c.bike) })));
  // Gesamttest 20.10.2026 B6: every due row (was 3 and «n more due»: the bar said 5, the page 3)
  const due = $derived(dueCards(checks, Infinity));
  // «Handy kürzer» (Noah 20.10.2026 «4b»): on a phone «Due now» shows PHONE_ROWS rows, then «Show n more»
  let dueAll = $state(false);
  const dueShown = $derived(phone.matches && !dueAll ? due.cards.slice(0, PHONE_ROWS) : due.cards);
  const dueProblems = $derived(due.cards.filter((d) => d.row.kind === 'repair' && d.row.task).map((d) => d.row.task.id));
  const calm = $derived(calmWeeks(tasks, bikes, today));
  const log = $derived(diary(bikes, tasks, 5));
  const year = $derived(today.slice(0, 4));
  const cost = $derived(costYear(bikes, visits, year));
  const orders = $derived(checks.filter((c) => c.order?.rows.length));
  // V6 «Kosten»: jobs of the year by the bike shop and by me, over all bikes.
  const who = $derived(
    checks.reduce(
      (a, c) => {
        const y = whoYear(c.bike, visits, tasks, year);
        return { self: a.self + y.self, shop: a.shop + y.shop };
      },
      { self: 0, shop: 0 },
    ),
  );
  let diaryOpen = $state(false);

  const short = (name) => String(name ?? '');
  const LOG_ICON = { replace: ArrowLeftRight, service: Droplet, check: Check, wash: Droplet, repair: Wrench, milestone: Trophy };
  /**
   * v0.117.0 «Knöpfe neu» (N1/N2, answer 3a): the actions of a «Due now» row, the main one first.
   * Same actions as before (Done, Record …, Replace, Check, Look at the check), plus «Open the bike».
   */
  function rowActs(d) {
    const { bike, row } = d;
    const ctx = [row.name, t('today|done'), bike.km != null ? `${num(bike.km)} km` : ''].filter(Boolean).join(' · ');
    const open = { name: t('Open the bike'), explain: t('All parts of {bike}', { bike: short(bike.name) }), icon: Bike, run: () => onopen(bike.id) };
    if (row.kind === 'time' || row.kind === 'km' || row.kind === 'service')
      return [
        { kind: 'hi', name: t('Done|task'), explain: explain('Done|task'), sub: ctx, icon: Check, run: () => ondone(bike.id, row) },
        ...(row.part
          ? [
              { name: t('Record …|care'), explain: explain('Record …|care'), icon: PenLine, run: () => onflow(bike.id, row.part, 'service') },
              { name: t('Replace|part'), explain: explain('Replace|part'), icon: ArrowLeftRight, run: () => onflow(bike.id, row.part, 'replace') },
            ]
          : []),
        open,
      ];
    // «Velo-Inspektion»: the full inspection is started, not ticked off.
    if (row.kind === 'inspect')
      return [{ kind: 'hi', name: t('Start the inspection'), explain: t('Point by point, with guides'), sub: row.name, icon: Check, run: () => (location.hash = bikesHash({ tab: 'care', view: 'inspect', bike: bike.id, level: row.level ?? 'full' })) }, open];
    // v0.137.0 (DK1): a problem due before the next ride: Done closes it, as in the problem list.
    if (row.kind === 'repair' && row.task)
      return [{ kind: 'hi', name: t('Done|task'), explain: explain('Done|task'), sub: row.name, icon: Check, run: () => onrepair(row.task, 'done') }, open];
    if (row.kind === 'part' && row.part)
      return [
        { name: t('Replace|part'), explain: explain('Replace|part'), sub: row.name, icon: ArrowLeftRight, run: () => onflow(bike.id, row.part, 'replace') },
        { name: t('Check|verb'), explain: explain('Check|verb'), icon: Eye, run: () => onflow(bike.id, row.part, 'service') },
        open,
      ];
    return [{ name: t('Look|check'), explain: explain('Look|check'), sub: row.name, icon: Eye, run: () => onopen(bike.id, 'check') }, open];
  }
  /* ---------- Impeccable (18.10.2026, Velopflege 2): the links elsewhere, in the row's «…» ---------- */
  watchLinks();
  const BOOK = slotOf('x15'); // one booking link for all bikes
  const booking = $derived(skLinks.own[BOOK] ?? null);
  const bookOn = $derived(linkOn(skLinks.off, 'x15'));
  const guideOn = $derived(linkOn(skLinks.off, 'x5'));
  let bookEdit = $state(false);
  let linkNote = $state(null);
  const away = (url) => window.open(url, '_blank', 'noopener,noreferrer');
  function hideLink(kind) {
    setLinkOff(kind, true);
    linkNote = { text: t('«{name}» no longer shown', { name: t(LINKS[kind].label) }), undo: () => setLinkOff(kind, false) };
  }
  function linkActs(d) {
    const book = bookOn && d.row.kind !== 'part'
      ? [booking
          ? { name: t('Book a workshop appointment ↗'), explain: t('Your link, one for all bikes · opens in a new tab'), icon: CalendarCheck, run: () => away(booking.url) }
          : { name: t('Enter the link for workshop booking'), explain: t('Your link, one for all bikes'), icon: CalendarCheck, run: () => (bookEdit = true) }]
      : [];
    const guide = guideOn
      ? [
          { name: t('Guide at Park Tool ↗ (English)'), explain: t('{what} · opens in a new tab', { what: d.row.name }), icon: ExternalLink, run: () => away(PARKTOOL_URL) },
          { name: t('Don’t show «{name}» any more', { name: t(LINKS.x5.label) }), explain: t('Comes back under Me › Appearance'), icon: EyeOff, run: () => hideLink('x5') },
        ]
      : [];
    return [...book, ...guide];
  }
  const when = (r) => (r.kind === 'part' ? t('now|due') : r.detail?.match(/overdue|überfällig/i) ? t('overdue|part') : t('due|part'));
</script>

<!-- Design-Refresh P7 (V6, Noah 12.10.2026 «v5-v10 freigabe»): «Due now» over all bikes as rows with one
     button each, the bikes as rows with a bar, the problems; right: for the bike shop, the costs of the
     year as four numbers, and «More» (diary, report a problem, workshop & receipts, record work). -->
<section class="ov" aria-label={t('Care overview')}>
  <div class="ovcols">
    <div class="ovmain">
      <section class="vsec" aria-labelledby="due-h">
        <div class="vh">
          <div class="vh-t"><h2 id="due-h">{t('Due now')}</h2><p class="vh-s">{t('over all bikes')}{#if calm != null && calm >= 2}{' · '}<Trophy size={14} aria-hidden="true" /> {tn(calm, '{n} week without a breakdown', '{n} weeks without a breakdown')}{/if}</p></div>
        </div>
        {#if due.cards.length}
          <ul class="card vlist">
            {#each dueShown as d (`${d.bike.id}:${d.row.key}`)}
              {@const acts = [...rowActs(d), ...linkActs(d)]}
              <li class="dcard {d.row.kind === 'part' ? 'bad' : 'warn'}">
                <span class="udot" class:warn={d.row.kind !== 'part'} aria-hidden="true"></span>
                <span class="m"><b class="dn">{d.row.name}</b><small class="dd">{[short(d.bike.name), d.row.detail].filter(Boolean).join(' · ')}</small></span>
                <span class="sr">{when(d.row)}</span>
                <!-- v0.117.0 «Knöpfe neu» (N1/N2): one main button, the rest behind «…», each with its explanation. -->
                <span class="rowacts">
                  <Btn kind={acts[0].kind} icon={acts[0].icon} label={acts[0].name} explain={acts[0].explain} sub={acts[0].sub} onclick={acts[0].run} />
                  <MoreActions title={[d.row.name, short(d.bike.name)].join(' · ')} label={t('More for {title}', { title: d.row.name })} actions={acts.map((a, n) => ({ ...a, current: n === 0 }))} />
                </span>
              </li>
            {/each}
          </ul>
          {#if dueShown.length < due.cards.length}
            <button type="button" class="phone-more" onclick={() => (dueAll = true)} data-due-more><ChevronDown size={16} aria-hidden="true" />{tn(due.cards.length - dueShown.length, 'Show {n} more due', 'Show {n} more due')}</button>
          {/if}
          <!-- Regeln der App (14.10.2026): the line says «open the bike», so a tap opens the bike of the next due card -->
          {#if due.total > due.cards.length}<p class="more">{#if due.next}<button type="button" class="linkbtn" onclick={() => onopen(due.next.id)}>{tn(due.total - due.cards.length, '{n} more due: open the bike', '{n} more due: open the bike')}</button>{:else}{tn(due.total - due.cards.length, '{n} more due: open the bike', '{n} more due: open the bike')}{/if}</p>{/if}
        {:else}
          <p class="card quiet">{t('Nothing due now on any bike.')}</p>
        {/if}
      </section>

      <section class="vsec" aria-labelledby="bikes-h">
        <div class="vh"><div class="vh-t"><h2 id="bikes-h">{t('Bikes')}</h2><p class="vh-s">{t('Bar = how much of the check interval is used')}</p></div></div>
        <ul class="card vlist" aria-label={t('Bikes')}>
          {#each rings as { c, ring, km } (c.bike.id)}
            {@const n = c.care.rows.length}
            <li>
              <button type="button" class="ring" onclick={() => onopen(c.bike.id)} aria-label={ring.score == null ? t('{bike}: no data yet', { bike: c.bike.name }) : t('{bike}: {score} of 100', { bike: c.bike.name, score: ring.score })}>
                <span class="ib"><Bike size={18} aria-hidden="true" /></span>
                <span class="m">
                  <b class="bn">{c.bike.name}</b>
                  <small class="num">{[c.bike.km != null ? `${num(c.bike.km)} km` : t('km not set'), n ? tn(n, '{n} due', '{n} due') : ring.score == null ? t('no data') : t('nothing due'), km ? t('{km} km since the check', { km: num(km.since) }) : ''].filter(Boolean).join(' · ')}</small>
                </span>
                <span class="mb {ringTone(ring.score)}" aria-hidden="true">{#if km}<i style:width="{Math.max(4, Math.min(100, Math.round((km.since / km.every) * 100)))}%" class:late={km.since >= km.every}></i>{/if}</span>
                <ChevronRight class="chev" size={18} aria-hidden="true" />
              </button>
            </li>
          {/each}
        </ul>
      </section>

      <ProblemList repairs={problems} {bikes} {today} {bikeIdOf} {onrepair} filterable above={dueProblems} />
    </div>

    <aside class="ovside">
      <section class="vsec" aria-labelledby="shop-h">
        <div class="vh">
          <div class="vh-t"><h2 id="shop-h">{t('Order for the bike shop')}</h2></div>
          {#if orders.length}<button type="button" class="vh-a" onclick={() => onorder(orders[0].bike.id)}>{t('Share the order')}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
        </div>
        {#if orders.length}
          <ul class="card vlist olist">
            {#each orders as c (c.bike.id)}
              <li>
                <button type="button" class="orow" onclick={() => onorder(c.bike.id)}>
                  <span class="ib"><Package size={18} aria-hidden="true" /></span>
                  <span class="m"><b>{t('Order for {bike}', { bike: short(c.bike.name) })}</b><small>{c.order.rows.slice(0, 3).map((r) => r.name).join(', ')}{c.order.rows.length > 3 ? ` + ${c.order.rows.length - 3}` : ''}</small></span>
                  <ChevronRight class="chev" size={18} aria-hidden="true" />
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="card quiet">{t('No order for the bike shop right now. Due work and problems marked «bike shop» come here by themselves.')}</p>
        {/if}
      </section>

      <section class="vsec" aria-labelledby="cost-h">
        <div class="vh"><div class="vh-t"><h2 id="cost-h">{t('Costs {year}', { year })}</h2></div></div>
        <div class="card cost">
          <dl class="tiles">
            <div><dt>{t('all bikes')}</dt><dd class="num">{chfText(Math.round(cost.total))}</dd></div>
            <div><dt>{t('bike shop|tile')}</dt><dd class="num">{who.shop}</dd></div>
            <div><dt>{t('done myself')}</dt><dd class="num">{who.self}</dd></div>
          </dl>
          <ul class="costs">
            {#each cost.rows as r (r.bike.id)}
              <li><span class="cn">{short(r.bike.name)}</span><span class="cb" aria-hidden="true"><i style:width="{cost.max ? Math.round((r.chf / cost.max) * 100) : 0}%"></i></span><span class="cv num">{chfText(r.chf)}</span></li>
            {/each}
          </ul>
        </div>
      </section>

      <section class="vsec" aria-labelledby="ovmore-h">
        <div class="vh"><div class="vh-t"><h2 id="ovmore-h">{t('More')}</h2></div></div>
        <div class="card vlist">
          <details class="dfold" bind:open={diaryOpen}>
            <summary class="orow"><span class="ib"><BookOpen size={18} aria-hidden="true" /></span><span class="m"><b id="diary-h">{t('Bike diary')}</b><small>{t('everything that was done')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
            {#if log.length}
              <ol class="diary" aria-labelledby="diary-h">
                {#each log as h, n (n)}
                  {@const I = h.milestone ? Trophy : h.start ? Tag : h.action === 'check' && h.value != null ? Ruler : LOG_ICON[h.action] ?? Wrench}
                  <li class:ms={h.milestone}>
                    <span class="dic" aria-hidden="true"><I size={15} /></span>
                    <span class="dt">
                      <small>{dateOf(h.date)}</small>
                      <b>{h.milestone ? t('{bike} has {km} km', { bike: short(h.bikeName), km: num(h.km) }) : `${h.what}${h.action !== 'wash' && h.action !== 'repair' ? `: ${h.action === 'check' && h.value != null ? `${num(h.value)} ${h.unit}`.trim() : h.action === 'replace' ? t('replaced') : h.action === 'service' ? t('serviced') : h.result === 'needed' ? t('work needed') : t('checked, OK')}` : ''}`}</b>
                      <small>{h.milestone ? t('Milestone') : [short(h.bikeName), h.by === 'shop' ? t('bike shop|by') : h.by === 'self' ? t('me|by') : '', h.km != null ? `${num(h.km)} km` : '', typeof h.chf === 'number' && h.chf > 0 ? chfText(h.chf) : ''].filter(Boolean).join(' · ')}</small>
                    </span>
                  </li>
                {/each}
              </ol>
            {:else}
              <p class="quiet">{t('Nothing recorded yet.')}</p>
            {/if}
          </details>
          <!-- v0.116.0 «Strava-Verbindung»: rides with their bike from Strava -->
          <a class="orow" href={bikesHash({ tab: 'care', view: 'strava' })}><span class="ib"><RefreshCw size={18} aria-hidden="true" /></span><span class="m"><b>Strava</b><small>{t('Rides with their bike, fetched by themselves')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
          <button type="button" class="orow" onclick={() => openNew('problem')}><span class="ib"><TriangleAlert size={18} aria-hidden="true" /></span><span class="m"><b>{t('Report a problem')}</b><small>{t('Noise, play, damage')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
          <button type="button" class="orow" onclick={onwork}><span class="ib"><Wrench size={18} aria-hidden="true" /></span><span class="m"><b>{t('Record work')}</b><small>{t('Pick the bike and the part')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
          <!-- «Werte messen» 2b: measure the chain, record the pressure -->
          <button type="button" class="orow" onclick={() => (messen = 'chain')}><span class="ib"><Ruler size={18} aria-hidden="true" /></span><span class="m"><b>{t('Measure the chain')}</b><small>{t('With the chain checker, with a forecast')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
          <button type="button" class="orow" onclick={() => (messen = 'pressure')}><span class="ib"><Gauge size={18} aria-hidden="true" /></span><span class="m"><b>{t('Record the pressure')}</b><small>{t('Front and rear, with a hint when a tyre loses air')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
          <!-- «Velo-FAQ» (Noah 19.10.2026): questions on care, breakdowns, wear and myths -->
          <a class="orow" href={bikesHash({ tab: 'care', view: 'faq' })} data-link-faq><span class="ib"><MessageCircleQuestion size={18} aria-hidden="true" /></span><span class="m"><b>{t('Bike FAQ')}</b><small>{t('Care, breakdowns and myths, with a wink')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
          <a class="orow" href={bikesHash({ tab: 'shop' })}><span class="ib"><ImageIcon size={18} aria-hidden="true" /></span><span class="m"><b>{t('Workshop & receipts')}</b></span><ChevronRight class="chev" size={18} aria-hidden="true" /></a>
          <!-- Impeccable (18.10.2026, Velopflege 2): the booking link, entered once for all bikes -->
          {#if bookOn}
            <button type="button" class="orow" data-sk-link="x15" onclick={() => (bookEdit = true)}><span class="ib"><CalendarCheck size={18} aria-hidden="true" /></span><span class="m"><b>{t('Workshop booking')}</b><small>{booking ? [booking.name, t('your link for all bikes')].filter(Boolean).join(' · ') : t('your link for all bikes · enter')}</small></span><ChevronRight class="chev" size={18} aria-hidden="true" /></button>
          {/if}
        </div>
      </section>
    </aside>
  </div>
</section>

{#if messen}<MessenDialog kind={messen} onclose={() => (messen = null)} />{/if}
{#if bookEdit}
  <OwnLinkSheet title={t('Enter a link')} context={t('your link for all bikes')} value={booking} name={t(LINKS.x15.label)} onsave={(v) => setOwnLink(BOOK, v)} onremove={booking ? () => removeOwnLink(BOOK) : null} onoff={() => hideLink('x15')} onclose={() => (bookEdit = false)} />
{/if}
<SkToast bind:note={linkNote} />

<style>
  .ov {
    margin: 0 0 8px;
  }
  .ovcols,
  .ovmain,
  .ovside {
    min-width: 0;
  }
  @media (min-width: 1000px) {
    .ovcols {
      display: grid;
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      gap: 24px;
      align-items: start;
    }
  }
  .vsec {
    margin: 0 0 24px;
  }
  .vh {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0 2px 10px;
  }
  .vh-t {
    min-width: 0;
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
  .vh-a {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) / 1.3 var(--font-body);
    cursor: pointer;
  }
  .vh-a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .vlist {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .vlist > :global(* + *) {
    border-top: 1px solid var(--line);
  }
  .dcard {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    min-height: 60px;
    padding: 14px 0;
  }
  .dcard .udot {
    background: var(--bad);
  }
  .dcard .udot.warn {
    background: var(--warn);
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
  .more {
    margin: 8px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .more .linkbtn {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent, var(--ink));
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .quiet {
    color: var(--ink-3);
  }
  p.card {
    margin: 0;
  }
  .ring,
  .orow {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 60px;
    padding: 8px 0;
    box-sizing: border-box;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    list-style: none;
  }
  .orow:visited {
    color: var(--ink);
  }
  .orow::-webkit-details-marker {
    display: none;
  }
  @media (hover: hover) {
    .ring:hover .bn,
    .orow:hover b {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
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
  .mb {
    flex: 0 1 140px;
    height: 8px;
    border-radius: 4px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .mb i {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--accent);
  }
  .mb i.late {
    background: var(--warn);
  }
  .ring :global(.chev),
  .orow :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .dfold[open] > summary :global(.chev) {
    transform: rotate(90deg);
  }
  @media (max-width: 480px) {
    .mb {
      flex-basis: 64px;
    }
  }
  .cost {
    display: grid;
    gap: 14px;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }
  .tiles > div {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-end;
    gap: 2px;
    min-width: 0;
    padding: 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .tiles dt {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .tiles dd {
    margin: 0;
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
    overflow-wrap: break-word;
  }
  .costs {
    display: grid;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .costs li {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-small);
  }
  .cn {
    overflow-wrap: break-word;
  }
  .cb {
    height: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .cb i {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .cv {
    color: var(--ink-2);
  }
  .diary {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .diary li {
    display: flex;
    gap: 10px;
  }
  .dic {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .diary .ms .dic {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .dt {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .dt b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .dt small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  /* «Handy kürzer» (Noah 20.10.2026 «4b»): the rest of «Due now» after one tap */
  .phone-more {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 44px;
    margin: var(--sp-2) 0 0;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body) / 1.3 var(--font-body);
    text-align: left;
    cursor: pointer;
  }
</style>
