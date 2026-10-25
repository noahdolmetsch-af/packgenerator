<script>
  /**
   * Paket P7 «Projekt-Ablage» (Noah 21.10.2026 «6a», mockups design/projekt-ablage A–C), Ich › Projekt-Ablage
   * (#/me/next, was «Was kommt» of Paket N #68): everything about the app's project on one page.
   * - the head: the guiding sentence, the state of the list and «x von y Ideen live» with a bar per state;
   * - «Für dich jetzt»: parked packages (by themselves) and your own points (ForYou.svelte);
   * - «Der Weg»: the last releases, now, and the approved packages that come next;
   * - «Nachschlagen», folded: Ideen (board, IdeaBoard.svelte), Weg und Releases, Wissen, Werkzeugkiste;
   * - «Absprünge»: the pages about the app, and the repository on GitHub.
   * The ideas come from docs/vorhaben-liste.md (the one list of plans), read when the app is built.
   */
  import listMd from '../../docs/vorhaben-liste.md?raw';
  import { parseList, countStates, wayOf, STATES } from '../lib/projekt/ablage.js';
  import { WHATS_NEW } from '../lib/whatsnew.js';
  import ForYou from '../lib/projekt/ForYou.svelte';
  import IdeaBoard from '../lib/projekt/IdeaBoard.svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, locale } from '../lib/i18n.svelte.js';
  import { Lightbulb, Route, BookOpen, Wrench, ChevronDown, ChevronRight, ExternalLink, Info, GraduationCap, Sparkles, Star, Scale, CircleHelp, LayoutGrid, Link2 } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0';
  const list = parseList(listMd);
  const counts = countStates(list.ideas);
  const way = wayOf(WHATS_NEW, list.packages, appVersion);
  const pct = (n) => (counts.total ? `${(n / counts.total) * 100}%` : '0%');
  const day = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }) : '');
  const ahead = way.filter((w) => w.kind === 'next' || w.kind === 'parked');
  const RELEASES = 12;
  const KNOW = [
    { href: '#/me/regeln', icon: Scale, name: 'How the app decides', sub: 'Every rule the app packs by' },
    { href: '#/gelernt', icon: GraduationCap, name: 'What the app learned', sub: 'From your trips and debriefs' },
    { href: '#/me/handbook', icon: CircleHelp, name: 'Handbook', sub: 'Every function in short steps' },
  ];
  const TOOLS = [
    { href: '#/me/tools', icon: Wrench, name: 'Toolbox', sub: 'PDF, photos, calculator and more' },
    { href: '#/helper', icon: Sparkles, name: 'Helper', sub: 'The AI helper of the app' },
    { href: '#/me/apps', icon: LayoutGrid, name: 'Small apps', sub: 'Small helpers in one place' },
    { href: '#/me/links', icon: Link2, name: 'Links', sub: 'Your important links' },
  ];
  const JUMPS = [
    { href: '#/features', icon: Info, name: 'What the app can do' },
    { href: '#/me/news', icon: Star, name: 'What is new' },
    { href: '#/gelernt', icon: GraduationCap, name: 'What the app learned' },
    { href: '#/helper', icon: Sparkles, name: 'Helper' },
  ];
  const GITHUB = 'https://github.com/noahdolmetsch-af/packgenerator';
</script>

