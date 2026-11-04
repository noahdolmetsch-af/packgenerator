<script>
  /**
   * «Pässe sammeln» (Noah 03.11.2026 «E und F», Paket E, Idee 24): Touren › Rückblick › Pässe.
   * Rides that crossed a well-known pass suggest it here; a tap puts its yellow sign (name, height, day) into the
   * collection. «Not ridden» sends a suggestion away (it can come back). Own passes can be added, and every sign can
   * be changed or removed with Undo. Nothing is collected by itself.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { loadActs } from '../review/actdata.js';
  import { decodePolyline } from '../spur/polyline.js';
  import { localDay } from '../localday.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { PAESSE_KEY, stateOf, suggestions, collect, collectAll, addOwn, change, remove, skip, resetSkipped, newestFirst, highest } from './sammlung.js';
  import Passschild from './Passschild.svelte';
  import Empty from '../ui/Empty.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { Plus, Check, X, Pencil, Trash2, Mountain, ChevronRight } from '@lucide/svelte';

  const dataQ = liveQuery(async () => {
    const [set, acts, rides] = await Promise.all([db.settings.get(PAESSE_KEY), loadActs(db), db.rides.toArray().catch(() => [])]);
    return { state: stateOf(set?.value), acts, rides };
  });
  const data = $derived($dataQ ?? null);
  const st = $derived(data?.state ?? stateOf(null));

  // the rides with a line: Strava rides (no virtual ones) and the uploaded ones
  const sources = $derived.by(() => {
    if (!data) return [];
    const out = [];
    for (const a of data.acts) {
      if (!/Ride$/.test(a.type ?? '') || /Virtual/.test(a.type ?? '') || !a.line) continue;
      const line = decodePolyline(a.line);
      if (line.length > 1) out.push({ id: `a:${a.id}`, date: a.day ?? '', title: a.name ?? '', line });
    }
    for (const r of data.rides) if (Array.isArray(r.line) && r.line.length > 1) out.push({ id: `r:${r.id}`, date: r.date ?? '', title: r.name ?? '', line: r.line });
    return out;
  });
  const sugg = $derived(suggestions(sources, st));
  const sure = $derived(sugg.filter((s) => s.level === 'sure')); // «Collect all» takes only these; the others you confirm one by one
  const list = $derived(newestFirst(st.list));
  const top = $derived(highest(st.list));

  const save = (next) => putSetting(db, PAESSE_KEY, next);
  const dayText = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : '');

  async function take(s) {
    await save(collect(st, s));
    offerDone(t('«{name}» is in your collection.', { name: s.pass.name }));
  }
  async function takeAll() {
    await save(collectAll(st, sure));
    offerDone(tn(sure.length, '{n} pass is in your collection.', '{n} passes are in your collection.'));
  }
  async function notRidden(s) {
    const before = st;
    await save(skip(st, s.key));
    offerDone(t('«{name}» skipped.', { name: s.pass.name }), () => save(before));
  }

  // the form: a new own pass (id null) or the change of a collected one
  let form = $state(null); // { id, name, m, date }
  const open = (p = null) => (form = p ? { id: p.id, name: p.name, m: p.m ?? '', date: p.date } : { id: null, name: '', m: '', date: localDay() });
  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await save(form.id ? change(st, form.id, { name: form.name, m: form.m, date: form.date }) : addOwn(st, form));
    form = null;
  }
  async function drop(p) {
    if ((await askDelete({ title: t('Remove «{name}»?', { name: p.name }), text: t('The sign leaves your collection. A ride that crossed it may suggest it again.') })) !== 'delete') return;
    const before = st;
    await deleteWithUndo({ run: () => save(remove(st, p.id)), undo: () => save(before), text: t('«{name}» removed.', { name: p.name }), name: p.name });
    form = null;
  }
</script>

<div class="paesse" data-paesse>
  <p class="lead">{t('The passes you rode over, as yellow signs with height and day. Rides from Strava and uploaded rides suggest them; you decide what goes in.')}</p>

  {#if !data}
    <p class="quiet">{t('Loading …')}</p>
  {:else}
    {#if sugg.length}
      <section class="card sug" aria-labelledby="pa-sug" data-pass-suggestions>
        <div class="sh">
          <h2 id="pa-sug">{tn(sugg.length, '{n} pass on your rides', '{n} passes on your rides')}</h2>
          {#if sure.length > 1}<button type="button" class="btn" onclick={takeAll} data-pass-all><Check size={16} aria-hidden="true" />{sure.length < sugg.length ? t('Collect all sure ones') : t('Collect all')}</button>{/if}
        </div>
        <ul class="srows">
          {#each sugg as s (s.key)}
            <li data-suggest={s.key}>
              <div class="sm"><b>{s.pass.name}</b> <span class="num">{t('{m} m', { m: num(s.pass.m) })}</span><small>{[dayText(s.date), s.title].filter(Boolean).join(' · ')}</small>{#if s.level === 'maybe'}<small class="maybe" data-pass-maybe>{t('Please confirm: the line passed {n} m from the top.', { n: Math.round(s.km * 1000) })}</small>{/if}</div>
              <div class="sa">
                <button type="button" class="btn hi" onclick={() => take(s)} aria-label={t('Collect «{name}»', { name: s.pass.name })} data-pass-take><Check size={16} aria-hidden="true" />{s.level === 'maybe' ? t('Yes, rode it') : t('Collect')}</button>
                <button type="button" class="btn" onclick={() => notRidden(s)} aria-label={t('Not ridden: «{name}»', { name: s.pass.name })} data-pass-skip><X size={16} aria-hidden="true" />{t('Not ridden')}</button>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section aria-labelledby="pa-col" data-pass-collection>
      <div class="sh">
        <h2 id="pa-col">{t('Your passes')}{#if list.length}<span class="cnt num">{list.length}</span>{/if}</h2>
        <button type="button" class="btn" onclick={() => open()} data-pass-new><Plus size={16} aria-hidden="true" />{t('Add a pass')}</button>
      </div>
      {#if list.length}
        {#if top}<p class="quiet">{t('Highest: {name}, {m} m.', { name: top.name, m: num(top.m) })}</p>{/if}
        <ul class="signs">
          {#each list as p (p.id)}
            <li data-pass={p.id}>
              <Passschild name={p.name} m={p.m} date={dayText(p.date)} />
              <div class="pa">
                <button type="button" class="btn" onclick={() => open(p)} aria-label={t('Change «{name}»', { name: p.name })} data-pass-edit><Pencil size={15} aria-hidden="true" />{t('Change')}</button>
                <button type="button" class="btn" onclick={() => drop(p)} aria-label={t('Remove «{name}»', { name: p.name })} data-pass-drop><Trash2 size={15} aria-hidden="true" /></button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <Empty icon={Mountain} title={t('No pass yet')} text={sugg.length ? t('Rides that crossed a pass are listed above. Collect the ones you want.') : t('No ride of yours crossed a well-known pass so far. When one does, it is suggested here; you can also add a pass yourself.')} action={{ label: t('Add a pass'), onclick: () => open(), explain: t('Name, height and day of a pass you rode') }} />
      {/if}
    </section>

    {#if form}
      <form class="card form" onsubmit={submit} data-pass-form aria-label={form.id ? t('Change the pass') : t('Add a pass')}>
        <label for="pa-name">{t('Name')}</label>
        <input id="pa-name" bind:value={form.name} placeholder={t('e.g. Col du Test')} maxlength="60" required />
        <label for="pa-m">{t('Height in m')}</label>
        <input id="pa-m" type="number" inputmode="numeric" min="0" max="6000" bind:value={form.m} />
        <label for="pa-date">{t('Day ridden')}</label>
        <input id="pa-date" type="date" bind:value={form.date} />
        <div class="fa">
          <button type="submit" class="btn hi">{t('Save')}</button>
          <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
        </div>
      </form>
    {/if}

    {#if st.skipped.length}
      <p class="quiet"><button type="button" class="btn btn-link" onclick={() => save(resetSkipped(st))} data-pass-reset>{tn(st.skipped.length, '{n} pass marked «not ridden»: suggest it again', '{n} passes marked «not ridden»: suggest them again')}</button></p>
    {/if}

    <p class="next" data-pass-next>{t('Next:')} <a href="#/neuland">{t('New ground')}<ChevronRight size={14} aria-hidden="true" /></a> · <a href="#/heatmap">{t('Heatmap')}<ChevronRight size={14} aria-hidden="true" /></a></p>
  {/if}
</div>

<style>
  .paesse {
    display: grid;
    gap: var(--sp-4);
    max-width: 720px;
  }
  .lead,
  .quiet {
    margin: 0;
    color: var(--ink-2);
  }
  .quiet {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .sh {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    margin-bottom: 10px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-h3, 1.05rem) / 1.2 var(--font-body);
  }
  .cnt {
    margin-left: 8px;
    color: var(--ink-3);
    font-weight: 500;
  }
  .sug {
    padding: 14px 16px;
  }
  .srows,
  .signs {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .srows li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
  }
  .sm {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .sm small {
    color: var(--ink-3);
  }
  .sm small.maybe {
    color: var(--ink-2);
    font-weight: 600;
  }
  .sa,
  .pa,
  .fa {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .signs {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 170px), 1fr));
  }
  .signs li {
    display: grid;
    gap: 6px;
    align-content: start;
  }
  .form {
    display: grid;
    gap: 6px;
    padding: 14px 16px;
  }
  .form label {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .form input {
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--card-line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .fa {
    margin-top: 6px;
  }
  .next {
    margin: 0;
    color: var(--ink-3);
  }
  .next a {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
</style>
