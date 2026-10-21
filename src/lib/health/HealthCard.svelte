<script>
  /**
   * Mockup G2 (approved 13.10.2026 17:03 «g1-g2 freigeben»): the card «Gesundheitsdaten» on «Daten und
   * Backup». Per value how current it is, the past from the Fitbit file, «Jetzt holen», «Werte wählen»
   * and «Trennen». Not connected: one line and the way to the page «Fitbit» (G1). Observation only.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { addDays, VALUES } from '../health.js';
  import { readKey } from '../strava/client.svelte.js';
  import { health, fetchNow, disconnect, savePrefs, connect, VALUE_OF, FITBIT_HASH, STRAVA_HASH } from './client.svelte.js';
  import { t, locale } from '../i18n.svelte.js';

  let { heading = true } = $props();

  // The last 60 days are enough to say how current each value is.
  const recentQ = liveQuery(() => db.healthDays.where('date').aboveOrEqual(addDays(localDay(), -60)).toArray());
  const fileQ = liveQuery(async () => {
    const rows = await db.healthDays.filter((r) => r.src === 'file').toArray();
    return rows.length ? { from: rows[0].date, to: rows.at(-1).date } : null;
  });

  const LABEL = { sleep: 'Sleep|fitbit', restingHr: 'Resting heart rate', hrvMs: 'HRV', steps: 'Steps', azm: 'Active zone minutes' };
  // G2: resting heart rate and HRV share a line.
  const LINES = [
    { key: 'sleep', name: 'Sleep|fitbit', has: ['sleep'] },
    { key: 'heart', name: 'Resting heart rate and HRV', has: ['restingHr', 'hrvMs'] },
    { key: 'steps', name: 'Steps', has: ['steps'] },
    { key: 'azm', name: 'Active zone minutes', has: ['azm'] },
  ];

  const dayWord = (iso, sleep) => {
    const today = localDay();
    if (iso === today) return sleep ? t('last night|fitbit') : t('today|fitbit');
    if (iso === addDays(today, -1)) return sleep ? t('the night before yesterday|fitbit') : t('until yesterday|fitbit');
    return t('until {date}|fitbit', { date: short(iso) });
  };
  const short = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  const monthYear = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale(), { month: 'short', year: 'numeric' });
  const clock = (iso) => new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const fetched = $derived(health.prefs.lastSync ? (localDay(new Date(health.prefs.lastSync)) === localDay() ? t('fetched today {time}|fitbit', { time: clock(health.prefs.lastSync) }) : t('fetched {date}|fitbit', { date: short(localDay(new Date(health.prefs.lastSync))) })) : '');

  const lines = $derived.by(() => {
    const rows = $recentQ ?? [];
    return LINES.filter((l) => l.has.some((k) => health.prefs.values.includes(k))).map((l) => {
      const last = [...rows].reverse().find((r) => l.has.some((k) => r[k] !== undefined));
      return { ...l, ok: !!last, line: last ? dayWord(last.date, l.key === 'sleep') : t('nothing yet|fitbit') };
    });
  });

  let choosing = $state(false);
  let asking = $state(false);
  const toggle = (k, on) => savePrefs(db, { values: on ? [...health.prefs.values, k] : health.prefs.values.filter((x) => x !== k) });
  const errorText = (code) =>
    ({
      google_login_needed: t('Google needs a new login. Connect again.'),
      google_scope: t('Google refuses the Fitbit values right now. The reason is noted on the server.'),
      not_connected: t('Fitbit is not connected (any more).'),
      unauthorized: t('This device has no key yet: connect Strava on this device first.'),
      network: t('No connection. The app tries again later.'),
      google_busy: t('Google is busy. Try again later.'),
      daily_cap: t('The server has done enough for today. It works again tomorrow.'),
    })[code] ?? t('Google answered with an error. Try again later.');
  // Noah 21.10.2026: the values stopped coming and the card said nothing. The last try is kept on this
  // device (LAST_KEY), so its reason stays visible after a reload, until a fetch works again.
  const failed = $derived(health.error || (health.lastTry && !health.lastTry.ok ? health.lastTry.code : ''));
  const relogin = $derived(['google_login_needed', 'not_connected'].includes(failed));
  const triedAt = $derived(health.lastTry?.at ? (localDay(new Date(health.lastTry.at)) === localDay() ? t('today {time}|fitbit', { time: clock(health.lastTry.at) }) : short(localDay(new Date(health.lastTry.at)))) : '');
  const gone = $derived(health.lastTry?.ok && !health.error ? (health.lastTry.missing ?? []).map((m) => LABEL[VALUE_OF[m]]).filter(Boolean) : []);
</script>

<section class="ich-sec" aria-labelledby="health-h">
  {#if heading}<div class="ich-h"><div><h2 id="health-h">{t('Health data')}</h2><p class="ich-hs">{t('Fitbit via Google · observation only · only on this device')}</p></div></div>{/if}
  <div class="card ich-body hcard">
    {#if health.prefs.connected}
      <ul class="hl">
        {#each lines as l (l.key)}
          <li><span class="dot" class:ok={l.ok} aria-hidden="true"></span><span class="ich-m"><b>{t(l.name)}</b><small>{l.line}{#if l.ok && fetched}{' · '}{fetched}{/if}</small></span></li>
        {/each}
        {#if $fileQ}<li><span class="dot ok" aria-hidden="true"></span><span class="ich-m"><b>{t('The past|fitbit')}</b><small>{t('from the Fitbit file: {from} to {to}', { from: monthYear($fileQ.from), to: short($fileQ.to) })}</small></span></li>{/if}
      </ul>
      {#if failed}<p class="err" role="status" data-health-err={failed}>{errorText(failed)}{#if triedAt}{' '}{t('Last try: {when}|fitbit', { when: triedAt })}{/if}</p>{/if}
      {#if gone.length}<p class="err" role="status" data-health-gone>{t('Google did not give these values this time: {list}', { list: gone.map((g) => t(g)).join(', ') })}</p>{/if}
      <div class="ich-acts">
        {#if relogin}<button type="button" class="btn hi" data-health-relogin onclick={() => connect()}>{t('Connect Google again')}</button>{/if}
        <!-- Impeccable P6: without the Strava key no grey button, the line below says what to do -->
        {#if readKey()}<button type="button" class="btn" class:hi={!relogin} onclick={() => fetchNow()} disabled={health.busy}>{health.busy ? t('Fetching …') : t('Fetch now|fitbit')}</button>{/if}
        <button type="button" class="btn" aria-expanded={choosing} onclick={() => (choosing = !choosing)}>{t('Choose values')}</button>
        <button type="button" class="btn" onclick={() => (asking = !asking)}>{t('Disconnect|fitbit')}</button>
      </div>
      {#if !readKey()}<p class="ich-help" data-fitbit-needs-strava>{t('Fitbit needs the Strava connection first.')} <a href={STRAVA_HASH}>{t('Connect Strava ›')}</a></p>{/if}
      {#if choosing}
        <fieldset class="vals">
          <legend class="ich-help">{t('Only the chosen values are fetched and kept.')}</legend>
          {#each VALUES as k (k)}
            <label><input type="checkbox" checked={health.prefs.values.includes(k)} onchange={(e) => toggle(k, e.currentTarget.checked)} /> {t(LABEL[k])}</label>
          {/each}
          <label class="auto"><input type="checkbox" checked={health.prefs.fetch === 'auto'} onchange={(e) => savePrefs(db, { fetch: e.currentTarget.checked ? 'auto' : 'manual' })} /> {t('Fetch automatically when the app opens')}</label>
        </fieldset>
      {/if}
      {#if asking}
        <div class="confirm" role="dialog" aria-label={t('Disconnect|fitbit')}>
          <p>{t('Google forgets the access of this app. The values already here stay, unless you delete them too.')}</p>
          <div class="ich-acts">
            <button type="button" class="btn" onclick={() => (asking = false)}>{t('Cancel')}</button>
            <button type="button" class="btn" onclick={async () => (await disconnect({ removeDays: true })) && (asking = false)}>{t('Disconnect and delete values')}</button>
            <button type="button" class="btn hi" onclick={async () => (await disconnect()) && (asking = false)}>{t('Disconnect|fitbit')}</button>
          </div>
        </div>
      {/if}
    {:else}
      <ul class="hl">
        <li><span class="dot" aria-hidden="true"></span><span class="ich-m"><b>Fitbit</b><small>{t('not connected|fitbit')}{#if $fileQ}{' · '}{t('the past from the Fitbit file: {from} to {to}', { from: monthYear($fileQ.from), to: short($fileQ.to) })}{/if}</small></span></li>
      </ul>
      <div class="ich-acts"><a class="btn hi" href={FITBIT_HASH}>{t('Connect Fitbit')}</a></div>
    {/if}
  </div>
</section>

<style>
  .hl {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0 0 16px;
    padding: 0;
    list-style: none;
  }
  .hl li {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--line);
  }
  .dot.ok {
    background: var(--ok);
  }
  .err {
    margin: 0 0 12px;
    color: var(--warn-ink, var(--ink));
    font-size: var(--fs-small);
  }
  .vals {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 14px 0 0;
    padding: 12px 0 0;
    border: 0;
    border-top: 1px solid var(--line);
  }
  .vals label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
  }
  .vals .auto {
    margin-top: 6px;
  }
  .confirm {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .confirm p {
    margin: 0 0 10px;
  }
</style>
