<script>
  /**
   * «Meine Ideen» (mockup HN4c, Noah 14.10.2026 «4 ok»: an own list pinned to Balance, also in Kalender › Merken;
   * «6a 7a 8a»: the 4th card in Aktiv, «Erinnern …» for an idea with a date, «Bereiche wählen»).
   *   #/flow/ideen   «Für deine Balance»: the 3 weakest areas of the last 7 days with their tip, «Mag ich → in
   *                  meine Ideen» or «Nicht jetzt» (that tip hides for 7 days); the other areas folded.
   *                  «Meine Ideen»: a new idea with an area and «Wann?» if you like, tick, remove with Undo;
   *                  the done ones folded. A ticked idea does not count for the Balance by itself.
   *                  «Erinnern …» on an idea with a date makes a reminder (Kalender › Merken, ER3).
   *                  «Bereiche wählen» hides whole areas from the tips (e.g. Visionen).
   */
  import { liveQuery } from 'dexie';
  import { Plus, X, ChevronDown, ChevronRight, Lightbulb, Info, Bell, BellRing, SlidersHorizontal } from '@lucide/svelte';
  import MoreAktiv from '../../lib/flow/kit/MoreAktiv.svelte';
  import { morePages } from '../../lib/flow/morepages.js';
  import { MERKEN_KEY, addTodo, removeTodo } from '../../lib/merkendb.js';
  import { db } from '../../lib/db.js';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import DateInput from '../../lib/ui/DateInput.svelte';
  import { balanceQuery } from '../../lib/flow/data.svelte.js';
  import { balance, CATS, CAT } from '../../lib/balance.js';
  import { LISTS_KEY, IDEAS_ID, NOT_NOW_KEY, HIDDEN_AREAS_KEY, ideasList, addPoint, togglePoint, removePoint, tipHidden, weakest } from '../../lib/lists.js';
  import { loadLists, uid } from '../../lib/listsdb.js';
  import { dayLabel } from '../../lib/merken/when.js';
  import { offerDone } from '../../lib/ui/rename.svelte.js';
  import { localDay } from '../../lib/localday.js';
  import { t } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const bq = balanceQuery(today);
  const b = $derived($bq ? balance({ ...$bq, today }) : null);
  const q = liveQuery(async () => {
    const [l, n, h, m] = await Promise.all([db.settings.get(LISTS_KEY), db.settings.get(NOT_NOW_KEY), db.settings.get(HIDDEN_AREAS_KEY), db.settings.get(MERKEN_KEY)]);
    return { list: (l?.value ?? []).find((x) => x.id === IDEAS_ID) ?? null, notNow: n?.value ?? {}, hidden: h?.value ?? [], todos: m?.value ?? [] };
  });
  const hidden = $derived($q?.hidden ?? []);
  /** «Erinnern …» (7a): the reminder of an idea is a to-do with src idea:<id> (shows in Kalender › Merken). */
  const reminderOf = (x) => ($q?.todos ?? []).find((td) => td.src === `idea:${x.id}` && !td.doneAt) ?? null;
  async function remind(x) {
    const r = reminderOf(x);
    if (r) {
      const undo = await removeTodo(db, r.id);
      return offerDone(t('Reminder removed.'), undo);
    }
    const res = await addTodo(db, { text: x.text, due: x.date, remind: { at: '08:00', before: 0 }, area: 'own', src: `idea:${x.id}` });
    if (res) offerDone(t('Reminder on {day}, 08:00.', { day: dayLabel(x.date, today) }), res.undo);
  }
  let pick = $state(false);
  const flipArea = (k) => db.settings.put({ key: HIDDEN_AREAS_KEY, value: hidden.includes(k) ? hidden.filter((x) => x !== k) : [...hidden, k] });
  const list = $derived($q?.list ?? null);
  const notNow = $derived($q?.notNow ?? {});
  const open = $derived((list?.items ?? []).filter((x) => !x.done));
  const done = $derived((list?.items ?? []).filter((x) => x.done));
  const ranked = $derived(b ? weakest(b.cats).filter((c) => !hidden.includes(c.key)) : []);
  const top = $derived(ranked.filter((c) => !tipHidden(notNow, c.key, today)).slice(0, 3));
  const others = $derived(CATS.filter((c) => !hidden.includes(c.key) && !top.some((x) => x.key === c.key)).map((c) => ({ ...c, value: b?.cats.find((x) => x.key === c.key)?.value ?? null })));

  let text = $state('');
  let area = $state('');
  let date = $state('');
  let more = $state(false);
  let showDone = $state(false);

  /** Changes the ideas list (made the first time); returns Undo. */
  async function change(fn) {
    return db.transaction('rw', db.settings, async () => {
      const before = await loadLists(db);
      const has = before.some((l) => l.id === IDEAS_ID);
      const all = has ? before : [...before, ideasList(t('My ideas'))];
      await db.settings.put({ key: LISTS_KEY, value: JSON.parse(JSON.stringify(all.map((l) => (l.id === IDEAS_ID ? fn(l) : l)))) });
      return () => db.settings.put({ key: LISTS_KEY, value: before });
    });
  }
  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const tx = text;
    const undo = await change((l) => addPoint(l, tx, { id: uid('id'), area: area || null, date: date || null }));
    text = '';
    area = '';
    date = '';
    offerDone(t('Idea saved.'), undo);
  }
  async function like(c) {
    const undo = await change((l) => addPoint(l, t(CAT[c.key].tip), { id: uid('id'), area: c.key }));
    offerDone(t('In your ideas.'), undo);
  }
  const later = (c) => db.settings.put({ key: NOT_NOW_KEY, value: { ...notNow, [c.key]: today } });
  const toggle = (x) => change((l) => togglePoint(l, x.id));
  async function drop(x) {
    const undo = await change((l) => removePoint(l, x.id));
    offerDone(t('«{name}» removed.', { name: x.text }), undo);
  }
