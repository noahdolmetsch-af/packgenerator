<script>
  /**
   * One own list in Kalender › Merken (#/calendar/list/<id>; Noah 14.10.2026 «1a und b 2 b 3a»): its points,
   * a field for a new one, and «Einstellungen» (name, boxes or notes, where it is pinned, delete).
   */
  import { liveQuery } from 'dexie';
  import { ChevronLeft, Settings2, Pin } from '@lucide/svelte';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import { LISTS_KEY, PIN_PLACES, openCount } from '../lib/lists.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import PageHead from '../lib/ui/PageHead.svelte';
  import ListView from '../lib/merken/ListView.svelte';
  import ListSheet from '../lib/merken/ListSheet.svelte';

  let { id } = $props();
  const q = liveQuery(async () => {
    const [l, trips] = await Promise.all([db.settings.get(LISTS_KEY), db.trips.toArray()]);
    return { lists: l?.value ?? [], trips };
  });
  const list = $derived(($q?.lists ?? []).find((l) => l.id === id) ?? null);
  const pinText = $derived.by(() => {
    const p = list?.pin;
    if (!p) return '';
    if (p.place === 'trips') return t('Also when packing: {trip}', { trip: $q?.trips.find((x) => x.id === p.tripId)?.title || t('Trip') });
    return t('Also at: {place}', { place: t(PIN_PLACES.find((x) => x.key === p.place)?.label ?? '') });
  });
  let edit = $state(false);
  function done(r) {
    if (!r?.undo) return;
    if (r.removed) {
      location.hash = '#/calendar';
      offerDone(t('List deleted.'), r.undo);
    } else offerDone(t('Saved.'), r.undo);
  }
</script>

<div class="lp">
  <p class="back"><a href="#/calendar"><ChevronLeft size={16} aria-hidden="true" />{t('Remember')}</a></p>
  {#if $q && !list}
    <PageHead title={t('List not found')} text={t('It may have been deleted.')} />
  {:else if list}
    <PageHead title={list.name} text={list.check ? t('{n} open', { n: openCount(list) }) : t('{n} notes', { n: list.items.length })}>
      <p class="meta">
        {#if pinText}<span><Pin size={14} aria-hidden="true" />{pinText}</span>{/if}
        <button type="button" class="set" onclick={() => (edit = true)}><Settings2 size={16} aria-hidden="true" />{t('Settings')}</button>
      </p>
    </PageHead>
    <div class="card body"><ListView {list} /></div>
  {/if}
</div>
{#if edit && list}<ListSheet {list} onclose={() => (edit = false)} ondone={done} />{/if}

<style>
  .lp {
    max-width: 720px;
  }
  .back a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    color: var(--ink-2);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .set {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .body {
    padding: 8px 16px 14px;
  }
</style>
