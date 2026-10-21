<script>
  /**
   * Paket P3 «Warum? und Regeln» (mockup RG3): Ich › So entscheidet die App (#/me/regeln). Every rule the app
   * packs by, in groups (lib/regeln.js): when it applies, where the value comes from, whether it fits the next
   * trip, and where to change it. Selbst entschieden (Noah left RG 1–5 open, so the recommended answers):
   * a page under Me (1a); the limit is changed where the rule lives, the page links there (3b); the
   * block rules can be switched on and off right here (5a); no list «decided lately» (4b).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { PACK_RULES_KEY } from '../lib/packrules.svelte.js';
  import { rainLimit } from '../lib/rainlimit.svelte.js';
  import { editSets } from '../lib/gear/assign.js';
  import { nextTrip } from '../lib/debrief.js';
  import { ruleCatalog, filterRules, toggleRule } from '../lib/regeln.js';
  import { saveFailed } from '../lib/ui/ask.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';
  import { Search, ArrowRight, Info, Zap, ZapOff, ChevronDown } from '@lucide/svelte';
  import '../lib/ich/ich.css';
  import '../lib/trip/trip.css';

  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const packQ = liveQuery(() => db.settings.get(PACK_RULES_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const trip = $derived(nextTrip($tripsQ ?? []));
  const groups = $derived(ruleCatalog({ setsValue: $setsQ?.value ?? [], packValue: $packQ?.value ?? null, trip, rainLimit: rainLimit() }));
  let q = $state('');
  const shown = $derived(filterRules(groups, q));
  const count = $derived(shown.reduce((n, g) => n + g.rules.length, 0));
  let status = $state('');
  let opened = $state({}); // the groups opened by hand stay open after a search

  async function flip(r) {
    try {
      await editSets(db, (v) => ({ value: toggleRule(v, r) }));
      status = r.on ? t('{name}: suggestion off. Tap again to switch it back on.', { name: r.name }) : t('{name}: suggestion on.', { name: r.name });
    } catch {
      saveFailed();
    }
  }
</script>

<div class="rgpage ich-page">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('How the app decides')} sub={t('Every rule the app packs by: when it applies, where the value comes from and where you change it. Everything is a suggestion.')} />

  <label class="rg-find">
    <Search size={18} aria-hidden="true" />
    <input class="inp" type="search" bind:value={q} placeholder={t('Search the rules, e.g. rain')} aria-label={t('Search the rules')} data-rule-search />
  </label>
  <p class="rg-count" role="status">{q.trim() ? tn(count, '{n} rule found', '{n} rules found') : trip ? t('«Fits now» refers to your next trip: {trip}', { trip: trip.title }) : t('No trip planned: «fits now» shows once a trip is planned.')}</p>

  {#each shown as g (g.key)}
    {@const fits = g.rules.filter((r) => r.active && r.on !== false).length}
    <!-- folded to one line each (the page would be very long on a phone); a search opens every group -->
    <details class="ich-sec rg-sec" open={!!q.trim() || !!opened[g.key]} ontoggle={(e) => { if (!q.trim()) opened[g.key] = e.currentTarget.open; }} data-rule-group={g.key}>
      <summary class="rg-sum">
        <span class="rg-st"><h2 id="rg-{g.key}-h">{t(g.title)}</h2><span class="ich-hs">{t(g.text)}</span></span>
        <span class="rg-n num">{tn(g.rules.length, '{n} rule', '{n} rules')}{#if fits}{' · '}<b>{tn(fits, '{n} fits now', '{n} fit now')}</b>{/if}</span>
        <ChevronDown class="rg-chev" size={18} aria-hidden="true" />
      </summary>
      <ul class="card ich-list">
        {#each g.rules as r (r.id)}
          <li class="ich-row ich-wrap rg-row" class:off={r.on === false} data-rule={r.id}>
            <span class="ich-m">
              <b>{r.name}{#if r.active && r.on !== false}{' '}<i class="tp-badge hi" data-rule-active>{t('fits now')}</i>{/if}</b>
              <small class="rg-when">{#if r.on === false}<ZapOff size={13} aria-hidden="true" />{t('Suggestion off')} · {:else if r.toggle}<Zap size={13} aria-hidden="true" />{/if}{r.when}</small>
              <small>{r.source}</small>
            </span>
            <span class="rg-acts">
              {#if r.toggle}<button type="button" class="tp-chip rg-on" aria-pressed={r.on} aria-label={t('Suggestion {name}', { name: r.name })} onclick={() => flip(r)} data-rule-toggle>{r.on ? t('On|switch') : t('Off|switch')}</button>{/if}
              <a class="tp-link rg-go" href={r.href}>{t(r.link)}<ArrowRight size={14} aria-hidden="true" /></a>
            </span>
          </li>
        {/each}
      </ul>
    </details>
  {:else}
    <p class="rg-count">{t('No rule fits this search.')}</p>
  {/each}
  {#if status}<p class="rg-status" role="status">{status}</p>{/if}
  <p class="ich-fine"><Info size={15} aria-hidden="true" /><span>{t('A rule only suggests: nothing is packed that you cannot take out again. In Pack, «Why?» next to a row shows the rule behind it.')}</span></p>
</div>

<style>
  .rgpage {
    max-width: 820px;
  }
  .rg-find {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
    color: var(--ink-3);
  }
  .rg-find .inp {
    flex: 1;
    min-width: 0;
    min-height: 44px;
  }
  .rg-count,
  .rg-status {
    margin: 0 0 16px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .rg-sum {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 12px;
    min-height: 56px;
    padding: 6px 0;
    list-style: none;
    cursor: pointer;
  }
  .rg-sum::-webkit-details-marker {
    display: none;
  }
  .rg-st {
    flex: 1 1 14em;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .rg-st h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .rg-n {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rg-sum :global(.rg-chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .rg-sec[open] .rg-sum :global(.rg-chev) {
    transform: rotate(180deg);
  }
  .rg-row.off .ich-m b {
    color: var(--ink-2);
  }
  .rg-when :global(svg) {
    vertical-align: -2px;
    margin-right: 3px;
  }
  .rg-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin-left: auto;
  }
  .rg-on {
    min-width: 64px;
    justify-content: center;
    font-size: var(--fs-small);
  }
  .rg-go {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    font-size: var(--fs-small);
  }
</style>
