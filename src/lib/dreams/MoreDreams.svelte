<script>
  /**
   * «Träume an einem Ort» (Träume und Neuland, Noah 27.10.2026 «3a»: Kompass «Träume» and Freie Zeit
   * «Reise-Wünsche» merged into Träume, the old places show a link). On Touren › Träume under your dreams:
   *   - the entries of the Kompass box «Träume»; «Make it a dream tour» moves one here (with Undo); the
   *     Kompass keeps the box and links here.
   *   - a link to Freie Zeit › Reise-Wünsche (longing, hopes, a day with room), which links back.
   * Nothing is moved by itself.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { COMPASS_KEY, compassOf, entriesOf, removeEntry } from '../compass.js';
  import { deleteWithUndo } from '../ui/ask.js';
  import { t, tn } from '../i18n.svelte.js';
  import { Compass, Plane, ChevronRight, ArrowRight } from '@lucide/svelte';

  /** onmove(text): adds the dream (a promise of its id); the entry then leaves the Kompass. */
  let { onmove, ondrop } = $props();
  const q = liveQuery(() => db.settings.get(COMPASS_KEY));
  const c = $derived(compassOf($q?.value));
  const rows = $derived(entriesOf(c, 'dreams').filter((e) => !e.done));

  async function move(e) {
    const before = $state.snapshot(c);
    await deleteWithUndo({
      run: async () => {
        const id = await onmove?.(e.text);
        await db.settings.put({ key: COMPASS_KEY, value: removeEntry(before, e.id) });
        return { id, before };
      },
      undo: async (snap) => {
        await ondrop?.(snap.id);
        await db.settings.put({ key: COMPASS_KEY, value: snap.before });
      },
      text: t('«{name}» is now a dream tour.', { name: e.text.slice(0, 40) }),
      name: e.text.slice(0, 40),
    });
  }
</script>

<section class="ich-sec" aria-labelledby="dr-more" data-more-dreams>
  <div class="ich-h"><div><h2 id="dr-more">{t('More dreams')}</h2><p class="ich-hs">{t('Your dreams in the compass and your travel wishes belong here too.')}</p></div></div>
  <div class="card ich-body md">
    {#if rows.length}
      <p class="md-h"><Compass size={16} aria-hidden="true" /> {tn(rows.length, 'In your compass: {n} dream', 'In your compass: {n} dreams')}</p>
      <ul class="md-list">
        {#each rows as e (e.id)}
          <li class="md-row" data-compass-dream={e.id}>
            <span class="md-t">{e.text}</span>
            <button type="button" class="btn sm" onclick={() => move(e)} data-md-move><ArrowRight size={14} aria-hidden="true" />{t('Make it a dream tour')}</button>
          </li>
        {/each}
      </ul>
    {/if}
    <a class="md-link" href="#/me/compass" data-md-compass><Compass size={16} aria-hidden="true" /><span>{t('Open my compass')}</span><ChevronRight size={16} aria-hidden="true" /></a>
    <a class="md-link" href="#/me/frei/reise" data-md-wishes><Plane size={16} aria-hidden="true" /><span>{t('Travel wishes: longing, hopes, a day with room')}</span><ChevronRight size={16} aria-hidden="true" /></a>
  </div>
</section>

<style>
  .md {
    display: grid;
    gap: var(--sp-2);
  }
  .md-h {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: 0;
    color: var(--ink-2);
  }
  .md-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .md-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    align-items: center;
    justify-content: space-between;
  }
  .md-t {
    flex: 1 1 12rem;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .md-row .btn {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  .md-link {
    display: flex;
    gap: 8px;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .md-link span {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
</style>
