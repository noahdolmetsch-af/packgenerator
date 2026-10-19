<script>
  /**
   * Paket R (Noah 19.10.2026 «4a»): Ich › Velomech und Guide (#/me/pros). Your own list of bike
   * mechanics and guides; «Request» prepares a mail (or opens their link, or calls). No money goes
   * through the app, nobody else sees the list. Add, change, delete (asks first, Undo), reorder with
   * arrows and drag. Model: src/lib/pros.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import { sortable } from '../lib/ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { PROS_KEY, PRO_KINDS, kindOf, newPro, savePro, removePro, movePro, requestMail, isMail } from '../lib/pros.js';
  import { Wrench, Compass, User, Plus, Mail, Link2, Phone, Pencil, Trash2 } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const ICON = { mech: Wrench, guide: Compass, other: User };
  const prosQ = liveQuery(async () => (await db.settings.get(PROS_KEY))?.value ?? []);
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const pros = $derived($prosQ ?? []);

  const keep = (list) => db.settings.put({ key: PROS_KEY, value: JSON.parse(JSON.stringify(list)) });

  /* the form: a new entry (id '') or one being changed */
  let editing = $state(null); // null | { id, name, kind, mail, link, phone, note }
  let error = $state('');
  const blank = () => ({ id: '', name: '', kind: 'mech', mail: '', link: '', phone: '', note: '' });
  function edit(p) {
    error = '';
    editing = p ? { ...p } : blank();
    asking = null;
  }
  async function save() {
    if (editing.mail.trim() && !isMail(editing.mail)) return (error = t('This mail address is not complete.'));
    const p = newPro(editing, editing.id || undefined);
    if (!p) return (error = t('Give it a name.'));
    await keep(savePro(pros, p));
    editing = null;
  }
  async function del(p) {
    const ok = await askDelete({ title: t('Delete "{name}"?', { name: p.name }), text: t('Only this entry goes. Requests you already sent stay in your mail.') });
    if (ok !== 'delete') return;
    const before = pros;
    await deleteWithUndo({ run: async () => (await keep(removePro(before, p.id)), before), undo: (saved) => keep(saved), text: t('"{name}" deleted.', { name: p.name }), name: p.name });
  }
  const move = (from, to) => keep(movePro(pros, from, to));

  /* the request */
  let asking = $state(null); // the id whose request is open
  let bike = $state('');
  let when = $state('');
  let text = $state('');
  function ask(p) {
    editing = null;
    asking = asking === p.id ? null : p.id;
    bike = $bikesQ?.[0]?.name ?? '';
    when = '';
    text = '';
  }
</script>

