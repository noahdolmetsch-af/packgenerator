<script>
  /**
   * Paket C › Weniger App für den Moment (#/me/ruhig/weniger; 996 Ideen UC-319-I3, UC-317-I3, UC-256-I2,
   * UC-217-I2): Arbeitsraum für ein Vorhaben, Ruhige Ansicht, Erinnerungs-Budget, Nicht für mich.
   * Logic: weniger.js. The strip on top of every page: RuhigLine.svelte.
   */
  import { Briefcase, Moon, BellRing, EyeOff, Plus, X, Play, Square, Settings2 } from '@lucide/svelte';
  import Card from './Card.svelte';
  import KindsEdit from './KindsEdit.svelte';
  import { STARTS_KEY, startsOf } from './calmstarts.js';
  import { kindName } from './kinds.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { FEATURE, findFeatures, featureHref } from '../features.js';
  import { settingQ, saveSetting, endCalm } from './store.js';
  import { openFromHash } from './open.js';
  import { move } from './base.js';
  import { CALM_LOG_KEY, logOf, logDrop, weekSummary, hm as hoursMin } from './calmlog.js';
  import { SPACE_KEY, CALM_KEY, BUDGET_KEY, NOT_KEY, SPACE_MAX, SPACE_STARTS, BUDGET_GROUPS, spaceOf, spaceActive, spaceAdd, spaceDrop, spaceMove, calmOf, CALM_MINUTES, calmUntil, calmLeft, budgetOf, applyBudget, notForMeOf, setNotForMe, unsetNotForMe, NOT_WHY } from './weniger.js';

  const today = localDay();
  const first = openFromHash();
  let open = $state({ space: first === 'space', calm: first === 'calm', budget: first === 'budget', notforme: first === 'notforme' });

  const spaceQ = settingQ(SPACE_KEY);
  const calmQ = settingQ(CALM_KEY);
  const budgetQ = settingQ(BUDGET_KEY);
  const notQ = settingQ(NOT_KEY);
  const logQ = settingQ(CALM_LOG_KEY);
  const log = $derived(logOf($logQ));
  const week = $derived(weekSummary(log, today));
  const durText = (min) => { const d = hoursMin(min); return d.h ? (d.m ? t('{h} h {m} min', d) : t('{h} h|duration', d)) : t('{m} min', d); };
  const space = $derived(spaceOf($spaceQ));
  const calm = $derived(calmOf($calmQ));
  const budget = $derived(budgetOf($budgetQ));
  const notMap = $derived(notForMeOf($notQ));
  const fname = (id) => (FEATURE[id] ? t(FEATURE[id].title) : id);

  /* Arbeitsraum */
  const saveSpace = (s) => saveSetting(SPACE_KEY, s);
  let findQ = $state('');
  const hits = $derived(findFeatures(findQ, t).filter((h) => !space.ids.includes(h.featureId)).slice(0, 6));
  function start(s) {
    saveSpace({ ...space, name: space.name || t(s.name), ids: s.ids.filter((id) => FEATURE[id]) });
  }

  /* Ruhige Ansicht */
  let calmWhat = $state('');
  let calmHref = $state('');
  let calmMins = $state(30);
  const startsQ = settingQ(STARTS_KEY);
  const starts = $derived(startsOf($startsQ));
  let editStarts = $state(false);
  const startNow = (what) => saveSetting(CALM_KEY, { what, href: '', since: new Date().toISOString(), until: calmUntil(calmMins) });
  function calmStart(e) {
    e.preventDefault();
    if (!calmWhat.trim()) return;
    saveSetting(CALM_KEY, { what: calmWhat.trim(), href: calmHref, since: new Date().toISOString(), until: calmUntil(calmMins) });
    calmWhat = '';
  }

  /* Erinnerungs-Budget: what the next 14 days would hold back (only when phone reminders are on) */
  const saveBudget = (b) => saveSetting(BUDGET_KEY, b);
  let preview = $state(null);
  async function resync() {
    try {
      const [{ readData, syncNow }, { buildList, pushOf }] = await Promise.all([import('../push/client.js'), import('../push/schedule.js')]);
      const data = await readData();
      const p = pushOf(data.settings.push);
      const list = buildList(data);
      preview = { on: p.on, ...applyBudget(list.items, budget) };
      if (p.on) await syncNow().catch(() => {});
    } catch {
      preview = null;
    }
  }
  $effect(() => {
    if (open.budget && $budgetQ !== undefined) resync();
  });
  const hm = (ms) => new Date(ms).toLocaleString('de-CH', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

  /* Nicht für mich */
  let notQText = $state('');
  let why = $state('');
  const notHits = $derived(findFeatures(notQText, t).filter((h) => !notMap[h.featureId]).slice(0, 6));
  const saveNot = (m) => saveSetting(NOT_KEY, m);
</script>

<ul class="rh-cards">
  <Card id="space" icon={Briefcase} title={t('Workspace for one plan')} lead={t('Only the functions for a trip or a workshop session, on top of every page')} bind:open={open.space}>
    <p class="rh-help">{t('Choose up to {n} functions. While the workspace is on, they stand as a strip on top of every page; the rest of the app stays where it is.', { n: SPACE_MAX })}</p>
    <label class="rh-field"><span>{t('Name of the plan')}</span><input class="inp" value={space.name} onchange={(e) => saveSpace({ ...space, name: e.currentTarget.value })} placeholder={t('e.g. Workshop Saturday')} data-space-name /></label>
    {#if !space.ids.length}
      <div class="rh-chips" aria-label={t('Start with')}>
        {#each SPACE_STARTS as s (s.key)}<button type="button" class="rh-chip" onclick={() => start(s)}>{t(s.name)}</button>{/each}
      </div>
    {:else}
      <ul class="rh-list" use:sortable={{ onmove: (from, to) => saveSpace(spaceMove(space, from, to)) }} data-space-list>
        {#each space.ids as id, i (id)}
          <li data-sort-id={id}>
            <SortGrip name={fname(id)} onstep={(d) => saveSpace(spaceMove(space, i, i + d))} />
            <span class="rh-grow">{fname(id)}</span>
            <SortArrows name={fname(id)} {i} n={space.ids.length} onstep={(d) => saveSpace(spaceMove(space, i, i + d))} />
            <button type="button" class="rh-x" aria-label={t('Take «{name}» out', { name: fname(id) })} onclick={() => saveSpace(spaceDrop(space, id))}><X size={16} /></button>
          </li>
        {/each}
      </ul>
    {/if}
    {#if space.ids.length < SPACE_MAX}
      <input class="inp" type="search" bind:value={findQ} placeholder={t('Add a function, e.g. chain')} aria-label={t('Add a function')} data-space-find />
      {#if hits.length}<div class="rh-chips">{#each hits as h (h.featureId)}<button type="button" class="rh-chip" onclick={() => (saveSpace(spaceAdd(space, h.featureId)), (findQ = ''))}><Plus size={14} aria-hidden="true" /> {h.title}</button>{/each}</div>{/if}
    {/if}
    <label class="rh-field"><span>{t('Ends by itself after (optional)')}</span><input class="inp" type="date" min={today} value={space.until ?? ''} onchange={(e) => saveSpace({ ...space, until: e.currentTarget.value || null })} /></label>
    <div class="rh-row">
      {#if spaceActive(space, today)}
        <button type="button" class="btn" onclick={() => saveSpace({ ...space, on: false })} data-space-off><Square size={16} aria-hidden="true" />{t('End the workspace')}</button>
        <span class="rh-tag ok">{t('On')}</span>
      {:else}
        <button type="button" class="btn hi" disabled={!space.ids.length} onclick={() => saveSpace({ ...space, on: true, until: space.until && space.until < today ? null : space.until })} data-space-on><Play size={16} aria-hidden="true" />{t('Start the workspace')}</button>
      {/if}
    </div>
  </Card>

  <Card id="calm" icon={Moon} title={t('Calm view')} lead={t('Only what you are doing now; numbers, stars and suggestions rest')} bind:open={open.calm}>
    {#if calm}
      <div class="rh-calm" data-calm-on>
        <p class="rh-calm-l">{t('You are doing')}</p>
        <p class="rh-calm-w">{calm.what}</p>
        {#if calm.until}<p class="rh-help" data-calm-left>{calmLeft(calm) ? t('{n} min left', { n: calmLeft(calm) }) : t('Time is up')}</p>{/if}
        <div class="rh-row">
          {#if calm.href}<a class="btn" href={calm.href}>{t('Open')}</a>{/if}
          <button type="button" class="btn hi" onclick={() => endCalm(calm)} data-calm-done>{t('Done|calm')}</button>
        </div>
      </div>
    {:else}
      <p class="rh-help">{t('Write what you do now. Until you tap «Done», suggestions, the «New» tile, stars and count badges rest on all pages except Today, and the strip on top shows what you do. Nothing is deleted.')}</p>
      <div class="rh-chips" aria-label={t('Quick start')} data-calm-starts>
        {#each starts as k (k.id)}<button type="button" class="rh-chip" onclick={() => startNow(kindName(k, t))} data-calm-start>{kindName(k, t)}</button>{/each}
        <button type="button" class="rh-chip" onclick={() => (editStarts = !editStarts)} aria-expanded={editStarts} data-calm-starts-edit><Settings2 size={14} aria-hidden="true" /> {t('Change the quick starts')}</button>
      </div>
      {#if editStarts}
        <KindsEdit kinds={starts} what={() => ''} none={t('Without a start')} noneHint={t('Nothing else changes.')} label={t('New start, e.g. Tidy the desk')}
          onsave={(kinds) => saveSetting(STARTS_KEY, kinds)} ondelete={async (id) => { const snap = starts; await saveSetting(STARTS_KEY, starts.filter((k) => k.id !== id)); return snap; }} onundo={(snap) => saveSetting(STARTS_KEY, snap)} />
      {/if}
      <form class="rh-row" onsubmit={calmStart}>
        <input class="inp" bind:value={calmWhat} placeholder={t('e.g. clean the bike, pack calmly')} aria-label={t('What are you doing now?')} data-calm-what />
        {#if space.ids.length}
          <select class="inp" bind:value={calmHref} aria-label={t('With a function (optional)')}>
            <option value="">{t('Without a function')}</option>
            {#each space.ids as id (id)}<option value={featureHref(FEATURE[id]) ?? ''}>{fname(id)}</option>{/each}
          </select>
        {/if}
        <select class="inp" bind:value={calmMins} aria-label={t('For how long?')} data-calm-mins>
          {#each CALM_MINUTES as m (m)}<option value={m}>{m ? t('{n} min', { n: m }) : t('Until I tap «Done»')}</option>{/each}
        </select>
        <button type="submit" class="btn hi" disabled={!calmWhat.trim()}>{t('Calm view')}</button>
      </form>
    {/if}
    {#if week.length}
      <div class="rh-calm-week" data-calm-week>
        <p class="rh-calm-l">{t('This week')}</p>
        <ul class="rh-list">
          {#each week as w (w.what)}<li><span class="rh-grow">{w.times}× {w.what}</span><span>{durText(w.minutes)}</span></li>{/each}
        </ul>
        <button type="button" class="btn" onclick={() => saveSetting(CALM_LOG_KEY, [])} data-calm-log-clear>{t('Clear the history')}</button>
      </div>
    {/if}
  </Card>

  <Card id="budget" icon={BellRing} title={t('Reminder budget')} lead={t('At most a few phone reminders a day, in your order')} bind:open={open.budget}>
    <p class="rh-help">{t('When more reminders would come on one day, the order below decides which ones go out. Warnings for weather, ice, light and eating on the ride always come.')}</p>
    <label class="rh-row"><input type="checkbox" checked={budget.on} onchange={(e) => saveBudget({ ...budget, on: e.currentTarget.checked })} data-budget-on /> {t('Use a budget')}</label>
    <div class="rh-row" aria-label={t('Reminders per day')}>
      <button type="button" class="btn sm" aria-label={t('Fewer')} disabled={budget.perDay <= 1} onclick={() => saveBudget({ ...budget, perDay: budget.perDay - 1 })}>−</button>
      <b data-budget-n>{tn(budget.perDay, '{n} reminder a day', '{n} reminders a day')}</b>
      <button type="button" class="btn sm" aria-label={t('More')} disabled={budget.perDay >= 10} onclick={() => saveBudget({ ...budget, perDay: budget.perDay + 1 })}>+</button>
    </div>
    <ul class="rh-list" use:sortable={{ onmove: (from, to) => saveBudget({ ...budget, order: move(budget.order, from, to) }) }} data-budget-order>
      {#each budget.order as g, i (g)}
        {@const name = t(BUDGET_GROUPS.find((x) => x.key === g).label)}
        <li data-sort-id={g}>
          <SortGrip {name} onstep={(d) => saveBudget({ ...budget, order: move(budget.order, i, i + d) })} />
          <span class="rh-grow">{i + 1}. {name}</span>
          <SortArrows {name} {i} n={budget.order.length} onstep={(d) => saveBudget({ ...budget, order: move(budget.order, i, i + d) })} />
        </li>
      {/each}
    </ul>
    {#if preview && budget.on}
      {#if !preview.on}<p class="rh-note">{t('Phone reminders are off. The budget counts once you switch them on in Ich › Reminders on the phone.')}</p>
      {:else if preview.held.length}
        <p class="rh-sub">{tn(preview.held.length, '{n} reminder waits in the next 14 days', '{n} reminders wait in the next 14 days')}</p>
        <ul class="rh-list">{#each preview.held.slice(0, 6) as h (h.key + h.at)}<li><span class="rh-grow">{h.title}<small>{hm(h.at)}</small></span></li>{/each}</ul>
      {:else}<p class="rh-note">{t('In the next 14 days everything fits into the budget.')}</p>{/if}
    {/if}
  </Card>

  <Card id="notforme" icon={EyeOff} title={t('Not for me|feature')} lead={t('A function you do not need: the app stops putting it on top')} bind:open={open.notforme}>
    <p class="rh-help">{t('It stays in «What the app can do» and in the search, at the end of its group with «Not for me». Nothing is hidden or deleted.')}</p>
    <input class="inp" type="search" bind:value={notQText} placeholder={t('Which function? e.g. race')} aria-label={t('Find a function')} data-not-find />
    {#if notHits.length}
      <div class="rh-chips">{#each NOT_WHY as w (w)}<button type="button" class="rh-chip" aria-pressed={why === w} onclick={() => (why = why === w ? '' : w)}>{t(w)}</button>{/each}</div>
      <ul class="rh-list">{#each notHits as h (h.featureId)}<li><span class="rh-grow">{h.title}<small>{h.sub}</small></span><button type="button" class="btn sm" onclick={() => (saveNot(setNotForMe(notMap, h.featureId, why ? t(why) : '', today)), (notQText = ''))} data-not-add>{t('Not for me|feature')}</button></li>{/each}</ul>
    {/if}
    {#if Object.keys(notMap).length}
      <ul class="rh-list" data-not-list>
        {#each Object.entries(notMap) as [id, x] (id)}
          <li><span class="rh-grow">{fname(id)}{#if x.why}<small>{x.why}</small>{/if}</span><button type="button" class="btn sm btn-link" onclick={() => saveNot(unsetNotForMe(notMap, id))}>{t('Suggest again')}</button></li>
        {/each}
      </ul>
    {:else}<p class="rh-empty">{t('No function marked yet.')}</p>{/if}
  </Card>
</ul>

<style>
  .rh-calm {
    padding: var(--sp-5) var(--sp-4);
    border-radius: var(--radius-card);
    background: var(--paper-2);
    text-align: center;
    display: grid;
    gap: var(--sp-3);
    justify-items: center;
  }
  .rh-calm-l {
    margin: 0;
    color: var(--ink-2);
  }
  .rh-calm-w {
    margin: 0;
    font: 600 var(--fs-title) / 1.2 var(--font-body);
    overflow-wrap: break-word;
  }
</style>
