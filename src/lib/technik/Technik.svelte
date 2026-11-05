<script>
  /**
   * «Fahrtechnik-Tagebuch» (Noah 04.11.2026 «4a», Persönliches Lernen Idee 3): Touren › Rückblick › Fahrtechnik.
   * Every riding technique of the list (Me › Lists and types) with how often you worked on it, how the last time
   * went, whether you want to practise it and where. The debrief fills the counts; the wish and the place are set
   * here. Observation only: the page says what stands there, never why a technique is hard.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { t, tn, locale } from '../i18n.svelte.js';
  import Empty from '../ui/Empty.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { Bike } from '@lucide/svelte';
  import { TECH_KEY, techName, techOffered, overview, notesOf, noteChange } from '../technik.js';

  const dataQ = liveQuery(async () => {
    const [rec, debriefs] = await Promise.all([db.settings.get(TECH_KEY), db.debriefs.toArray()]);
    return { rec: rec?.value ?? null, rows: overview(debriefs) };
  });
  const data = $derived($dataQ ?? { rec: null, rows: [] });
  const notes = $derived(notesOf(data.rec));
  const byId = $derived(Object.fromEntries(data.rows.map((r) => [r.id, r])));
  const list = $derived.by(() => {
    const all = techOffered(data.rows.map((r) => r.id));
    // wanted first, then the ones worked on most recently, then the rest
    const rank = (e) => (notes[e.id]?.want ? 0 : byId[e.id] ? 1 : 2);
    return [...all].sort((a, b) => rank(a) - rank(b) || (byId[b.id]?.last?.day ?? '').localeCompare(byId[a.id]?.last?.day ?? ''));
  });
  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const KIND = { tried: 'worked on', good: 'went well', unsure: 'still unsure' };

  const save = (next) => putSetting(db, TECH_KEY, next);
  async function toggleWant(id) {
    const before = data.rec;
    const on = !notes[id]?.want;
    await save(noteChange(before, id, { want: on }));
    if (!on) offerDone(t('Wish removed.'), () => save(before));
  }
  const setPlace = (id, v) => save(noteChange(data.rec, id, { place: v }));
</script>

<div class="tk" data-technik>
  {#if !data.rows.length}
    <Empty icon={Bike} text={t('Nothing noted yet. Tick the techniques you worked on in a debrief, and they show up here.')} action={{ label: t('To the debriefs'), href: '#/debrief' }} />
  {/if}
  <ul class="rv-box tl">
    {#each list as e (e.id)}
      {@const r = byId[e.id]}
      <li class="tr" data-tech={e.id}>
        <div class="th">
          <b>{techName(e.id, t)}</b>
          <span class="ts">{#if r}{tn(r.count, 'Worked on {n} time', 'Worked on {n} times')} · {t('last time {day}: {what}', { day: dayText(r.last.day), what: t(KIND[r.last.kind]) })}{:else}{t('Not worked on yet')}{/if}</span>
        </div>
        <button type="button" class="chip" aria-pressed={!!notes[e.id]?.want} onclick={() => toggleWant(e.id)} data-tech-want>{t('I want to practise this')}</button>
        {#if notes[e.id]?.want || notes[e.id]?.place}
          <label class="pl">{t('Where I can practise it')}
            <input type="text" maxlength="60" value={notes[e.id]?.place ?? ''} placeholder={t('e.g. the car park behind the station')} onchange={(ev) => setPlace(e.id, ev.currentTarget.value)} data-tech-place />
          </label>
        {/if}
      </li>
    {/each}
  </ul>
  <p class="lk"><a href="#/me/lists">{t('Change the techniques: Me › Lists and types')}</a></p>
  <p class="ws">{t('This only counts what you ticked. A few rides say little.')}</p>
</div>

<style>
  .tk { display: grid; gap: 12px; min-width: 0; }
  .tl { list-style: none; margin: 0; padding: 0; display: grid; }
  .tr { display: grid; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--line); min-width: 0; }
  .tr:first-child { border-top: 0; }
  .th { display: grid; gap: 2px; }
  .ts, .ws { color: var(--ink-2); font-size: var(--fs-small); margin: 0; }
  .chip { justify-self: start; min-height: 44px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  .chip[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .pl { display: grid; gap: 4px; font-size: var(--fs-small); color: var(--ink-2); }
  .pl input { min-height: 44px; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font: inherit; min-width: 0; }
  .lk { margin: 0; }
  .lk a { display: inline-block; min-height: 44px; line-height: 44px; }
</style>
