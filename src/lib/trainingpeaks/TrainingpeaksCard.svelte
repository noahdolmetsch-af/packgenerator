<script>
  /**
   * TrainingPeaks-Plan (Noah 19.11.2026 «1a 2b 3a 4a 5b»): on Ich › Verbindungen. Paste the private calendar link of
   * TrainingPeaks (Premium), test it, switch it off, fetch again, remove it (with Undo). Read only. The workouts
   * planned there become planned sessions in the week plan (Training › Meine Woche), marked «TrainingPeaks».
   * The link stays on this device (a DEVICE_SETTING: no backup, no sync) and is shown hidden. Rules: lib/trainingpeaks.js.
   */
  import { liveQuery } from 'dexie';
  import { Plus, RefreshCw, Trash2, CalendarRange, ArrowRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { TP_KEY, prefsOf, cleanLink, maskLink, refresh, withoutFeed } from '../trainingpeaks.js';
  import { PLAN_KEY, planOf } from '../training.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  const today = localDay();
  const q = liveQuery(async () => ({ rec: await db.settings.get(TP_KEY) }));
  const rec = $derived(prefsOf($q?.rec?.value));

  let link = $state('');
  let busy = $state('');
  let msg = $state('');
  let added = $state(false);
  let good = $state(false);

  const when = (iso) => (iso ? new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const errorText = (code) =>
    ({
      no_link: t('This is not a TrainingPeaks calendar link. It looks like https://www.trainingpeaks.com/ical/….ics (or webcal://… with the same ending).'),
      link_invalid: t('TrainingPeaks does not give a calendar for this link (any more). Copy the calendar link again in TrainingPeaks.'),
      unreachable: t('TrainingPeaks does not answer right now. Try again later.'),
      not_calendar: t('The answer from TrainingPeaks is not a calendar. Check the link.'),
      network: t('No connection. Try again later.'),
      daily_cap: t('The server has done enough for today. Tomorrow it works again.'),
    })[code] ?? t('Something went wrong while reading the calendar. Try again later.');

  const resultLine = (r) => {
    const parts = [tn(r.found, '{n} planned session', '{n} planned sessions')];
    if (r.skipped) parts.push(tn(r.skipped, '{n} entry without a duration left out', '{n} entries without a duration left out'));
    return parts.join(' · ');
  };

  async function add(e) {
    e?.preventDefault();
    msg = '';
    added = false;
    good = false;
    const url = cleanLink(link);
    if (!url) {
      msg = errorText('no_link');
      return;
    }
    busy = 'add';
    try {
      const r = await refresh(db, { today, url });
      if (!r.ok) {
        msg = errorText(r.code);
        return;
      }
      msg = `${t('Done.')} ${resultLine(r)}`;
      added = true;
      good = true;
      link = '';
    } catch (err) {
      saveFailed(err);
    } finally {
      busy = '';
    }
  }

  async function again() {
    busy = 'again';
    msg = '';
    added = false;
    good = false;
    try {
      const r = await refresh(db, { today, force: true });
      good = r.ok;
      msg = r.ok ? `${t('Up to date.')} ${resultLine(prefsOf((await db.settings.get(TP_KEY))?.value))}` : errorText(r.code);
    } finally {
      busy = '';
    }
  }

  const setOn = (on) => db.settings.get(TP_KEY).then((r) => db.settings.put({ key: TP_KEY, value: { ...prefsOf(r?.value), on } })).catch(saveFailed);

  async function remove() {
    const a = await askDelete({ title: t('Remove the TrainingPeaks link?'), text: t('The link is removed from this device. Planned sessions from TrainingPeaks that are still open and lie ahead are taken out of the plan; ticked and past ones stay. TrainingPeaks itself stays as it is. You can undo this.'), label: t('Remove') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const before = { rec: (await db.settings.get(TP_KEY))?.value, plan: (await db.settings.get(PLAN_KEY))?.value };
        await db.settings.put({ key: PLAN_KEY, value: { sessions: withoutFeed(planOf(before.plan), today) } });
        await db.settings.delete(TP_KEY);
        return before;
      },
      undo: async (before) => {
        if (before.plan) await db.settings.put({ key: PLAN_KEY, value: before.plan });
        if (before.rec) await db.settings.put({ key: TP_KEY, value: before.rec });
      },
      text: t('TrainingPeaks link removed.'),
      name: t('TrainingPeaks'),
    });
  }

  const stateLine = (r) => (r.error ? errorText(r.error) : r.fetchedAt ? `${resultLine(r)} · ${t('last fetch {when}', { when: when(r.fetchedAt) })}` : t('no dates fetched yet'));
</script>

<section class="ich-sec tpcard" aria-labelledby="cn-tp-h" data-section="trainingpeaks">
  <div class="ich-h"><div><h2 id="cn-tp-h">{t('TrainingPeaks plan')}</h2><p class="ich-hs">{t('your planned workouts in the week plan, read only')}</p></div></div>
  <div class="card ich-body">
    <p class="ich-help">{t('Needs TrainingPeaks Premium. Paste the calendar link of TrainingPeaks here: the workouts planned there then show as planned sessions in your week plan. Done is still ticked by Strava or by hand. Nothing goes back to TrainingPeaks.')}</p>

    {#if rec.url}
      <div class="cal" data-tp-card>
        <div class="top">
          <CalendarRange size={16} aria-hidden="true" />
          <strong class="nm">{t('TrainingPeaks')}</strong>
          <label class="swt"><input type="checkbox" role="switch" checked={rec.on} onchange={(e) => setOn(e.currentTarget.checked)} />{rec.on ? t('on|conn') : t('off|conn')}</label>
        </div>
        <code class="masked" aria-label={t('The link is hidden. It stays on this device.')}>{maskLink(rec.url)}</code>
        <p class="state" class:bad={!!rec.error} role={rec.error ? 'alert' : undefined}>{stateLine(rec)}</p>
        <p class="ich-help">{t('TrainingPeaks passes changes on with a delay of up to a day, and shows about 5 days back and 14 days ahead. A session you change, tick or take out here stays as you have it.')}</p>
        <div class="row">
          <button type="button" class="btn" disabled={busy === 'again' || !rec.on} onclick={again}><RefreshCw size={16} aria-hidden="true" />{t('Fetch again')}</button>
          <button type="button" class="btn" onclick={remove}><Trash2 size={16} aria-hidden="true" />{t('Remove')}</button>
        </div>
      </div>
    {:else}
      <div class="empty" data-tp-empty>
        <h3>{t('Where do I find the link in TrainingPeaks?')}</h3>
        <ol>
          <li>{t('Open trainingpeaks.com in the browser on a computer and sign in.')}</li>
          <li>{t('Open Settings, then Account, then the tab Calendar.')}</li>
          <li>{t('Copy the address of the calendar subscription. It starts with https://www.trainingpeaks.com/ical/ or webcal:// and ends with .ics.')}</li>
          <li>{t('Paste it below and tap «Test and add».')}</li>
        </ol>
        <p class="ich-help">{t('Not there? The names can differ a little. The calendar sync is part of Premium.')}</p>
      </div>
      <form class="tpform" onsubmit={add}>
        <label>{t('Calendar link from TrainingPeaks')}
          <input id="tp-link" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" bind:value={link} placeholder="https://www.trainingpeaks.com/ical/….ics" data-tp-link />
        </label>
        <p class="ich-help">{t('The link works like a password: it stays on this device (not in the backup, not in the sync) and is not shown in full. Do not pass it on.')}</p>
        <div class="btns"><button type="submit" class="btn hi" disabled={busy === 'add' || !link.trim()}><Plus size={16} aria-hidden="true" />{busy === 'add' ? t('Reading the calendar …') : t('Test and add')}</button></div>
      </form>
    {/if}
    {#if msg}<p class="msg" class:ok={good} role="status">{msg}</p>{/if}
    {#if rec.url || added}
      <p class="next"><a href="#/flow/training">{t('Next: look at your week')}<ArrowRight size={14} aria-hidden="true" /></a></p>
    {/if}
  </div>
</section>

<style>
  .cal {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
    padding: var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    min-width: 0;
    margin: 0 0 var(--sp-3);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nm {
    flex: 1 1 0;
    min-width: 0;
  }
  .swt {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    font-size: var(--fs-small);
  }
  .masked {
    font-size: var(--fs-small);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .state {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .state.bad {
    color: var(--bad);
  }
  .row,
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .empty {
    margin: 0 0 var(--sp-3);
  }
  .empty h3 {
    margin: 0 0 var(--sp-2);
    font-size: var(--fs-sub);
  }
  .empty ol {
    margin: 0 0 var(--sp-2);
    padding-left: 1.3em;
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
  }
  .tpform {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-2);
  }
  .tpform label {
    display: grid;
    gap: 4px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .tpform input {
    min-height: 44px;
    width: 100%;
    min-width: 0;
  }
  .msg {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-small);
    color: var(--bad);
  }
  .msg.ok {
    color: var(--ok);
  }
  .next {
    margin: var(--sp-3) 0 0;
    font-size: var(--fs-small);
  }
  .next a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
</style>
