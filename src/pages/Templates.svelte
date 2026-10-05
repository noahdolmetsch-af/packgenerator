<script>
  /**
   * Templates (Noah, 4.10.2026, answer 9): all saved packing setups on their own page.
   * Rename, see what is in them, start a new trip from one, or delete one.
   * What is inside a template changes from a trip: open a trip made from it and press
   * "Save as template" → "Update" (answer 7a).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, saveTemplates } from '../lib/templates.js';
  import { NIGHT_SETS } from '../lib/trips.js';
  import { RIDES } from '../lib/layers.js';
  import { templateHints, applyTemplateHint, TEMPLATE_AFTER } from '../lib/debrief.js';
  import TemplateEdit from './TemplateEdit.svelte';
  import { t, tn } from '../lib/i18n.svelte.js';

  // #/pack/templates/<id> opens the editor for one template (answer 7b).
  let hash = $state(location.hash);
  $effect(() => {
    const update = () => (hash = location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  const editId = $derived(decodeURIComponent(hash.split('/')[3] ?? ''));

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const bagsQ = liveQuery(() => db.containers.toArray());
  const templates = $derived([...($tplQ?.value ?? [])].sort((a, b) => a.name.localeCompare(b.name)));
  // v0.19.0: after 3 debriefs the templates learn what you never use and what was missing.
  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const doneN = $derived(($debriefsQ ?? []).filter((d) => d.status === 'done').length);
  const hintsFor = (tp) => templateHints(tp, $tripsQ ?? [], $debriefsQ ?? [], $itemsQ ?? []);
  async function applyHint(tp, h) {
    await saveTemplates(db, templates.map((x) => (x.id === tp.id ? applyTemplateHint(x, h, $itemsQ ?? []) : x)));
  }
  const bagName = $derived(Object.fromEntries(($bagsQ ?? []).map((b) => [b.id, b.name])));

  let error = $state('');
  async function rename(tp, value) {
    const clean = value.trim();
    error = '';
    if (!clean || clean === tp.name) return;
    if (templates.some((x) => x.id !== tp.id && x.name.toLowerCase() === clean.toLowerCase())) return (error = t('There is already a template "{name}".', { name: clean }));
    await saveTemplates(db, templates.map((x) => (x.id === tp.id ? { ...x, name: clean } : x)));
  }
  async function remove(tp) {
    if (!confirm(t('Delete the template "{name}"? Trips made from it stay. A backup file can bring it back.', { name: tp.name }))) return;
    await saveTemplates(db, templates.filter((x) => x.id !== tp.id));
  }
  function start(tp) {
    try {
      localStorage.setItem('pack.startFrom', tp.id);
    } catch {
      /* private mode: the trip dialog opens without the template chosen */
    }
    location.hash = '#/pack';
  }
  // Design audit T2: from the empty page straight to "Save as template" on Pack.
  function saveCurrent() {
    try {
      localStorage.setItem('pack.saveTemplate', '1');
    } catch {
      /* private mode: Pack opens without the dialog */
    }
    location.hash = '#/pack';
  }
  const bags = (tp) => Object.values(tp.setup ?? {}).filter(Boolean).map((id) => bagName[id] ?? id);
  const nights = (tp) => NIGHT_SETS.filter((n) => tp.sets?.[n.key]).map((n) => t(n.name));
</script>

{#if editId}
  <TemplateEdit id={editId} />
{:else}
<div class="tpls">
  <p class="back"><a href="#/pack">← {t('Pack')}</a></p>
  <h1 class="title big">{t('Templates')}</h1>
  <p class="hint">{t('A template is a packing setup you can start new trips from. Save one on the Pack page with "Save as template". Change what is inside with "Edit", or from a trip made from it with "Save as template" → "Update".')}</p>
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  {#if templates.length && doneN < TEMPLATE_AFTER}<p class="hint">{t('After {n} debriefs the templates learn what you never use and what was missing ({done} of {n} done).', { n: TEMPLATE_AFTER, done: doneN })}</p>{/if}
  <ul class="list">
    {#each templates as tp (tp.id)}
      <li class="card">
        <label class="nm"><span class="lbl">{t('Name')}</span><input class="inp" value={tp.name} onchange={(e) => rename(tp, e.currentTarget.value)} /></label>
        <p class="facts">
          {tn(tp.entries.length, '{n} item', '{n} items')} · {tn(tp.ready.length, '{n} check', '{n} checks')}
          {#if tp.ride}{' · '}{t(RIDES.find((r) => r.key === tp.ride)?.name ?? '')}{/if}{#if tp.hours}{' · '}{tp.hours} h{/if}
          {#if nights(tp).length}{' · '}{t('Night: {sets}', { sets: nights(tp).join(', ') })}{/if}
        </p>
        {#if bags(tp).length}<p class="facts">{t('Bags: {bags}', { bags: bags(tp).join(', ') })}</p>{/if}
        <p class="facts muted">{t('Saved {date}', { date: tp.updatedAt?.slice(0, 10) })}</p>
        {#if hintsFor(tp).length}
          <div class="hints">
            <span class="lbl">{t('From your debriefs')}</span>
            <ul>
              {#each hintsFor(tp) as h (h.id)}
                <li>
                  <span><b>{h.kind === 'out' ? t('Take out: {name}', { name: h.name }) : t('Put in: {name}', { name: h.name })}</b><small>{h.why}</small></span>
                  <button type="button" class="btn sm" onclick={() => applyHint(tp, h)}>{h.kind === 'out' ? t('Take out') : t('Put in')}</button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        <div class="acts">
          <button type="button" class="btn hi" onclick={() => start(tp)}>{t('New trip from it')}</button>
          <a class="btn" href="#/pack/templates/{encodeURIComponent(tp.id)}">{t('Edit')}</a>
          <button type="button" class="btn del" onclick={() => remove(tp)}>{t('Delete')}</button>
        </div>
      </li>
    {:else}
      <li class="card empty">
        <b>{t('No templates yet.')}</b>
        <p>{t('A template remembers bags, items and checks of a trip, so the next trip starts packed.')}</p>
        <button type="button" class="btn hi" onclick={saveCurrent}>{t('Save the current trip as a template')}</button>
      </li>
    {/each}
  </ul>
</div>
{/if}

<style>
  .big {
    font-size: clamp(48px, 10vw, 88px);
    line-height: 0.9;
  }
  .back {
    margin: 0 0 6px;
  }
  .hint {
    color: var(--ink-3);
    max-width: 60ch;
  }
  .err {
    color: #b42318;
  }
  .list {
    list-style: none;
    margin: 16px 0 0;
    padding: 0;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  }
  .nm {
    display: grid;
    gap: 4px;
  }
  .facts {
    margin: 8px 0 0;
    font-size: 14px;
  }
  .muted {
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .hints {
    margin-top: 12px;
    padding: 8px 12px;
    border-left: 4px solid var(--ink);
    background: var(--paper-2);
    border-radius: 6px;
  }
  .hints ul {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
  }
  .hints li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 0;
  }
  .hints li span {
    min-width: 0;
  }
  .hints small {
    display: block;
    color: var(--ink-3);
  }
  .del {
    margin-left: auto;
    border-color: #b42318;
    color: #b42318;
  }
</style>