<div class="ich-page pa" data-page="projekt-ablage">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Project shelf')} sub={t('Everything about the app on one page')} />

  <section class="card pa-hero" aria-labelledby="pa-hero-h" data-pa-hero>
    <p class="pa-eye">{t('Project shelf')}{list.stand ? ` · ${t('list as of {date}', { date: list.stand })}` : ''} · {t('version {version}', { version: appVersion })}</p>
    <h2 id="pa-hero-h" class="pa-title">Pack Generator</h2>
    <p class="pa-lead">«{t('An app that supports me in everyday life.')}»</p>
    <p class="pa-big" data-pa-live><b class="num">{counts.live}</b> {t('of {total} ideas live', { total: counts.total })}</p>
    <div class="pa-bar" role="img" aria-label={t('Live {live}, in progress {work}, planned {wish}, idea {idea}', counts)}>
      <span class="pa-seg pa-live" style:width={pct(counts.live)}></span><span class="pa-seg pa-work" style:width={pct(counts.work)}></span><span class="pa-seg pa-wish" style:width={pct(counts.wish)}></span><span class="pa-seg pa-idea" style:width={pct(counts.idea)}></span>
    </div>
    <ul class="pa-legend">
      {#each [...STATES].reverse() as s (s.key)}<li><span class="pa-dot pa-{s.key}" aria-hidden="true"></span>{t(s.name)} <span class="num">{counts[s.key]}</span></li>{/each}
    </ul>
  </section>

  <ForYou packages={list.packages} {appVersion} />

  <section class="ich-sec" aria-labelledby="pa-way-h" data-pa-way>
    <div class="ich-h"><div><h2 id="pa-way-h">{t('The way')}</h2><p class="ich-hs">{t('The last releases, now, and what comes next')}</p></div></div>
    <ol class="pa-way">
      {#each way as w, i (i)}
        <li class="pa-step pa-{w.kind}" data-way={w.kind}>
          <span class="pa-pt" aria-hidden="true"></span>
          <small>{w.kind === 'now' ? t('Now|way') : w.kind === 'parked' ? t('Parked|way') : w.kind === 'next' ? t('Next|way') : w.version}</small>
          <b>{w.kind === 'done' || w.kind === 'now' ? t(w.title) : w.title}</b>
        </li>
      {/each}
    </ol>
  </section>

  <section class="ich-sec" aria-labelledby="pa-look-h">
    <div class="ich-h"><div><h2 id="pa-look-h">{t('Look up|shelf')}</h2><p class="ich-hs">{t('Folded; open what you need')}</p></div></div>
    <details class="card pa-fold" data-pa-fold="ideas">
      <summary class="pa-sum"><span class="ich-ib"><Lightbulb size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Ideas')}</b><small>{t('{total} ideas · {wish} planned · {live} live', counts)}</small></span><ChevronDown class="pa-chev" size={18} aria-hidden="true" /></summary>
      <div class="pa-body"><IdeaBoard ideas={list.ideas} goals={list.goals} /></div>
    </details>
    <details class="card pa-fold" data-pa-fold="releases">
      <summary class="pa-sum"><span class="ich-ib"><Route size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Way and releases')}</b><small>{t('{n} versions · {version} {title}', { n: WHATS_NEW.length, version: WHATS_NEW[0].version, title: t(WHATS_NEW[0].title) })}</small></span><ChevronDown class="pa-chev" size={18} aria-hidden="true" /></summary>
      <div class="pa-body">
        <ol class="pa-time">
          {#each ahead as w (w.key)}
            <li class="pa-tl pa-{w.kind}"><span class="pa-pt" aria-hidden="true"></span><small>{w.kind === 'parked' ? t('Parked: goes online after your OK') : t('Next|way')}</small><b>{w.title}</b></li>
          {/each}
          {#each WHATS_NEW.slice(0, RELEASES) as r (r.version)}
            <li class="pa-tl pa-done" data-release={r.version}><span class="pa-pt" aria-hidden="true"></span><small class="num">{r.version} · {day(r.date)}</small><b>{t(r.title)}</b>{#if r.lead}<span>{t(r.lead)}</span>{/if}</li>
          {/each}
        </ol>
        <a class="pa-all" href="#/me/news">{t('All {n} versions in «What is new»', { n: WHATS_NEW.length })}<ChevronRight size={16} aria-hidden="true" /></a>
      </div>
    </details>
    <details class="card pa-fold" data-pa-fold="knowledge">
      <summary class="pa-sum"><span class="ich-ib"><BookOpen size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Knowledge')}</b><small>{t('Rules, what the app learned, handbook')}</small></span><ChevronDown class="pa-chev" size={18} aria-hidden="true" /></summary>
      <ul class="ich-list pa-links">
        {#each KNOW as k (k.href)}
          {@const I = k.icon}
          <li><a class="ich-row" href={k.href}><span class="ich-ib"><I size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(k.name)}</b><small>{t(k.sub)}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
        {/each}
      </ul>
    </details>
    <details class="card pa-fold" data-pa-fold="tools">
      <summary class="pa-sum"><span class="ich-ib"><Wrench size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t('Toolbox')}</b><small>{t('Tools, helper, small apps, links')}</small></span><ChevronDown class="pa-chev" size={18} aria-hidden="true" /></summary>
      <ul class="ich-list pa-links">
        {#each TOOLS as k (k.href)}
          {@const I = k.icon}
          <li><a class="ich-row" href={k.href}><span class="ich-ib"><I size={18} aria-hidden="true" /></span><span class="ich-m"><b>{t(k.name)}</b><small>{t(k.sub)}</small></span><ChevronRight class="ich-chev" size={18} aria-hidden="true" /></a></li>
        {/each}
      </ul>
    </details>
  </section>

  <section class="ich-sec" aria-labelledby="pa-jump-h">
    <div class="ich-h"><div><h2 id="pa-jump-h">{t('Jumps')}</h2></div></div>
    <div class="pa-jumps">
      {#each JUMPS as j (j.href + j.name)}
        {@const I = j.icon}
        <a class="pa-jump" href={j.href}><I size={16} aria-hidden="true" />{t(j.name)}</a>
      {/each}
      <a class="pa-jump pa-out" href={GITHUB} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" />{t('Code on GitHub')}</a>
    </div>
  </section>
</div>

<style>
  .pa {
    max-width: 1040px;
  }
  .pa-hero {
    padding: 18px 20px;
    margin: 0 0 24px;
    background: linear-gradient(135deg, var(--accent-soft), var(--paper));
  }
  .pa-eye {
    margin: 0;
    font-size: var(--fs-tiny);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .pa-title {
    margin: 4px 0 2px;
    font-family: var(--font-title);
    font-size: var(--fs-page);
    line-height: var(--lh-title);
  }
  .pa-lead {
    margin: 0 0 12px;
    color: var(--ink-2);
    font-style: italic;
    overflow-wrap: break-word;
  }
  .pa-big {
    margin: 0 0 6px;
    color: var(--ink-2);
  }
  .pa-big b {
    color: var(--ink);
    font-size: var(--fs-num);
  }
  .pa-bar {
    display: flex;
    height: 8px;
    max-width: 520px;
    border-radius: 999px;
    overflow: hidden;
    background: var(--paper-2);
  }
  .pa-seg {
    height: 100%;
  }
  .pa-live {
    --dot: var(--ok);
  }
  .pa-work {
    --dot: var(--warm);
  }
  .pa-wish {
    --dot: var(--st-plan);
  }
  .pa-idea {
    --dot: var(--ink-3);
  }
  .pa-seg,
  .pa-dot {
    background: var(--dot);
  }
  .pa-legend {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 8px 0 0;
    padding: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .pa-legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .pa-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  /* «Der Weg»: a line of points; on a phone one under the other */
  .pa-way {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  @media (min-width: 760px) {
    .pa-way {
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 0 8px;
      border-top: 2px solid var(--line);
      padding-top: 0;
    }
    .pa-step .pa-pt {
      margin-top: -7px;
    }
  }
  .pa-step {
    display: grid;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
    font-size: var(--fs-small);
  }
  .pa-step small,
  .pa-tl small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .pa-pt {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--ink-3);
    background: var(--paper);
  }
  .pa-done .pa-pt {
    background: var(--ok);
    border-color: var(--ok);
  }
  .pa-now .pa-pt {
    background: var(--warm);
    border-color: var(--warm);
  }
  .pa-now small {
    color: var(--warm);
    font-weight: 600;
  }
  .pa-parked .pa-pt {
    border-color: var(--warm);
  }
  .pa-fold {
    margin: 0 0 10px;
    padding: 0;
  }
  .pa-sum {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 12px 14px;
    cursor: pointer;
    list-style: none;
  }
  .pa-sum::-webkit-details-marker {
    display: none;
  }
  .pa-fold[open] :global(.pa-chev) {
    transform: rotate(180deg);
  }
  .pa-body {
    padding: 0 14px 14px;
  }
  .pa-links {
    margin: 0 4px 6px;
  }
  .pa-time {
    list-style: none;
    margin: 0;
    padding: 0 0 0 4px;
    border-left: 2px solid var(--line);
  }
  .pa-tl {
    position: relative;
    display: grid;
    gap: 2px;
    padding: 0 0 12px 18px;
    overflow-wrap: break-word;
  }
  .pa-tl .pa-pt {
    position: absolute;
    left: -7px;
    top: 2px;
  }
  .pa-tl span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pa-all {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    color: var(--ink);
  }
  .pa-jumps {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pa-jump {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 4px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    text-decoration: none;
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .pa-out {
    border-style: dashed;
  }
</style>
