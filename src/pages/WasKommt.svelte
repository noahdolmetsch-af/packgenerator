<script>
  /**
   * Paket N #68 «Projekt-Ablage als Seite in der App» (19.10.2026): Ich › Was kommt (#/me/next).
   * The packages of the plan (wascommt.js) in three groups: live, being built, later. A short text
   * says what a package is and that you test it with a link before it goes live.
   */
  import { PACKAGES, packagesNow } from '../lib/wascommt.js';
  import { t } from '../lib/i18n.svelte.js';
  import { Check, Hammer, CalendarClock, Star, ChevronRight } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import '../lib/ich/ich.css';

  // svelte-ignore non_reactive_update
  const groups = packagesNow(typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0', PACKAGES);
  const SECS = [
    { key: 'work', title: 'Being built now', sub: 'You get a test link for each package; it goes live after your «ok».', icon: Hammer },
    { key: 'later', title: 'Later, in this order', sub: 'The order can change; tell Claude if something is more urgent.', icon: CalendarClock },
    { key: 'live', title: 'Already live', sub: 'These packages are in the app.', icon: Check },
  ];
</script>

<div class="ich-page wk" data-page="was-kommt">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('What comes next')} sub={t('The plan of the app, package by package')} />
  <p class="wk-intro">{t('A package bundles the wishes of one area. Each one comes as its own release.')}</p>
  {#each SECS as s (s.key)}
    {#if groups[s.key].length}
      {@const I = s.icon}
      <section class="ich-sec" aria-labelledby="wk-{s.key}" data-group={s.key}>
        <div class="ich-h"><div><h2 id="wk-{s.key}">{t(s.title)} <small class="n num">{groups[s.key].length}</small></h2><p class="ich-hs">{t(s.sub)}</p></div></div>
        <ul class="card ich-list">
          {#each groups[s.key] as p (p.key)}
            <li class="ich-row" data-package={p.key}>
              <span class="ich-ib"><I size={18} aria-hidden="true" /></span>
              <span class="ich-m"><b>{t(p.title)}</b><small>{t(p.sub)}</small></span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/each}
  <ul class="card ich-list">
    <li>
      <a class="ich-row" href="#/me/news">
        <span class="ich-ib"><Star size={18} aria-hidden="true" /></span>
        <span class="ich-m"><b>{t('What is new')}</b><small>{t('What came with the last releases')}</small></span>
        <ChevronRight class="ich-chev" size={18} aria-hidden="true" />
      </a>
    </li>
  </ul>
</div>

<style>
  .wk {
    max-width: 800px;
  }
  .wk-intro {
    max-width: 65ch;
    margin: 0 0 var(--sp-4);
    color: var(--ink-2);
  }
</style>
