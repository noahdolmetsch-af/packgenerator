<script>
  /**
   * Pflanzenpass am echten Standort (#/calendar/pflanzen; 996 Ideen UC-257-I1, Noah 25.10.2026 «bauen 10»):
   * each plant of Kalender › Merken with its spot now, photos and own observations (sun, wind, soil), and
   * every move to another place in its history. A small hint from the observations is only a suggestion;
   * it never changes the watering by itself. #/calendar/pflanzen?plant=<id> shows that plant first.
   * Data: plant.pass inside the Merken record (plantpass.js), no Dexie change.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import Crumbs from '../lib/ui/Crumbs.svelte';
  import PageHead from '../lib/ui/PageHead.svelte';
  import PassSheet from '../lib/merken/PassSheet.svelte';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { MERKEN_KEY, updateTodo, restoreTodos } from '../lib/merkendb.js';
  import { SUN, WIND, WET, passOf, withEntry, withoutEntry, moveTo, spots, spotNow, passHint } from '../lib/merken/plantpass.js';
  import { Sprout, Eye, MoveRight, Pencil, Trash2, MapPin, Lightbulb } from '@lucide/svelte';
  import '../lib/ruhig/ruhig.css';

  const q = liveQuery(async () => (await db.settings.get(MERKEN_KEY))?.value ?? []);
  const first = typeof location !== 'undefined' ? decodeURIComponent((location.hash.match(/[?&]plant=([^&]+)/) ?? [])[1] ?? '') : '';
  const plants = $derived(($q ?? []).filter((x) => x.kind === 'plant' && !x.doneAt).sort((a, b) => (a.id === first ? -1 : b.id === first ? 1 : String(a.text).localeCompare(String(b.text)))));
  const label = (list, k) => t(list.find((x) => x.key === k)?.label ?? '');
  const dmy = (d) => `${+d.slice(8, 10)}.${+d.slice(5, 7)}.${d.slice(0, 4)}`;
  let sheet = $state(null); // { td, entry?, kind }

  async function save(td, e) {
    const now = $state.snapshot(($q ?? []).find((x) => x.id === td.id) ?? td);
    const isNew = !passOf(now).some((x) => x.id === e.id);
    const next = isNew && e.kind === 'move' ? moveTo(now, e) : withEntry(now, e);
    await updateTodo(db, td.id, { plant: next.plant });
  }
  async function remove(td, e) {
    const what = e.kind === 'move' ? t('Move to «{place}»', { place: e.place }) : t('Observation of {day}', { day: dmy(e.day) });
    if ((await askDelete({ title: t('Delete «{name}»?', { name: what }), text: t('Only this entry goes; the plant stays.') })) !== 'delete') return;
    const before = $state.snapshot($q ?? []);
    await deleteWithUndo({
      run: async () => (await updateTodo(db, td.id, { plant: withoutEntry(td, e.id).plant }), before),
      undo: (list) => restoreTodos(db, list),
      text: t('«{name}» deleted.', { name: what }),
      name: what,
    });
  }
  const obsLine = (e) => [e.sun && label(SUN, e.sun), e.wind && label(WIND, e.wind), e.wet && label(WET, e.wet)].filter(Boolean).join(' · ');
</script>

<div class="pp-page" data-plant-pass>
  <Crumbs crumbs={[{ label: t('Remember|tab'), href: '#/calendar' }]} here={t('Plant passport')} />
  <PageHead title={t('Plant passport')} text={t('Your own observations of the real spot of each plant: sun, wind, soil and photos. A move stays in the history.')} />

  {#if $q && !plants.length}
    <p class="rh-empty">{t('No plant yet. Add one in Calendar › Remember › Plant.')} <a href="#/calendar">{t('Remember|tab')}</a></p>
  {/if}

  <ul class="rh-cards">
    {#each plants as td (td.id)}
      {@const pass = passOf(td)}
      {@const now = spotNow(td)}
      {@const hint = passHint(td)}
      {@const photo = pass.find((e) => e.photo)?.photo}
      {@const sp = spots(td)}
      <li class="rh-card pp-card" data-plant={td.id}>
        <div class="rh-body pp-top">
          <div class="pp-head">
            {#if photo}<img class="pp-ph" src={photo} alt="" />{:else}<span class="rh-ic pp-ic"><Sprout size={20} aria-hidden="true" /></span>{/if}
            <div class="pp-t">
              <h2 class="rh-sub">{td.text}</h2>
              <p class="rh-help"><MapPin size={14} aria-hidden="true" /> {td.plant.place || t('No place yet')}{#if now.n}{' '}·{' '}{[now.sun && label(SUN, now.sun), now.wind && label(WIND, now.wind), now.wet && label(WET, now.wet)].filter(Boolean).join(' · ')}{/if}</p>
            </div>
          </div>
          {#if hint}<p class="rh-note"><Lightbulb size={14} aria-hidden="true" /> {t(hint)}</p>{/if}
          <div class="rh-row">
            <button type="button" class="btn sm hi" onclick={() => (sheet = { td, kind: 'obs' })} data-pass-obs><Eye size={16} aria-hidden="true" />{t('Observation')}</button>
            <button type="button" class="btn sm" onclick={() => (sheet = { td, kind: 'move' })} data-pass-move><MoveRight size={16} aria-hidden="true" />{t('Moved')}</button>
          </div>
          {#if sp.length > 1}
            <p class="rh-help">{t('Places so far')}: {sp.map((x) => `${x.place} (${dmy(x.from)})`).join(' → ')}</p>
          {/if}
          {#if pass.length}
            <ul class="rh-list">
              {#each pass as e (e.id)}
                <li data-pass-entry={e.kind}>
                  {#if e.photo}<img class="pp-th" src={e.photo} alt="" />{/if}
                  <span class="rh-grow">
                    {#if e.kind === 'move'}<b>{t('Moved to «{place}»', { place: e.place })}</b>{:else}<b>{obsLine(e) || t('Observation')}</b>{/if}
                    <small>{dmy(e.day)}{e.note ? ` · ${e.note}` : ''}</small>
                  </span>
                  <button type="button" class="rh-x" aria-label={t('Change')} onclick={() => (sheet = { td, entry: e })}><Pencil size={16} /></button>
                  <button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => remove(td, e)}><Trash2 size={16} /></button>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="rh-empty">{t('No observation yet. Start with one: how much sun, wind and how fast the soil dries.')}</p>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
</div>

{#if sheet}
  <PassSheet name={sheet.td.text} entry={sheet.entry ?? null} kind={sheet.kind ?? 'obs'} place={sheet.td.plant.place ?? ''} onsave={(e) => save(sheet.td, e)} onclose={() => (sheet = null)} />
{/if}

<style>
  .pp-page {
    max-width: 760px;
  }
  .pp-top {
    display: grid;
    gap: var(--sp-3);
    padding-top: var(--sp-4);
  }
  .pp-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .pp-ph {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
  }
  .pp-ic {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .pp-t {
    min-width: 0;
  }
  .pp-t .rh-sub {
    margin: 0;
  }
  .pp-t .rh-help {
    margin: 2px 0 0;
  }
  .pp-th {
    width: 40px;
    height: 40px;
    border-radius: var(--r-ctl);
    object-fit: cover;
  }
</style>
