<script>
  /**
   * Paket L «Werkzeugkasten» (#316 Zeitzonen): the time now in your own places, with the difference to
   * here. Places can be added, renamed, moved (arrows and drag) and deleted with Undo (rules 14, 18).
   * The browser knows the zones, so it works offline.
   */
  import { Plus, Pencil, Trash2 } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { DEFAULT_ZONES, allZones, validZone, timeIn, diffText, dayShift, placeOfZone } from './zones.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { t, locale } from '../i18n.svelte.js';
  import './tools.css';

  const here = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Zurich';
  let list = $state([]);
  let now = $state(new Date());
  let adding = $state(false);
  let pick = $state('');
  let renaming = $state(null);
  loadTool('zones', null).then((l) => (list = l ?? DEFAULT_ZONES));
  $effect(() => {
    const id = setInterval(() => (now = new Date()), 15_000);
    return () => clearInterval(id);
  });
  const zones = allZones();
  const save = () => saveTool('zones', list).catch(() => {});

  function add() {
    const tz = zones.find((z) => z.toLowerCase() === pick.trim().toLowerCase()) ?? pick.trim();
    if (!validZone(tz)) return;
    list = [...list, { id: `z${Date.now()}`, name: placeOfZone(tz), tz }];
    save();
    pick = '';
    adding = false;
  }
  function move(from, to) {
    const l = [...list];
    const [x] = l.splice(from, 1);
    l.splice(to, 0, x);
    list = l;
    save();
  }
  async function remove(z) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: z.name }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const at = list.indexOf(z);
    await deleteWithUndo({
      name: z.name,
      text: t('«{name}» deleted.', { name: z.name }),
      run: async () => {
        list = list.filter((x) => x.id !== z.id);
        await saveTool('zones', list);
        return { z, at };
      },
      undo: async (s) => {
        const l = [...list];
        l.splice(s.at, 0, s.z);
        list = l;
        await saveTool('zones', list);
      },
    });
  }
</script>

<section class="tool-card zones">
  <p class="tool-help">{t('Here: {time} · {zone}', { time: timeIn(here, now, locale()), zone: here })}</p>
  {#if list.length}
    <ul class="tool-list" use:sortable={{ onmove: move }}>
      {#each list as z, i (z.id)}
        {@const s = dayShift(z.tz, here, now)}
        <li data-sort-id={z.id}>
          <SortGrip name={z.name} onstep={(d) => move(i, i + d)} />
          <span class="z-m"><b>{z.name}</b><small class="tool-muted">{diffText(z.tz, here, now)}{s ? ` · ${s > 0 ? t('tomorrow') : t('yesterday')}` : ''}</small></span>
          <b class="z-time">{timeIn(z.tz, now, locale())}</b>
          <SortArrows name={z.name} {i} n={list.length} onstep={(d) => move(i, i + d)} />
          <button type="button" class="btn sm" aria-label={t('Rename {name}', { name: z.name })} onclick={() => (renaming = z)}><Pencil size={15} aria-hidden="true" /></button>
          <button type="button" class="btn sm" aria-label={t('Delete {name}', { name: z.name })} onclick={() => remove(z)}><Trash2 size={15} aria-hidden="true" /></button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="tool-muted">{t('No places yet. Add one.')}</p>
  {/if}
  {#if adding}
    <form class="tool-row" onsubmit={(e) => (e.preventDefault(), add())}>
      <label class="tool-field z-pick">
        <span>{t('Time zone, e.g. Asia/Tokyo')}</span>
        <input class="tool-input" list="tool-zone-list" bind:value={pick} autocomplete="off" />
      </label>
      <datalist id="tool-zone-list">{#each zones as z (z)}<option value={z}></option>{/each}</datalist>
      <button type="submit" class="btn hi" disabled={!validZone(zones.find((z) => z.toLowerCase() === pick.trim().toLowerCase()) ?? pick.trim()) || !pick.trim()}>{t('Add')}</button>
      <button type="button" class="btn btn-link" onclick={() => (adding = false)}>{t('Cancel')}</button>
    </form>
  {:else}
    <div><button type="button" class="btn" onclick={() => (adding = true)}><Plus size={16} aria-hidden="true" />{t('Add place')}</button></div>
  {/if}
</section>

{#if renaming}
  <RenameSheet
    kicker={t('Time zones')}
    title={t('Rename place|zone')}
    value={renaming.name}
    max={40}
    hint={t('The time zone stays the same.')}
    onsave={(name) => {
      const n = name.trim();
      if (!n) return t('Please type a name.');
      list = list.map((x) => (x.id === renaming.id ? { ...x, name: n } : x));
      save();
    }}
    onclose={() => (renaming = null)}
  />
{/if}

<style>
  .z-m {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
  }
  .z-m b {
    overflow-wrap: break-word;
  }
  .z-time {
    font-size: var(--fs-section);
    font-variant-numeric: tabular-nums;
  }
  .z-pick {
    flex: 1 1 220px;
  }
</style>
