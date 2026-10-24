<script>
  /**
   * Paket P4 «Aktiv», mockup ME4 (Noah 21.10.2026 «alle offenen Mockups freigegeben»): the yoga card on the
   * meditation page. The next regular class, the studio's timetable in one tap, your regular classes
   * (add, change, delete, move with arrows and drag), the studio (link and name, only on this device and in
   * the backup, changeable and deletable) and after a class «War dort» / «Ausgelassen». «War dort» ticks
   * Yoga in Aktiv (sub-goal Yoga Studio), so it counts in the Rückblick as yoga, apart from meditation.
   * Rules: lib/yogastudio.js. Not built: the reminder one hour before (said in the delivery note).
   */
  import { liveQuery } from 'dexie';
  import { Flower2, ExternalLink, Plus, Pencil, Trash2, Check, X, Building2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { tick, removeEntry } from '../flowdb.js';
  import { normAct, addDays } from '../flow.js';
  import { YOGA_KEY, YOGA_ACT, WEEKDAYS, yogaOf, setStudio, addClass, editClass, dropClass, moveClass, nextClass, openVisits, markVisit, unmarkVisit, visitCount } from '../yogastudio.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { sortable } from '../ui/sortable.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { dayShort } from '../flow/words.js';
  import { t, tn } from '../i18n.svelte.js';

  let { today } = $props();

  const q = liveQuery(async () => {
    const [rec, act] = await Promise.all([db.settings.get(YOGA_KEY), db.flowActs.get(YOGA_ACT)]);
    return { value: rec?.value ?? null, act: act ? normAct(act) : null };
  });
  const v = $derived(yogaOf($q?.value));
  const act = $derived($q?.act ?? null);
  const nowHM = () => new Date().toTimeString().slice(0, 5);
  let now = $state(nowHM());
  $effect(() => {
    const id = setInterval(() => (now = nowHM()), 60_000);
    return () => clearInterval(id);
  });
  const next = $derived(nextClass(v, today, now));
  const open = $derived(openVisits(v, today, now));
  const count = $derived(visitCount(v, today));
  const wdName = (wd) => t(WEEKDAYS.find((x) => x.wd === wd)?.label ?? 'Mon|weekday');
  const clsName = (c) => c.name || t('Yoga class');
  const rowName = (c) => `${wdName(c.wd)} ${c.time} · ${clsName(c)}`;
  const inWords = (n) => (n === 0 ? t('today') : n === 1 ? t('tomorrow') : t('in {n} days', { n }));
  const dayWord = (d) => (d === today ? t('today') : d === addDays(today, -1) ? t('yesterday') : dayShort(d));

  const save = (value) => db.settings.put({ key: YOGA_KEY, value: JSON.parse(JSON.stringify(value)) });
  let form = $state(null); // { id?, wd, time, name }
  let studio = $state(null); // { url, name }
  let err = $state('');
  let more = $state(false); // the regular classes and the studio fold away (the page stays short on a phone)

  async function saveClass(e) {
    e.preventDefault();
    try {
      await save(form.id ? editClass(v, form.id, form) : addClass(v, form));
      form = null;
    } catch (x) {
      saveFailed(x);
    }
  }
  async function delClass(c) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: rowName(c) }), text: t('Your answers so far stay.') })) !== 'delete') return;
    const before = v;
    await deleteWithUndo({ run: () => save(dropClass(v, c.id)), undo: () => save(before), text: t('"{name}" deleted.', { name: rowName(c) }), name: rowName(c) });
  }
  const move = (from, to) => save(moveClass(v, from, to)).catch(saveFailed);

  async function saveStudio(e) {
    e.preventDefault();
    const next = setStudio(v, studio);
    if (studio.url?.trim() && !next.studio.url) {
      err = t('Please enter a web address, e.g. www.example.ch');
      return;
    }
    try {
      await save(next);
      studio = null;
      err = '';
    } catch (x) {
      saveFailed(x);
    }
  }
  async function delStudio() {
    const name = v.studio.name || t('Studio');
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only the link and the name go. Your classes stay.') })) !== 'delete') return;
    const before = v;
    studio = null;
    await deleteWithUndo({ run: () => save(setStudio(v, {})), undo: () => save(before), text: t('"{name}" deleted.', { name }), name });
  }

  async function answer(o, went) {
    try {
      const e = went && act ? await tick(db, act, { day: o.day, sub: act.goals.some((g) => g.id === 'studio') ? 'studio' : undefined, min: Number(act.minMin) || undefined, via: 'yoga' }) : null;
      await save(markVisit(v, { day: o.day, classId: o.cls.id, went, flowId: e?.id ?? null }));
      offerDone(went ? t('Noted: you were there. It counts as yoga.') : t('Noted: skipped.'), async () => {
        if (e) await removeEntry(db, e.id);
        const cur = yogaOf((await db.settings.get(YOGA_KEY))?.value);
        await save(unmarkVisit(cur, o.day, o.cls.id));
      });
    } catch (x) {
      saveFailed(x);
    }
  }