</script>

<div class="ideas">
  <header class="ph">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={t('Ideas')} />
    <MoreAktiv items={morePages({ ideas: open.length })} on="ideas" />
    <PageHead title={t('Ideas')} text={t('Tips for your balance and your own ideas. Also in Calendar › Remember.')} />
  </header>

  <div class="lay">
    <section class="col" aria-labelledby="id-bal-h">
      <div class="shr">
        <h2 id="id-bal-h" class="sh">{t('For your balance')}</h2>
        <button type="button" class="lnk" aria-expanded={pick} onclick={() => (pick = !pick)}><SlidersHorizontal size={16} aria-hidden="true" />{t('Choose areas')}</button>
      </div>
      {#if pick}
        <div class="card picks" role="group" aria-label={t('Choose areas')}>
          <small>{t('Areas switched off get no tips.')}</small>
          <div class="pchips">{#each CATS as c (c.key)}<button type="button" class="pchip" aria-pressed={!hidden.includes(c.key)} onclick={() => flipArea(c.key)}>{t(c.label)}</button>{/each}</div>
        </div>
      {/if}
      {#if !b || !ranked.length}
        <p class="card none">{t('As soon as you answer «Wi gaht\'s?» or tick an activity, the tips for your weakest areas come here.')}</p>
      {:else}
        {#each top as c (c.key)}
          <article class="card tip" data-tip={c.key}>
            <div class="th"><b>{t(CAT[c.key].label)}</b><span class="num">{c.value}</span></div>
            <span class="bar" aria-hidden="true"><span style:width="{c.value}%"></span></span>
            <p>{t(CAT[c.key].tip)}</p>
            <div class="acts">
              <button type="button" class="btn sm hi" onclick={() => like(c)}>{t('I like it → my ideas')}</button>
              <button type="button" class="lnk" onclick={() => later(c)}>{t('Not now')}</button>
            </div>
          </article>
        {/each}
        <button type="button" class="fold" aria-expanded={more} onclick={() => (more = !more)}>{#if more}<ChevronDown size={16} aria-hidden="true" />{:else}<ChevronRight size={16} aria-hidden="true" />{/if}{t('{n} more areas', { n: others.length })}</button>
        {#if more}
          <ul class="card others">
            {#each others as c (c.key)}<li><b>{t(c.label)}</b><span class="num">{c.value ?? '–'}</span><small>{t(c.tip)}</small></li>{/each}
          </ul>
        {/if}
      {/if}
    </section>

    <section class="col" aria-labelledby="id-my-h">
      <h2 id="id-my-h" class="sh">{t('My ideas')}{#if open.length}<span class="cnt">{t('{n} open', { n: open.length })}</span>{/if}</h2>
      <form class="card add" onsubmit={add}>
        <div class="row">
          <input class="inp" bind:value={text} maxlength="160" enterkeyhint="done" placeholder={t('New idea …')} aria-label={t('New idea')} />
          <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
        </div>
        <div class="row opt">
          <select class="inp" bind:value={area} aria-label={t('Area?')}>
            <option value="">{t('Area?')}</option>
            {#each CATS as c (c.key)}<option value={c.key}>{t(c.label)}</option>{/each}
          </select>
          <DateInput bind:value={date} min={today} aria-label={t('When?')} />
        </div>
        <small>{t('Both can come later.')}</small>
      </form>

      {#if open.length}
        <ul class="card mine">
          {#each open as x (x.id)}
            <li data-idea>
              <button type="button" class="ck" role="checkbox" aria-checked="false" aria-label={t('Done: {name}', { name: x.text })} onclick={() => toggle(x)}></button>
              <span class="tx"><b>{x.text}</b><small>{#if x.area}<span class="chip">{t(CAT[x.area]?.label ?? '')}</span>{/if}{#if x.date}<span>{dayLabel(x.date, today)}</span>{/if}</small></span>
              {#if x.date}{@const r = reminderOf(x)}<button type="button" class="rm" class:on={!!r} aria-pressed={!!r} onclick={() => remind(x)} aria-label={r ? t('Reminder on: {name}', { name: x.text }) : t('Remind me: {name}', { name: x.text })}>{#if r}<BellRing size={16} aria-hidden="true" />{:else}<Bell size={16} aria-hidden="true" />{/if}</button>{/if}
              <button type="button" class="rm" onclick={() => drop(x)} aria-label={t('Remove: {name}', { name: x.text })}><X size={16} aria-hidden="true" /></button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="card none"><Lightbulb size={18} aria-hidden="true" />{t('No own idea yet. Write one, or take a tip on the left.')}</p>
      {/if}

      {#if done.length}
        <button type="button" class="fold" aria-expanded={showDone} onclick={() => (showDone = !showDone)}>{#if showDone}<ChevronDown size={16} aria-hidden="true" />{:else}<ChevronRight size={16} aria-hidden="true" />{/if}{t('Done')} · {done.length}</button>
        {#if showDone}
          <ul class="card mine">
            {#each done as x (x.id)}
              <li class="done"><button type="button" class="ck" role="checkbox" aria-checked="true" aria-label={x.text} onclick={() => toggle(x)}></button><span class="tx"><b>{x.text}</b></span></li>
            {/each}
          </ul>
        {/if}
      {/if}
      <p class="note"><Info size={16} aria-hidden="true" />{t('Everything here is a suggestion. A ticked idea does not count for your balance by itself.')}</p>
    </section>
  </div>
</div>

<style>
  .ideas {
    max-width: 1080px;
  }
  .lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  .col {
    display: grid;
    gap: 12px;
  }
  .sh {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0;
    font-size: var(--fs-section);
  }
  .shr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .picks {
    display: grid;
    gap: 8px;
    padding: 12px 16px;
  }
  .picks small {
    color: var(--ink-2);
  }
  .pchips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pchip {
    min-height: 44px;
    padding: 0 12px;
    border: 1.5px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    text-decoration: line-through;
    cursor: pointer;
  }
  .pchip[aria-pressed='true'] {
    border-color: var(--ink);
    color: var(--ink);
    text-decoration: none;
  }
  .rm.on {
    color: var(--accent);
  }
  .cnt {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .tip,
  .none,
  .add,
  .others {
    padding: 14px 16px;
  }
  .tip p {
    margin: 8px 0 0;
  }
  .th {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .bar {
    display: block;
    height: 6px;
    margin-top: 6px;
    border-radius: 3px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    margin-top: 10px;
  }
  .lnk,
  .fold {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .lnk {
    text-decoration: underline;
  }
  .others {
    list-style: none;
    margin: 0;
  }
  .others li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 8px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .others li:first-child {
    border-top: 0;
  }
  .others small {
    grid-column: 1 / -1;
    color: var(--ink-2);
  }
  .add {
    display: grid;
    gap: 8px;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  .row > :global(*) {
    flex: 1;
    min-width: 0;
  }
  .row .btn {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .add small {
    color: var(--ink-2);
  }
  .mine {
    list-style: none;
    margin: 0;
    padding: 4px 16px;
  }
  .mine li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    border-top: 1px solid var(--line);
  }
  .mine li:first-child {
    border-top: 0;
  }
  .ck {
    position: relative;
    flex: none;
    width: 24px;
    height: 24px;
    border: 1.5px solid var(--line-strong, var(--ink-2));
    border-radius: 50%;
    background: var(--paper);
    cursor: pointer;
  }
  .ck::before {
    content: '';
    position: absolute;
    inset: -10px;
  }
  .ck[aria-checked='true'] {
    background: var(--accent);
    border-color: var(--accent);
  }
  .tx {
    flex: 1;
    min-width: 0;
  }
  .tx b {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .tx small {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--ink-2);
  }
  .chip {
    padding: 0 8px;
    border-radius: 99px;
    background: var(--paper-2);
  }
  .done .tx b {
    color: var(--ink-2);
    text-decoration: line-through;
  }
  .rm {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .none {
    display: flex;
    gap: 8px;
    margin: 0;
    color: var(--ink-2);
  }
  .note {
    display: flex;
    gap: 8px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  @media (max-width: 719px) {
    .lay {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
