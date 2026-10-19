<script>
  /**
   * «App-Wartung» (Noah 13.10.2026, BF7 and BF8, built without mockups at his word): the card «App
   * maintenance» under Ich. On top Strava's free limits (two bars: per 15 minutes and today, the latest
   * numbers this device saw), then the monthly check (links n/m, the keys with their end, the Strava
   * connection) with «Check now», then the switch for the line on Today. Offline a part says «not
   * checked», never an error. Every key can be changed or removed; nothing here is a must.
   * Impeccable (18.10.2026): `fold` makes the head a folded line «App maintenance · all in order» (or
   * «· 1 hint», yellow); one tap opens the card as before. `open` is bindable (Ich › «Waiting for you»).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { RATE_KEY, rateBars, HOT } from './rate.js';
  import { CHECK_KEY, keyRows, linkSummary, attention } from './check.js';
  import { MAINT_KEY, maintOf, saveMaint } from './settings.js';
  import { checkNow } from './run.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import { Activity, Link2, KeyRound, Bike, Plus, X, ChevronDown } from '@lucide/svelte';
  import './maint.css';

  let { fold = false, open = $bindable(false) } = $props();
  const dataQ = liveQuery(async () => {
    const [rate, check, set] = await Promise.all([db.meta.get(RATE_KEY), db.meta.get(CHECK_KEY), db.settings.get(MAINT_KEY)]);
    return { rate: rate ?? null, check: check ?? null, set: maintOf(set?.value) };
  });
  const d = $derived($dataQ);
  let now = $state(new Date());
  const today = $derived(localDay(now));
  const bars = $derived(rateBars(d?.rate, now));
  const keys = $derived(keyRows(d?.set.keys ?? [], today));
  const checked = $derived(d?.check && !d.check.first ? d.check : null);
  const links = $derived(checked?.links ? linkSummary(checked.links) : null);
  // what the folded head counts: the same things the card shows yellow (a key within 30 days counts at once)
  const hints = $derived(d ? attention({ check: checked ?? {}, keys: d.set.keys ?? [], rate: d.rate, today, now }).length : 0);
  let busy = $state(false);
  let editing = $state(false);

  const dateOf = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
  const timeOf = (iso) => new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const BAR_NAME = { short: 'Per 15 minutes', daily: 'Today|strava' };
  const STRAVA_LINE = { ok: 'Connected', off: 'Not connected on this device', attention: 'Needs a new login' };

  async function runNow() {
    busy = true;
    try {
      await checkNow(db);
    } finally {
      busy = false;
      now = new Date();
    }
  }
  const saveKeys = (list) => saveMaint(db, { keys: list.map(({ id, name, until }) => ({ id, name, until })) });
  function editKey(id, patch) {
    saveKeys((d?.set.keys ?? []).map((k) => (k.id === id ? { ...k, ...patch } : k)).filter((k) => k.name.trim() && k.until));
  }
  const removeKey = (id) => saveKeys((d?.set.keys ?? []).filter((k) => k.id !== id));
  const addKey = () => saveKeys([...(d?.set.keys ?? []), { id: `key-${Date.now().toString(36)}`, name: t('New key'), until: today }]);
</script>

{#snippet body()}
  <ul class="card ich-list mt">
    <li class="ich-row ich-wrap" data-maint="rate">
      <span class="ich-ib"><Activity size={18} aria-hidden="true" /></span>
      <span class="ich-m">
        <b>{t('Strava requests')}</b>
        <small>{d?.rate?.at ? t('as of {when}', { when: timeOf(d.rate.at) }) : t('No numbers yet: they come with the next Strava fetch.')}</small>
      </span>
      {#if d?.rate}
        <div class="bars">
          {#each bars as b (b.key)}
            <div class="bar" class:stale={!b.fresh} data-bar={b.key}>
              <span class="bl">{t(BAR_NAME[b.key])}</span>
              <span class="track" role="meter" aria-label={t(BAR_NAME[b.key])} aria-valuemin="0" aria-valuemax={b.limit} aria-valuenow={b.used}><span class="fill" class:hot={b.fresh && b.pct >= HOT} style:width="{b.pct}%"></span></span>
              <span class="bn num">{t('{used} of {limit}', { used: b.used, limit: b.limit })}</span>
            </div>
          {/each}
        </div>
      {/if}
    </li>
    <li class="ich-row ich-wrap" data-maint="links">
      <span class="ich-ib"><Link2 size={18} aria-hidden="true" /></span>
      <span class="ich-m">
        <b>{t('Links')}</b>
        <small>{#if links?.checked}{t('{ok} of {all} answer', { ok: links.ok, all: links.all })}{#if links.broken.length}{' · '}{t('not answering: {names}', { names: links.broken.map((n) => t(n)).join(', ') })}{/if}{:else}{t('not checked')}{/if}</small>
      </span>
      {#if links?.broken.length}<span class="pill warn">{t('to do')}</span>{/if}
    </li>
    <li class="ich-row ich-wrap" data-maint="strava">
      <span class="ich-ib"><Bike size={18} aria-hidden="true" /></span>
      <span class="ich-m"><b>{t('Strava connection')}</b><small>{checked?.strava ? t(STRAVA_LINE[checked.strava]) : t('not checked')}</small></span>
      {#if checked?.strava === 'attention'}<a class="btn sm" href="#/bikes?tab=care&view=strava">{t('Open')}</a>{/if}
    </li>
    <li class="keys" data-maint="keys">
      <div class="ich-row ich-wrap">
        <span class="ich-ib"><KeyRound size={18} aria-hidden="true" /></span>
        <span class="ich-m"><b>{t('Keys with an end date')}</b><small>{keys.length ? tn(keys.filter((k) => k.due).length, '{n} runs out within 30 days', '{n} run out within 30 days') : t('none')}</small></span>
        <button type="button" class="btn btn-link sm" aria-expanded={editing} onclick={() => (editing = !editing)}>{editing ? t('Done|keys') : t('Change|keys')}</button>
      </div>
      <ul class="klist">
        {#each keys as k (k.id)}
          <li class:due={k.due} data-key={k.id}>
            {#if editing}
              <input class="inp" type="text" value={t(k.name)} aria-label={t('Name of the key')} maxlength="60" onchange={(e) => editKey(k.id, { name: e.currentTarget.value })} />
              <input class="inp" type="date" value={k.until} aria-label={t('Runs out on')} onchange={(e) => editKey(k.id, { until: e.currentTarget.value })} />
              <button type="button" class="kx" aria-label={t('Remove {name}', { name: t(k.name) })} onclick={() => removeKey(k.id)}><X size={18} aria-hidden="true" /></button>
            {:else}
              <span class="kn">{t(k.name)}</span>
              <span class="kd">{t('until {date}', { date: dateOf(k.until) })} · {k.days < 0 ? t('ran out') : tn(k.days, 'in {n} day', 'in {n} days')}</span>
            {/if}
          </li>
        {/each}
      </ul>
      {#if editing}<button type="button" class="btn sm kadd" onclick={addKey}><Plus size={16} aria-hidden="true" />{t('Add key')}</button>{/if}
    </li>
    <li class="ich-row ich-wrap">
      <span class="ich-m"><b>{t('Monthly check')}</b><small>{checked ? t('Last check: {date}', { date: dateOf(checked.day) }) : t('Not checked yet')}</small></span>
      <button type="button" class="btn sm" onclick={runNow} disabled={busy}>{busy ? t('Checking …') : t('Check now')}</button>
    </li>
    <li>
      <label class="ich-row">
        <span class="ich-m"><b>{t('Hint on Today when something is due')}</b><small>{t('One calm line, closable')}</small></span>
        <input type="checkbox" role="switch" class="mt-sw" checked={d?.set.hint ?? true} disabled={!d} onchange={(e) => saveMaint(db, { hint: e.currentTarget.checked })} />
      </label>
    </li>
  </ul>
{/snippet}

{#if fold}
  <details class="ich-sec mfold" data-section="maintenance" bind:open>
    <summary class="ich-h msum">
      <div><h2 id="mt-h">{t('App maintenance')}</h2><p class="ich-hs">{#if hints}<span class="pill warn">{tn(hints, '{n} hint', '{n} hints')}</span>{:else}{t('all in order')}{/if}</p></div>
      <ChevronDown class="mchev" size={20} aria-hidden="true" />
    </summary>
    {@render body()}
  </details>
{:else}
  <section class="ich-sec" aria-labelledby="mt-h" data-section="maintenance">
    <div class="ich-h"><div><h2 id="mt-h">{t('App maintenance')}</h2><p class="ich-hs">{t('Free limits and a check once a month')}</p></div></div>
    {@render body()}
  </section>
{/if}

<style>
  .msum {
    min-height: 44px;
    align-items: center;
    cursor: pointer;
    list-style: none;
  }
  .msum::-webkit-details-marker {
    display: none;
  }
  .msum :global(.mchev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.18s ease-out;
  }
  .mfold[open] .msum :global(.mchev) {
    transform: rotate(180deg);
  }
  .mfold:not([open]) {
    margin-bottom: 16px;
  }
  @media (prefers-reduced-motion: reduce) {
    .msum :global(.mchev) {
      transition: none;
    }
  }
  .bars {
    flex: 1 1 100%;
    display: grid;
    gap: 6px;
    padding: 0 0 4px 46px;
  }
  .bar {
    display: grid;
    grid-template-columns: minmax(6em, auto) minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .bar.stale {
    opacity: 0.6;
  }
  .track {
    height: 8px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--ok);
  }
  .fill.hot {
    background: var(--warn);
  }
  .keys {
    padding: 0 0 10px;
  }
  .klist {
    list-style: none;
    margin: 0;
    padding: 0 0 0 46px;
    display: grid;
    gap: 6px;
  }
  .klist li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .klist li.due .kd {
    color: var(--warn);
    font-weight: 600;
  }
  .kn {
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .klist .inp {
    flex: 1 1 8em;
    min-width: 0;
  }
  .kx {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .kadd {
    margin: 8px 0 0 46px;
  }
  @media (max-width: 419px) {
    .bars,
    .klist {
      padding-left: 0;
    }
    .kadd {
      margin-left: 0;
    }
  }
</style>
