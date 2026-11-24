<script>
  /**
   * «Zuletzt gelöscht» (Noah 23.11.2026 «1a»): #/me/trash, Ich › Daten. Everything you deleted in the last 30 days, with a «Zurück» for
   * each line that says what comes back with it («Kommt mit zurück: 14 Fahrten, 3 Pflegeeinträge»). The trash of the notes
   * (notes/trash.js) stands in the list as well and works as it did. Filter by kind. After 30 days nothing goes by itself: the page asks
   * once «Jetzt endgültig leeren?». Delete for good asks first and offers Undo.
   */
  import { liveQuery } from 'dexie';
  import { Trash2, Undo2, ChevronRight } from '@lucide/svelte';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { db } from '../lib/db.js';
  import { restoreEntry, purge } from '../lib/trash/trash.js';
  import { KINDS, alongOf, alongLine, daysLeft, isOld } from '../lib/trash/kinds.js';
  import { TRASH as NOTE_TRASH, restoreNote } from '../lib/notes/trash.js';
  import { askDelete } from '../lib/ui/ask.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import '../lib/ich/ich.css';

  const trashQ = liveQuery(() => db.trash.toArray());
  const notesQ = liveQuery(() => db.docs.where('kind').equals(NOTE_TRASH).toArray());
  // one list: the trash of everything and the trash of the notes
  const rows = $derived(
    [
      ...($trashQ ?? []).map((e) => ({ id: e.id, src: 'trash', at: e.at, kind: e.kind, name: e.name, e })),
      ...($notesQ ?? []).map((r) => ({ id: `note:${r.id}`, src: 'note', at: r.trashedAt, kind: 'note', name: r.name || t('Note'), r })),
    ].sort((a, b) => String(b.at).localeCompare(String(a.at))),
  );
  const ready = $derived($trashQ !== undefined && $notesQ !== undefined);

  let kind = $state('all');
  const kinds = $derived(KINDS.filter((k) => rows.some((r) => r.kind === k.key)));
  $effect(() => {
    if (kind !== 'all' && !kinds.some((k) => k.key === kind)) kind = 'all';
  });
  const shown = $derived(kind === 'all' ? rows : rows.filter((r) => r.kind === kind));
  const countOf = (k) => rows.filter((r) => r.kind === k).length;

  const when = (iso) => new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  const alongOf1 = (r) => (r.src === 'trash' ? alongLine(alongOf(r.e.counts, r.e.main), tn) : '');
  const HOME = { bike: '#/bikes', trip: '#/trips', gear: '#/gear', doc: '#/me/docs', note: '#/notes', ride: '#/trips/rides', todo: '#/day/todos', plan: '#/day', week: '#/week' };

  let info = $state(null); // { text, href } after a «Zurück»: the way on (the next step)
  async function back(r) {
    try {
      if (r.src === 'note') {
        await restoreNote(db, r.r.id);
        info = { text: t('"{name}" is back in Notes.', { name: r.name }), href: HOME.note };
        return;
      }
      const res = await restoreEntry(db, r.id);
      if (!res) return;
      const extra = res.skipped ? ` ${tn(res.skipped, '{n} entry was already there again and stays as it is.', '{n} entries were already there again and stay as they are.')}` : '';
      info = { text: `${t('"{name}" is back.', { name: r.name })}${extra}`, href: HOME[r.kind] ?? '' };
    } catch (err) {
      console.error(err);
      info = { text: t('Bringing it back didn\'t work. Your last backup still has "{name}".', { name: r.name }), href: '' };
    }
  }

  // «Delete for good» only for the entries of this trash (a deleted note is dropped in Notes › Trash)
  async function drop(list, why) {
    const one = list.length === 1;
    const title = one ? t('Delete "{text}" for good?', { text: list[0].name.slice(0, 40) }) : tn(list.length, 'Delete {n} entry for good?', 'Delete {n} entries for good?');
    if ((await askDelete({ title, text: why ?? t('It is then gone from this list. Only a backup file still has it. You can bring it back for 8 seconds afterwards.'), lines: one ? [] : list.map((r) => r.name) })) !== 'delete') return;
    const gone = list.map((r) => r.e);
    await purge(db, gone.map((e) => e.id));
    offerDone(one ? t('"{name}" deleted for good.', { name: list[0].name }) : tn(list.length, '{n} entry deleted for good.', '{n} entries deleted for good.'), () => db.trash.bulkPut(gone));
  }

  // after 30 days the app asks once: «Empty now?» (nothing goes by itself); «Keep» is remembered per entry on this device
  const ASKED = 'pg.trash.asked';
  const readAsked = () => {
    try {
      return JSON.parse(localStorage.getItem(ASKED) ?? '[]');
    } catch {
      return [];
    }
  };
  let asked = $state(readAsked());
  const old = $derived(rows.filter((r) => r.src === 'trash' && isOld(r.at) && !asked.includes(r.id)));
  function keepOld() {
    asked = [...new Set([...asked, ...old.map((r) => r.id)])];
    try {
      localStorage.setItem(ASKED, JSON.stringify(asked));
    } catch {
      /* private mode: asked again next time */
    }
  }