<div class="propage ich-page" data-pros>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Bike mechanic and guide')} sub={t('Your contacts: ask for a date by mail or their link')} />

  <div class="ich-main">
    <section class="ich-sec" aria-labelledby="pro-h">
      <div class="ich-h"><div><h2 id="pro-h">{t('Your contacts')}</h2><p class="ich-hs">{t('Only on your devices. No money goes through the app.')}</p></div></div>
      {#if !pros.length && !editing}
        <div class="card ich-body"><p class="empty">{t('No one here yet. Add your bike shop or a guide: then a request is two taps.')}</p></div>
      {/if}
      {#if pros.length}
        <ul class="card ich-list" use:sortable={{ onmove: move }}>
          {#each pros as p, i (p.id)}
            {@const Icon = ICON[p.kind] ?? User}
            <li data-sort-id={p.id} data-pro={p.id}>
              <div class="ich-row prow">
                <SortGrip name={p.name} onstep={(dir) => move(i, i + dir)} />
                <span class="ich-ib"><Icon size={18} aria-hidden="true" /></span>
                <span class="ich-m"><b>{p.name}</b><small>{t(kindOf(p.kind).label)}{p.note ? ` · ${p.note}` : ''}</small></span>
                <SortArrows name={p.name} {i} n={pros.length} onstep={(dir) => move(i, i + dir)} />
              </div>
              <div class="ich-acts pacts">
                <button type="button" class="btn sm hi" onclick={() => ask(p)} aria-expanded={asking === p.id}>{t('Request')}</button>
                <button type="button" class="btn sm" onclick={() => edit(p)} aria-label={t('Change {name}', { name: p.name })}><Pencil size={16} aria-hidden="true" />{t('Change')}</button>
                <button type="button" class="btn sm" onclick={() => del(p)} aria-label={t('Delete {name}', { name: p.name })}><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>
              </div>
              {#if asking === p.id}
                <div class="askbox" data-pro-ask>
                  {#if p.kind === 'mech' && $bikesQ?.length}
                    <label class="lab" for="pa-bike">{t('Which bike')}</label>
                    <select id="pa-bike" class="inp proinp" bind:value={bike}>{#each $bikesQ as b (b.id)}<option value={b.name}>{b.name}</option>{/each}</select>
                  {/if}
                  <label class="lab" for="pa-when">{t('Days that suit you')}</label>
                  <input id="pa-when" class="inp proinp" bind:value={when} placeholder={t('e.g. Tue or Thu morning')} />
                  <label class="lab" for="pa-text">{t('Anything else')} <span class="opt">· {t('optional|field')}</span></label>
                  <textarea id="pa-text" class="inp proinp" rows="3" bind:value={text}></textarea>
                  <div class="ich-acts">
                    {#if p.mail}<a class="btn hi" href={requestMail(p, { bike: p.kind === 'mech' ? bike : '', when, text }, t)}><Mail size={16} aria-hidden="true" />{t('Write the mail')}</a>{/if}
                    {#if p.link}<a class="btn" href={p.link} target="_blank" rel="noopener"><Link2 size={16} aria-hidden="true" />{t('Open their booking page')}</a>{/if}
                    {#if p.phone}<a class="btn" href="tel:{p.phone.replace(/\s/g, '')}"><Phone size={16} aria-hidden="true" />{t('Call')}</a>{/if}
                  </div>
                  {#if !p.mail && !p.link && !p.phone}<p class="small">{t('Add a mail address, a link or a phone number with «Change».')}</p>{/if}
                  <p class="small">{t('The app only prepares the mail; you send it yourself.')}</p>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}

      {#if editing}
        <form class="card ich-body pform" data-pro-form onsubmit={(e) => (e.preventDefault(), save())}>
          <label class="lab" for="pf-name">{t('Name')}</label>
          <input id="pf-name" class="inp proinp" bind:value={editing.name} placeholder={t('e.g. Velo shop at the station')} />
          <fieldset class="kinds">
            <legend class="lab">{t('What they do')}</legend>
            {#each PRO_KINDS as k (k.key)}
              <label><input type="radio" name="pf-kind" value={k.key} bind:group={editing.kind} /> {t(k.label)}</label>
            {/each}
          </fieldset>
          <label class="lab" for="pf-mail">{t('Mail')} <span class="opt">· {t('optional|field')}</span></label>
          <input id="pf-mail" class="inp proinp" type="email" bind:value={editing.mail} />
          <label class="lab" for="pf-link">{t('Booking page')} <span class="opt">· {t('optional|field')}</span></label>
          <input id="pf-link" class="inp proinp" bind:value={editing.link} placeholder="https://…" />
          <label class="lab" for="pf-phone">{t('Phone')} <span class="opt">· {t('optional|field')}</span></label>
          <input id="pf-phone" class="inp proinp" type="tel" bind:value={editing.phone} />
          <label class="lab" for="pf-note">{t('Note')} <span class="opt">· {t('optional|field')}</span></label>
          <input id="pf-note" class="inp proinp" bind:value={editing.note} placeholder={t('e.g. closed on Mondays')} />
          {#if error}<p class="err" role="alert">{error}</p>{/if}
          <div class="ich-acts">
            <button type="button" class="btn" onclick={() => (editing = null)}>{t('Cancel')}</button>
            <button type="submit" class="btn hi">{t('Save')}</button>
          </div>
        </form>
      {:else}
        <div class="ich-acts go"><button type="button" class="btn" onclick={() => edit(null)}><Plus size={16} aria-hidden="true" />{t('Add contact')}</button></div>
      {/if}
    </section>
  </div>
</div>

<style>
  .propage li {
    border-bottom: 1px solid var(--line);
  }
  .propage li:last-child {
    border-bottom: 0;
  }
  .prow {
    gap: 8px;
  }
  .pacts {
    padding: 0 12px 10px;
  }
  .askbox,
  .pform {
    padding: 12px;
  }
  .askbox {
    margin: 0 12px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper-2);
  }
  .lab {
    display: block;
    margin: 8px 0 4px;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .opt {
    font-weight: 400;
    color: var(--ink-2);
  }
  .proinp {
    max-width: 480px;
  }
  .kinds {
    margin: 0;
    padding: 0;
    border: 0;
  }
  .kinds label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-right: 14px;
  }
  .empty,
  .small {
    margin: 8px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .err {
    color: var(--bad);
  }
</style>
