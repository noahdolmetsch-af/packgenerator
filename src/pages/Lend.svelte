<script>
  /**
   * Paket H «Packen leichter», answer 5 «5 a und b» (Noah 19.10.2026 12:09): Material › Ausgeliehen
   * (#/gear/lend). A lending list for a guest: choose the things, the return day (2 weeks unless you
   * choose another), send it as a link or a PDF (a), and the app remembers who has what (b): each thing
   * shows here until it is back, and on the return day a reminder comes (Ich › Erinnerungen).
   * A person's name is what you type; it never goes through t(). Nothing leaves the device unless you
   * send the link or the PDF yourself; the link carries only the names of the things.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';
  import { isInventory } from '../lib/gear.js';
  import { LENDS_KEY, newLend, markBack, markOut, isOpen, openItems, dueState, sortLends, lendPayload, lendLines, putLend, removeLends, saveLends, LEND_DAYS, addDaysTo } from '../lib/lend.js';
  import { shareLink } from '../lib/share.js';
  import { localDay } from '../lib/localday.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import ListTable from '../lib/ui/ListTable.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { askDelete, deleteWithUndo, saveFailed, once } from '../lib/ui/ask.js';
  import { Plus, Link, FileDown, Check, Undo2, Search, Trash2 } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  const lendsQ = liveQuery(() => db.settings.get(LENDS_KEY));
  const items = $derived($itemsQ ?? []);
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const lends = $derived(sortLends(Array.isArray($lendsQ?.value) ? $lendsQ.value : []));
  const open = $derived(lends.filter(isOpen));
  const closed = $derived(lends.filter((l) => !isOpen(l)));
  const today = localDay();

  let form = $state(null); // { person, due, note, picked: Set, q }
  let problem = $state('');
  let note = $state('');
  const startForm = () => (form = { person: '', due: addDaysTo(today, LEND_DAYS), note: '', picked: [], q: '' });
  const pickable = $derived(form ? items.filter((i) => isInventory(i) && (!form.q.trim() || nameOf(i).toLowerCase().includes(form.q.trim().toLowerCase()))).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'de')).slice(0, 60) : []);
  const flip = (id) => (form.picked = form.picked.includes(id) ? form.picked.filter((x) => x !== id) : [...form.picked, id]);

  const save = once(async () => {
    problem = '';
    if (!form.person.trim()) return (problem = t('Please enter who borrows the things.'));
    if (!form.picked.length) return (problem = t('Please choose at least one thing.'));
    const l = newLend({ person: form.person, itemIds: form.picked, due: form.due, note: form.note }, today);
    try {
      const before = await putLend(l);
      form = null;
      offerDone(t('Lending list for {person} saved.', { person: l.person }), () => saveLends(before));
    } catch (err) {
      problem = saveFailed(err);
    }
  });

  async function change(l, next, text) {
    try {
      const before = await putLend(next);
      offerDone(text, () => saveLends(before));
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  const back = (l, itemId) => change(l, markBack(l, itemId, today), itemId ? t('"{name}" is back.', { name: nameOf(byId[itemId]) || itemId }) : t('Everything from {person} is back.', { person: l.person }));
  const reopen = (l) => change(l, markOut(l), t('Open again.'));

  async function del(l) {
    if ((await askDelete({ title: t('Delete the list for {person}?', { person: l.person }), text: t('Only the list goes; your things stay in Gear.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => removeLends([l.id]), undo: (before) => saveLends(before), text: t('List for {person} deleted.', { person: l.person }), name: l.person });
  }

  const dateText = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long' }) : '');
  const dueText = (l) => {
    const s = dueState(l, today);
    return s === 'late' ? t('overdue since {date}', { date: dateText(l.due) }) : s === 'today' ? t('back today') : t('back by {date}', { date: dateText(l.due) });
  };
  const textsOf = (l) => ({ head: t('For {person}', { person: l.person }), back: l.due ? t('Please bring it back by {date}. Thank you!', { date: dateText(l.due) }) : '' });

  async function shareLinkOf(l) {
    try {
      const url = await shareLink(lendPayload({ ...l, items: openItems(l) }, byId, nameOf, t('For {person} · back by {date}', { person: l.person, date: dateText(l.due) })));
      const text = lendLines({ ...l, items: openItems(l) }, byId, nameOf, textsOf(l)).join('\n');
      if (navigator.share) await navigator.share({ title: textsOf(l).head, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        offerDone(t('Link copied. Paste it into a message.'));
      }
    } catch {
      /* the share window was closed */
    }
  }
  let making = $state('');
  async function pdfOf(l) {
    making = l.id;
    try {
      const { textPdf } = await import('../lib/docs/textpdf.js');
      const url = await textPdf(lendLines({ ...l, items: openItems(l) }, byId, nameOf, textsOf(l)), { title: textsOf(l).head });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${t('Lending list')} ${l.person}.pdf`.replace(/[\\/:*?"<>|]/g, '');
      document.body.append(a);
      a.click();
      a.remove();
    } catch (err) {
      problem = saveFailed(err);
    } finally {
      making = '';
    }
  }

  // answer 3: the shared table with every list (person, return day, note change in the cells)
  const cols = $derived([
    { key: 'person', label: t('Who'), type: 'text', required: true, bulk: false },
    { key: 'from', label: t('Since'), type: 'date', readOnly: true },
    { key: 'due', label: t('Back by'), type: 'date' },
    { key: 'n', label: t('Things'), type: 'number', readOnly: true, get: (l) => openItems(l).length },
    { key: 'state', label: t('State'), type: 'text', readOnly: true, get: (l) => (isOpen(l) ? dueText(l) : t('all back')) },
    { key: 'note', label: t('Note'), type: 'text' },
  ]);
  async function saveRows(pairs) {
    const list = Array.isArray($lendsQ?.value) ? $lendsQ.value : [];
    const map = new Map(pairs.map((p) => [p.after.id, p.after]));
    await saveLends(list.map((l) => map.get(l.id) ?? l));
  }
  const delRows = (rows) => removeLends(rows.map((r) => r.id));
</script>

<div class="page lend">
  <PathHead crumbs={[{ label: t('Gear|place'), href: '#/gear' }]} title={t('Lent out')} sub={$lendsQ !== undefined ? tn(open.length, '{n} list open', '{n} lists open') : ''}>
    {#if !form}<button type="button" class="btn hi" onclick={startForm}><Plus size={18} aria-hidden="true" /> {t('New lending list')}</button>{/if}
  </PathHead>
  <p class="intro">{t('A guest needs a helmet or a sleeping bag? Choose the things, send the list as a link or PDF, and the app remembers who has what. On the return day a reminder comes, if you switch it on under Me › Reminders.')}</p>
  {#if problem}<p class="err" role="alert">{problem}</p>{/if}

  {#if form}
    <form class="card form" onsubmit={save} aria-labelledby="nl-h">
      <h2 id="nl-h" class="title">{t('New lending list')}</h2>
      <label class="f"><span>{t('Who borrows it')}</span><input bind:value={form.person} autocomplete="off" placeholder={t('a name')} /></label>
      <label class="f"><span>{t('Back by')}</span><input type="date" bind:value={form.due} /></label>
      <label class="f wide"><span>{t('Note')} <small>{t('optional')}</small></span><input bind:value={form.note} placeholder={t('e.g. {x}', { x: t('Please dry the tent') })} /></label>
      <fieldset class="wide pick">
        <legend>{t('What they get')} <small class="num">{tn(form.picked.length, '{n} chosen', '{n} chosen')}</small></legend>
        <label class="s"><Search size={16} aria-hidden="true" /><input type="search" bind:value={form.q} aria-label={t('Search in your gear')} placeholder={t('Search in your gear')} /></label>
        <ul>
          {#each pickable as i (i.id)}
            <li><label><input type="checkbox" checked={form.picked.includes(i.id)} onchange={() => flip(i.id)} /> {nameOf(i)}</label></li>
          {/each}
        </ul>
      </fieldset>
      <div class="foot wide">
        <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
        <button type="submit" class="btn hi">{t('Save')}</button>
      </div>
    </form>
  {/if}

  {#if open.length}
    <div class="cards">
      {#each open as l (l.id)}
        {@const st = dueState(l, today)}
        <article class="card" aria-labelledby="l-{l.id}">
          <header class="lh">
            <h2 id="l-{l.id}" class="title">{l.person}</h2>
            <span class="due" class:late={st === 'late'} class:soon={st === 'today' || st === 'soon'}>{dueText(l)}</span>
          </header>
          <ul class="rows">
            {#each l.items as x (x.itemId)}
              <li class:back={x.back}>
                <span>{nameOf(byId[x.itemId]) || x.itemId}{x.qty > 1 ? ` × ${x.qty}` : ''}</span>
                {#if x.back}<small>{t('back')}</small>{:else}<button type="button" class="btn sm" onclick={() => back(l, x.itemId)}><Check size={16} aria-hidden="true" /> {t('Back|returned')}</button>{/if}
              </li>
            {/each}
          </ul>
          {#if l.note}<p class="nt">{l.note}</p>{/if}
          <div class="acts">
            <button type="button" class="btn" onclick={() => shareLinkOf(l)}><Link size={16} aria-hidden="true" /> {t('Send as link')}</button>
            <button type="button" class="btn" disabled={making === l.id} onclick={() => pdfOf(l)}><FileDown size={16} aria-hidden="true" /> {making === l.id ? t('Making PDF …') : t('PDF')}</button>
            <button type="button" class="btn" onclick={() => back(l, null)}>{t('All back')}</button>
            <button type="button" class="btn btn-link del" aria-label={t('Delete the list for {person}?', { person: l.person })} onclick={() => del(l)}><Trash2 size={16} aria-hidden="true" /></button>
          </div>
        </article>
      {/each}
    </div>
  {:else if !form}
    <Empty text={t('Nothing lent out right now.')} action={{ label: t('New lending list'), onclick: startForm }} />
  {/if}

  {#if lends.length}
    <section class="all" aria-labelledby="all-h">
      <h2 id="all-h" class="title">{t('All lending lists')}</h2>
      <ListTable rows={lends} {cols} nameOf={(l) => l.person} onsave={saveRows} ondelete={delRows} onrestore={(before) => saveLends(before)} actions={[{ label: t('Open again'), run: (rows) => Promise.all(rows.filter((r) => !isOpen(r)).map(reopen)) }]} label={t('All lending lists')} />
    </section>
  {/if}
  {#if closed.length}<p class="small">{tn(closed.length, '{n} list is closed: everything is back.', '{n} lists are closed: everything is back.')}</p>{/if}
</div>

<style>
  .lend {
    display: grid;
    gap: 16px;
  }
  .intro {
    margin: 0;
    color: var(--ink-2);
    max-width: 70ch;
  }
  .cards {
    display: grid;
    gap: 16px;
  }
  @media (min-width: 900px) {
    .cards {
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    }
  }
  .card {
    display: grid;
    gap: 10px;
    align-content: start;
    padding: 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .lh {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .lh h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .due {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .due.soon {
    color: var(--warn);
    font-weight: 600;
  }
  .due.late {
    color: var(--bad);
    font-weight: 600;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    border-bottom: 1px solid var(--line);
  }
  .rows li.back span {
    color: var(--ink-2);
    text-decoration: line-through;
  }
  .nt,
  .small {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .del {
    color: var(--bad);
  }
  .form {
    grid-template-columns: 1fr;
  }
  @media (min-width: 720px) {
    .form {
      grid-template-columns: 1fr 1fr;
    }
    .wide {
      grid-column: 1 / -1;
    }
  }
  .form h2 {
    margin: 0;
    grid-column: 1 / -1;
  }
  .f {
    display: grid;
    gap: 4px;
  }
  .f input,
  .s input {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink);
    font: inherit;
    padding: 0 10px;
  }
  .pick {
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    padding: 10px;
    margin: 0;
  }
  .pick ul {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    max-height: 320px;
    overflow: auto;
  }
  .pick li label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
  }
  .s {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .s input {
    flex: 1;
  }
  .foot {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .all {
    display: grid;
    gap: 10px;
  }
  .all h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .err {
    color: var(--bad);
  }
</style>
