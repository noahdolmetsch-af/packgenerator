<script>
  /**
   * Vorgänge im Eingang (#/inbox/vorgaenge; 996 Ideen, Noah 25.10.2026 «bauen … 11, 16»):
   * - «Doppelter Eingang»: a mail, a photo and a note that look like the same matter are suggested as
   *   belonging together. «Merge» (Noah 26.10.2026 «3a») puts them into one Vorgang with Undo; each entry stays as it came in.
   * - «Mail als Vorgang»: a confirmation, a question and the bill later go into the same Vorgang; the app
   *   suggests one (same sender and subject, a shared number), you decide.
   * - Your Vorgänge: a group like everywhere: add, rename, sort (arrows and drag), delete (where do its
   *   entries go, «Without a matter» first, then Undo). Logic: src/lib/inbox/vorgang.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import Card from '../lib/ruhig/Card.svelte';
  import RenameSheet from '../lib/ui/RenameSheet.svelte';
  import GroupDeleteSheet from '../lib/ui/GroupDeleteSheet.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { move } from '../lib/ruhig/base.js';
  import { CASES_KEY, CASE_NO_KEY, casesOf, doublePairs, caseSuggestions, sourceOf, mailRole, ROLES, nameFrom, newCase, renameCase, dropCase, entriesByCase, moveEntries, noKey, withNo } from '../lib/inbox/vorgang.js';
  import { Combine, Mail, Camera, NotebookPen, FolderKanban, Check, X, Pencil, Trash2, Plus, Unlink } from '@lucide/svelte';
  import '../lib/ruhig/ruhig.css';

  const notesQ = liveQuery(() => db.notes.toArray());
  const casesQ = liveQuery(async () => (await db.settings.get(CASES_KEY))?.value ?? []);
  const noQ = liveQuery(async () => (await db.settings.get(CASE_NO_KEY))?.value ?? []);
  const notes = $derived($notesQ ?? []);
  const cases = $derived(casesOf($casesQ));
  const no = $derived(Array.isArray($noQ) ? $noQ : []);
  const pairs = $derived(doublePairs(notes, { no }));
  const sugg = $derived(caseSuggestions(notes, cases, { no }));
  const byCase = $derived(entriesByCase(notes));
  const loose = $derived(notes.filter((n) => n.mail && !n.caseId && !sugg.some((s) => s.note.id === n.id)).sort((a, b) => String(b.mail.date ?? b.at).localeCompare(String(a.mail.date ?? a.at))).slice(0, 8));
  let open = $state({ double: true, mail: true });
  let renaming = $state(null);
  let deleting = $state(null);
  let fresh = $state('');

  const plain = (x) => JSON.parse(JSON.stringify(x));
  const saveCases = (list) => db.settings.put({ key: CASES_KEY, value: plain(list) });
  const sayNo = (key) => db.settings.put({ key: CASE_NO_KEY, value: withNo(no, key) });
  const setCase = (ids, caseId) => db.transaction('rw', db.notes, async () => {
    for (const id of ids) await db.notes.update(id, { caseId: caseId ?? null });
  });
  const ICON = { mail: Mail, photo: Camera, note: NotebookPen };
  const SRC = { mail: 'Mail|source', photo: 'Photo|source', note: 'Note|source' };
  const title = (n) => n?.mail?.subject || n?.title || String(n?.text ?? '').split('\n')[0] || t('Note');
  const when = (n) => new Date(n?.mail?.date ?? n?.at ?? Date.now()).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  const caseName = (id) => cases.find((c) => c.id === id)?.name ?? '';
  const hrefOf = (n) => (n.status === 'kept' ? `#/notes?open=${encodeURIComponent(n.id)}` : '#/inbox');
  const WHY = { number: 'Same number {x}', amount: 'Same amount {x}', words: 'Same words: {x}' };
  const MAIL_WHY = { subject: 'same sender and subject', number: 'a shared number', sender: 'same sender, similar words' };

  async function together(p) {
    let id = p.a.caseId || p.b.caseId;
    if (!id) {
      const c = newCase(nameFrom(p.a.mail ? p.a : p.b.mail ? p.b : p.a) || t('Matter'));
      await saveCases([...cases, c]);
      id = c.id;
    }
    const before = [p.a, p.b].map((n) => ({ id: n.id, caseId: n.caseId ?? null }));
    const made = !(p.a.caseId || p.b.caseId) ? id : null;
    await setCase([p.a.id, p.b.id], id);
    offerDone(t('Now together in «{name}».', { name: caseName(id) || t('Matter') }), async () => {
      for (const b of before) await db.notes.update(b.id, { caseId: b.caseId });
      if (made) await saveCases(dropCase(casesOf((await db.settings.get(CASES_KEY))?.value), made));
    });
  }
  async function intoCase(n, id) {
    await setCase([n.id], id);
    offerDone(t('Into «{name}».', { name: caseName(id) }), () => setCase([n.id], null));
  }
  async function caseFromMail(n) {
    const c = newCase(nameFrom(n) || t('Matter'));
    await saveCases([...cases, c]);
    await setCase([n.id], c.id);
  }
  async function add(e) {
    e.preventDefault();
    const c = newCase(fresh);
    if (!c) return;
    await saveCases([...cases, c]);
    fresh = '';
  }
  async function rename(name) {
    const old = renaming.name;
    await saveCases(renameCase(cases, renaming.id, name));
    offerDone(t('Renamed to «{name}».', { name: name.trim() || old }));
  }
  async function confirmDelete(to) {
    const c = deleting;
    const beforeCases = plain(cases);
    const moved = moveEntries(notes, c.id, to);
    const beforeNotes = notes.filter((n) => n.caseId === c.id).map((n) => ({ id: n.id, caseId: n.caseId }));
    await setCase(moved.map((n) => n.id), to);
    await saveCases(dropCase(cases, c.id));
    offerDone(t('«{name}» deleted.', { name: c.name }), async () => {
      await saveCases(beforeCases);
      for (const b of beforeNotes) await db.notes.update(b.id, { caseId: b.caseId });
    });
  }
</script>

<div class="vg-page" data-vorgaenge>
  <Crumbs crumbs={[{ label: t('Plan|place'), href: '#/week' }, { label: t('Inbox'), href: '#/inbox' }]} here={t('Matters')} />
  <PageHead title={t('Matters')} text={t('Entries that belong to the same matter: a booking, its question and the bill. The app suggests, you decide; every entry stays as it came in.')} />

  <ul class="rh-cards">
    <Card id="double" icon={Combine} title={t('Double entries in the inbox')} lead={pairs.length ? tn(pairs.length, '{n} suggestion', '{n} suggestions') : t('Mail, photo and note about the same thing')} bind:open={open.double}>
      <p class="rh-help">{t('A mail, a photo and a note can be about the same thing. The app shows pairs with the same number, amount or words. «Merge» puts them together into one matter; both entries stay, nothing is lost.')}</p>
      {#if pairs.length}
        <ul class="rh-list vg-pairs">
          {#each pairs as p (p.a.id + p.b.id)}
            <li data-double>
              <span class="rh-grow">
                {#each [p.a, p.b] as n (n.id)}
                  {@const I = ICON[sourceOf(n)]}
                  <span class="vg-e"><I size={14} aria-hidden="true" /><b>{t(SRC[sourceOf(n)])}</b> · <a href={hrefOf(n)}>{title(n)}</a> <small>{when(n)}</small></span>
                {/each}
                <small>{p.why.map((w) => t(WHY[w.kind], { x: w.text })).join(' · ')}</small>
                <span class="rh-row vg-acts">
                  <button type="button" class="btn sm hi" onclick={() => together(p)} data-double-yes><Combine size={14} aria-hidden="true" />{t('Merge')}</button>
                  <button type="button" class="btn sm" onclick={() => sayNo(noKey(p.a.id, p.b.id))} data-double-no><X size={14} aria-hidden="true" />{t('Not the same')}</button>
                </span>
              </span>
            </li>
          {/each}
        </ul>
      {:else}<p class="rh-empty">{t('No double entry found right now.')}</p>{/if}
    </Card>

    <Card id="mail" icon={Mail} title={t('Mail as a matter')} lead={sugg.length ? tn(sugg.length, '{n} mail fits a matter', '{n} mails fit a matter') : t('Confirmation, question and bill together')} bind:open={open.mail}>
      <p class="rh-help">{t('A confirmation, a question and the bill later can go into the same matter. The app suggests one when the sender and the subject or a number fit; nothing moves by itself.')}</p>
      {#if sugg.length}
        <ul class="rh-list">
          {#each sugg as s (s.note.id)}
            {@const role = mailRole(s.note)}
            <li data-mail-sugg>
              <span class="rh-grow"><a href={hrefOf(s.note)}>{title(s.note)}</a>{#if role}{' '}<span class="rh-tag">{t(ROLES[role])}</span>{/if}<small>{t('Fits «{name}»: {why}', { name: caseName(s.caseId), why: t(MAIL_WHY[s.why]) })}</small>
                <span class="rh-row vg-acts">
                  <button type="button" class="btn sm hi" onclick={() => intoCase(s.note, s.caseId)} data-mail-yes><Check size={14} aria-hidden="true" />{t('Into «{name}»', { name: caseName(s.caseId) })}</button>
                  <button type="button" class="btn sm" onclick={() => sayNo(noKey(s.note.id, s.caseId))} data-mail-no><X size={14} aria-hidden="true" />{t('No')}</button>
                </span>
              </span>
            </li>
          {/each}
        </ul>
      {/if}
      {#if loose.length}
        <h3 class="rh-sub">{t('Mails without a matter')}</h3>
        <ul class="rh-list">
          {#each loose as n (n.id)}
            {@const role = mailRole(n)}
            <li data-mail-loose>
              <span class="rh-grow"><a href={hrefOf(n)}>{title(n)}</a>{#if role}{' '}<span class="rh-tag">{t(ROLES[role])}</span>{/if}<small>{n.mail.fromName || n.mail.from} · {when(n)}</small>
                <span class="rh-row vg-acts">
                  {#if cases.length}
                    <select class="inp vg-sel" aria-label={t('Into a matter')} onchange={(e) => e.currentTarget.value && intoCase(n, e.currentTarget.value)}>
                      <option value="">{t('Into a matter …')}</option>
                      {#each cases as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
                    </select>
                  {/if}
                  <button type="button" class="btn sm" onclick={() => caseFromMail(n)} data-mail-new><Plus size={14} aria-hidden="true" />{t('New matter')}</button>
                </span>
              </span>
            </li>
          {/each}
        </ul>
      {/if}
      {#if !sugg.length && !loose.length}<p class="rh-empty">{t('No mail waits for a matter. Mails come into the inbox from Me › Mail.')}</p>{/if}
    </Card>
  </ul>

  <section class="vg-own" aria-labelledby="vg-own-h">
    <h2 id="vg-own-h" class="rh-sub"><FolderKanban size={18} aria-hidden="true" /> {t('Your matters')} {#if cases.length}<span class="rh-tag">{cases.length}</span>{/if}</h2>
    {#if !cases.length}<p class="rh-empty">{t('No matter yet. Take a suggestion above or add one here.')}</p>{/if}
    <ul class="rh-cards" use:sortable={{ onmove: (from, to) => saveCases(move(cases, from, to)) }} data-cases>
      {#each cases as c, i (c.id)}
        {@const list = byCase[c.id] ?? []}
        <li class="rh-card" data-sort-id={c.id} data-case={c.id}>
          <div class="rh-body vg-top">
            <div class="rh-row vg-ch">
              <SortGrip name={c.name} onstep={(d) => saveCases(move(cases, i, i + d))} />
              <h3 class="rh-sub vg-name">{c.name} <small>{tn(list.length, '{n} entry', '{n} entries')}</small></h3>
              <SortArrows name={c.name} {i} n={cases.length} onstep={(d) => saveCases(move(cases, i, i + d))} />
              <button type="button" class="rh-x" aria-label={t('Rename «{name}»', { name: c.name })} onclick={() => (renaming = c)}><Pencil size={16} /></button>
              <button type="button" class="rh-x" aria-label={t('Delete «{name}»', { name: c.name })} onclick={() => (deleting = c)}><Trash2 size={16} /></button>
            </div>
            {#if list.length}
              <ul class="rh-list">
                {#each list as n (n.id)}
                  {@const I = ICON[sourceOf(n)]}
                  {@const role = n.mail ? mailRole(n) : null}
                  <li><I size={16} aria-hidden="true" /><span class="rh-grow"><a href={hrefOf(n)}>{title(n)}</a>{#if role}{' '}<span class="rh-tag">{t(ROLES[role])}</span>{/if}<small>{t(SRC[sourceOf(n)])} · {when(n)}</small></span>
                    <button type="button" class="rh-x" aria-label={t('Take «{name}» out of the matter', { name: title(n) })} onclick={() => setCase([n.id], null)}><Unlink size={16} /></button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
    <form class="rh-row vg-add" onsubmit={add}>
      <input class="inp" bind:value={fresh} maxlength="60" placeholder={t('New matter, e.g. Bike service spring')} aria-label={t('New matter')} data-case-new />
      <button type="submit" class="btn sm" disabled={!fresh.trim()}><Plus size={14} aria-hidden="true" />{t('Add')}</button>
    </form>
  </section>
</div>

{#if renaming}
  <RenameSheet title={t('Rename «{name}»', { name: renaming.name })} value={renaming.name} max={60} onsave={rename} onclose={() => (renaming = null)} />
{/if}
{#if deleting}
  <GroupDeleteSheet
    title={t('Delete «{name}»?', { name: deleting.name })}
    count={(byCase[deleting.id] ?? []).length}
    what={(n) => tn(n, '{n} entry', '{n} entries')}
    none={t('Without a matter')}
    noneHint={t('The entries stay in the inbox and in Notes, only without this matter.')}
    targets={cases.filter((c) => c.id !== deleting.id).map((c) => ({ id: c.id, name: c.name }))}
    onconfirm={confirmDelete}
    onclose={() => (deleting = null)}
  />
{/if}

<style>
  .vg-page {
    max-width: 760px;
  }
  .rh-help {
    margin: 0 0 var(--sp-3);
  }
  .vg-e {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin: 0 0 2px;
  }
  .vg-acts {
    margin-top: 6px;
  }
  .vg-sel {
    width: auto;
    max-width: 14em;
    min-height: 36px;
    padding: 4px 8px;
    font-size: var(--fs-small);
  }
  .vg-own {
    margin-top: var(--sp-5, 24px);
  }
  .vg-own > .rh-sub {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .vg-top {
    padding-top: var(--sp-3);
  }
  .vg-ch {
    flex-wrap: nowrap;
  }
  .vg-name {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
  }
  .vg-name small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .vg-add {
    margin-top: var(--sp-3);
  }
</style>