</script>

<section class="surf pad yg" aria-labelledby="yg-h" data-yoga-card>
  <div class="yg-hl"><h2 id="yg-h" class="h2" title={t('Counts in the look back as yoga, apart from meditation.')}><Flower2 size={20} aria-hidden="true" />{t('Yoga')}</h2>{#if count.went || count.skipped}<small class="num">{t('last 30 days: {went}× there, {skipped}× skipped', count)}</small>{/if}</div>

  {#each open as o (o.day + o.cls.id)}
    <div class="yg-ask" data-yoga-ask={o.cls.id}>
      <b>{t('After the class: {name}, {day} {time}', { name: clsName(o.cls), day: dayWord(o.day), time: o.cls.time })}</b>
      <span class="yg-acts">
        <button type="button" class="btn hi sm" onclick={() => answer(o, true)} data-yoga-went><Check size={16} aria-hidden="true" />{t('Was there')}</button>
        <button type="button" class="btn sm" onclick={() => answer(o, false)} data-yoga-skip>{t('Skipped')}</button>
      </span>
    </div>
  {/each}

  {#if next}
    <p class="yg-next" data-yoga-next><span class="yg-k">{t('Next regular class')}</span><b>{wdName(next.cls.wd)} {next.cls.time} · {clsName(next.cls)}</b><small>{inWords(next.inDays)}</small></p>
  {/if}
  <div class="yg-acts">
    <button type="button" class="btn" aria-expanded={more} onclick={() => (more = !more)} data-yoga-more>{more ? t('Close') : t('Classes and studio')}{#if v.classes.length && !more}{' '}<span class="num">({v.classes.length})</span>{/if}</button>
    {#if v.studio.url}
      <a class="btn" href={v.studio.url} target="_blank" rel="noopener noreferrer" data-yoga-studio><ExternalLink size={16} aria-hidden="true" />{t('Timetable and booking')}</a>
    {/if}
    {#if more}<button type="button" class="btn" onclick={() => ((studio = { ...v.studio }), (err = ''))} data-yoga-studio-edit><Building2 size={16} aria-hidden="true" />{v.studio.url || v.studio.name ? t('Change the studio') : t('Set up the studio')}</button>{/if}
  </div>

  {#if more}
  <p class="yg-fine">{t('Counts in the look back as yoga, apart from meditation.')}</p>
  {#if studio}
    <form class="yg-form" onsubmit={saveStudio} data-yoga-studio-form>
      <label>{t('Link to the timetable')}<input class="inp" type="text" inputmode="url" autocomplete="url" bind:value={studio.url} placeholder="www.example.ch" data-yoga-url /></label>
      <label>{t('Name (optional)')}<input class="inp" maxlength="60" bind:value={studio.name} placeholder={t('e.g. my studio')} data-yoga-sname /></label>
      <p class="yg-fine">{t('Only on this device and in the backup.')}</p>
      {#if err}<p class="yg-err" role="alert">{err}</p>{/if}
      <span class="yg-acts">
        <button type="submit" class="btn hi sm" data-yoga-studio-save>{t('Save')}</button>
        <button type="button" class="btn sm" onclick={() => (studio = null)}>{t('Cancel')}</button>
        {#if v.studio.url || v.studio.name}<button type="button" class="btn sm" onclick={delStudio} data-yoga-studio-del><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
      </span>
    </form>
  {/if}

  <h3 class="yg-h3">{t('My regular classes')}</h3>
  {#if v.classes.length}
    <ul class="yg-list" use:sortable={{ onmove: move }} data-yoga-classes>
      {#each v.classes as c, i (c.id)}
        <li class="yg-row" data-sort-id={c.id} data-yoga-class={c.id}>
          <SortGrip name={rowName(c)} onstep={(dir) => move(i, i + dir)} />
          <span class="yg-m"><b>{wdName(c.wd)} {c.time}</b><small>{clsName(c)} · {t('every week')}</small></span>
          <SortArrows name={rowName(c)} {i} n={v.classes.length} onstep={(dir) => move(i, i + dir)} />
          <button type="button" class="yg-ib" aria-label={t('Change «{name}»', { name: rowName(c) })} onclick={() => (form = { ...c })} data-yoga-class-edit><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" class="yg-ib" aria-label={t('Delete «{name}»', { name: rowName(c) })} onclick={() => delClass(c)} data-yoga-class-del><Trash2 size={16} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="yg-fine">{t('No regular class yet. Add the classes you go to every week.')}</p>
  {/if}

  {#if form}
    <form class="yg-form" onsubmit={saveClass} data-yoga-class-form>
      <div class="yg-two">
        <label>{t('Weekday')}<select class="inp" bind:value={form.wd} data-yoga-wd>{#each WEEKDAYS as w (w.wd)}<option value={w.wd}>{t(w.label)}</option>{/each}</select></label>
        <label>{t('Time')}<input class="inp" type="time" bind:value={form.time} required data-yoga-time /></label>
      </div>
      <label>{t('Name')}<input class="inp" maxlength="60" bind:value={form.name} placeholder={t('e.g. Hatha')} data-yoga-name /></label>
      <span class="yg-acts">
        <button type="submit" class="btn hi sm" data-yoga-class-save>{t('Save')}</button>
        <button type="button" class="btn sm" onclick={() => (form = null)}><X size={16} aria-hidden="true" />{t('Cancel')}</button>
      </span>
    </form>
  {:else}
    <button type="button" class="btn yg-add" onclick={() => (form = { wd: 4, time: '18:30', name: '' })} data-yoga-add><Plus size={16} aria-hidden="true" />{t('Add a class')}</button>
  {/if}
  {/if}
</section>

<style>
  .yg-hl {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 12px;
  }
  .yg-hl h2 {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
  .yg-hl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .yg-fine {
    margin: 4px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .yg-err {
    margin: 4px 0;
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .yg-ask {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 8px 0;
    padding: 10px 12px;
    border: 1px solid var(--accent);
    border-radius: 10px;
    overflow-wrap: break-word;
  }
  .yg-ask b {
    flex: 1 1 14em;
    min-width: 0;
  }
  .yg-next {
    display: grid;
    gap: 2px;
    margin: 8px 0;
    overflow-wrap: break-word;
  }
  .yg-k {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .yg-next small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .yg-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .yg-acts .btn {
    min-height: 44px;
    text-decoration: none;
  }
  .yg-h3 {
    margin: 16px 0 4px;
    font-size: var(--fs-body);
  }
  .yg-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .yg-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .yg-m {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .yg-m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .yg-ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .yg-form {
    display: grid;
    gap: 8px;
    margin: 10px 0;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  .yg-form label {
    display: grid;
    gap: 4px;
    min-width: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .yg-form .inp {
    min-height: 44px;
    min-width: 0;
    font-weight: 400;
  }
  .yg-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .yg-add {
    margin-top: 8px;
    min-height: 44px;
  }
</style>