</script>

<div class="tr" data-trash>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Data'), href: '#/me/data' }]} here={t('Recently deleted')} title={t('Recently deleted')} sub={t('What you delete stays here for 30 days. «Back» brings it back with everything that belonged to it.')} />

  {#if info}
    <p class="tr-info" role="status" data-trash-info>{info.text}{#if info.href}{' '}<a href={info.href}>{t('Have a look')} <ChevronRight size={14} aria-hidden="true" /></a>{/if}</p>
  {/if}

  {#if old.length}
    <section class="card ich-body tr-old" data-trash-old>
      <p><b>{tn(old.length, '{n} entry is older than 30 days.', '{n} entries are older than 30 days.')}</b> {t('Empty it for good now?')}</p>
      <div class="ich-acts">
        <button type="button" class="btn" onclick={() => drop(old, t('It is then gone from this list. Only a backup file still has it. You can bring it back for 8 seconds afterwards.'))} data-trash-empty>{t('Empty now')}</button>
        <button type="button" class="btn" onclick={keepOld} data-trash-keep>{t('Keep|trash')}</button>
      </div>
    </section>
  {/if}

  {#if ready && !rows.length}
    <Empty icon={Trash2} title={t('Nothing deleted in the last 30 days')} text={t('When you delete a bike, a tour, gear or a document, it waits here for 30 days. Right after deleting you can still tap «Undo» for a few seconds.')} action={{ label: t('Back to Data and backup'), href: '#/me/data' }} />
  {:else if ready}
    <section class="ich-sec" aria-labelledby="tr-h">
      <div class="ich-h"><div><h2 id="tr-h">{tn(shown.length, '{n} entry|trash', '{n} entries|trash')}</h2></div></div>
      {#if kinds.length > 1}
        <div class="tr-chips" role="group" aria-label={t('Kind')}>
          <button type="button" class="fchip" aria-pressed={kind === 'all'} data-trash-kind="all" onclick={() => (kind = 'all')}>{t('All|logbuch')} {rows.length}</button>
          {#each kinds as k (k.key)}
            <button type="button" class="fchip" aria-pressed={kind === k.key} data-trash-kind={k.key} onclick={() => (kind = k.key)}>{t(k.label)} {countOf(k.key)}</button>
          {/each}
        </div>
      {/if}
      <ul class="card ich-list">
        {#each shown as r (r.id)}
          {@const along = alongOf1(r)}
          <li class="tr-row" data-trash-row>
            <span class="tr-m">
              <b>{r.name}</b>
              <small>{t('Deleted {day}', { day: when(r.at) })} · {isOld(r.at) ? t('older than 30 days') : tn(daysLeft(r.at), '{n} day left', '{n} days left')}</small>
              <small data-trash-with>{along ? t('Comes back with: {list}', { list: along }) : t('Comes back as it was.|trash')}</small>
            </span>
            <button type="button" class="btn sm" onclick={() => back(r)} data-trash-back><Undo2 size={16} aria-hidden="true" />{t('Back')}</button>
            {#if r.src === 'trash'}<button type="button" class="tr-rm" aria-label={t('Delete {name} for good', { name: r.name })} onclick={() => drop([r])} data-trash-drop><Trash2 size={16} aria-hidden="true" /></button>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .tr-info {
    margin: 0 0 var(--sp-3, 12px);
    padding: 10px 14px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink);
  }
  .tr-info a {
    display: inline-flex;
    align-items: center;
    margin-left: 6px;
    font-weight: 600;
  }
  .tr-old {
    margin-bottom: var(--sp-3, 12px);
  }
  .tr-old p {
    margin: 0 0 10px;
  }
  .tr-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 var(--sp-3, 12px);
  }
  .tr-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
  }
  .tr-m {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
    overflow-wrap: break-word;
  }
  .tr-m small {
    color: var(--ink-2);
  }
  .tr-rm {
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .tr-rm:hover {
    color: var(--ink);
    background: var(--paper-2);
  }
</style>
