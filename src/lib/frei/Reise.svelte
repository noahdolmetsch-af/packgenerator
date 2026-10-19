<script>
  /**
   * Paket T «Freie Zeit» › Reise-Wünsche (ideas 22, 23, 24). Three parts:
   *   Longing: what you long for (space, people, movement, quiet, learning, own ones) with photos and a
   *     thought; a destination can be added to a thought. The strongest longing shows on top.
   *   Hopes: before a trip «I hope for …», afterwards «What I experienced» right beside it.
   *   A day with room: fixed anchor, time to discover, arriving: a day strip to plan the free part.
   * Photos stay on the device and in the backup. Everything changeable and deletable.
   */
  import { Plus, Pencil, X, Plane, Sparkles, CalendarRange } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import Crumb from '../flow/kit/Crumb.svelte';
  import FreiSheet from './FreiSheet.svelte';
  import PhotoPick from '../ui/PhotoPick.svelte';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { db } from '../db.js';
  import { cfgQuery, changeCfg, restoreCfg, rowsQuery, putRow, deleteRow, restoreRow } from '../freidb.js';
  import { longingsOf, longingCounts, uid } from '../frei.js';
  import { shrinkImage } from '../photo.js';
  import { isArchived, isTestTrip } from '../testname.js';
  import { tripEnd } from '../tripstate.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';

  const today = localDay();
  const q = cfgQuery();
  const cfg = $derived($q ?? {});
  const longings = $derived(longingsOf(cfg));
  const lName = (l) => (l.own ? l.name : t(l.name));
  const thoughtsQ = rowsQuery('longing');
  const thoughts = $derived($thoughtsQ ?? []);
  const counts = $derived(longingCounts(thoughts, longings).filter((l) => l.n));
  let filter = $state('');
  const shownThoughts = $derived(thoughts.filter((x) => !filter || (x.data?.moods ?? []).includes(filter)));
  const hopesQ = rowsQuery('hope');
  const hopes = $derived($hopesQ ?? []);
  const plansQ = rowsQuery('dayplan');
  const plans = $derived($plansQ ?? []);
  const tripsQ = liveQuery(() => db.trips.toArray());
  const trips = $derived(($tripsQ ?? []).filter((x) => !isArchived(x) && !isTestTrip(x)).sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))));
  const tripName = (id) => trips.find((x) => x.id === id)?.name ?? '';
  const over = (h) => {
    const trip = trips.find((x) => x.id === h.tripId);
    const end = trip ? tripEnd(trip) : null;
    return !!end && end < today;
  };

  /* ---------- longings (own ones: add, delete; built-in ones hide) ---------- */
  let newLonging = $state('');
  async function addLonging(e) {
    e.preventDefault();
    const n = newLonging.trim();
    if (!n) return;
    await changeCfg((c) => ({ ...c, longOwn: [...(c.longOwn ?? []), { key: uid('long'), name: n }] }));
    newLonging = '';
  }
  async function removeLonging(l) {
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: lName(l) }), text: t('Your thoughts stay; they just lose this mark.') });
    if (answer !== 'delete') return;
    let before;
    await deleteWithUndo({
      run: async () => (before = await changeCfg((c) => (l.own ? { ...c, longOwn: (c.longOwn ?? []).filter((x) => x.key !== l.key) } : { ...c, longHidden: [...(c.longHidden ?? []), l.key] }))),
      undo: () => restoreCfg(before),
      text: t('"{name}" deleted.', { name: lName(l) }),
      name: lName(l),
    });
    if (filter === l.key) filter = '';
  }
  let manageLong = $state(false);

  /* ---------- thoughts, hopes, day plans: one window ---------- */
  let edit = $state(null); // { kind, row?, … }
  let photoBusy = $state(false);
  const openThought = (row = null) => (edit = { kind: 'longing', row, text: row?.text ?? '', dest: row?.data?.dest ?? '', moods: [...(row?.data?.moods ?? (filter ? [filter] : []))], photos: [...(row?.photos ?? [])] });
  const openHope = (row = null) => (edit = { kind: 'hope', row, tripId: row?.tripId ?? '', title: row?.title ?? '', hope: row?.hope ?? '', lived: row?.lived ?? '' });
  const openPlan = (row = null) => (edit = { kind: 'dayplan', row, title: row?.title ?? '', fix: row?.fix ?? '', explore: row?.explore ?? '', arrive: row?.arrive ?? '' });
  async function addPhoto(file) {
    photoBusy = true;
    try {
      edit.photos = [...edit.photos, { src: await shrinkImage(file), day: today }];
    } catch (err) {
      offerDone(err.message);
    } finally {
      photoBusy = false;
    }
  }
  async function save() {
    const base = edit.row ?? { kind: edit.kind, day: today };
    let rec;
    if (edit.kind === 'longing') {
      if (!edit.text.trim() && !edit.photos.length) return t('Please write a thought or add a photo.');
      rec = { ...base, text: edit.text.trim(), photos: edit.photos, data: { moods: edit.moods, dest: edit.dest.trim() } };
    } else if (edit.kind === 'hope') {
      const title = edit.title.trim() || tripName(edit.tripId);
      if (!title) return t('Please choose a trip or give it a name.');
      if (!edit.hope.trim()) return t('Please write what you hope for.');
      rec = { ...base, tripId: edit.tripId || null, title, hope: edit.hope.trim(), lived: edit.lived.trim() };
    } else {
      if (!edit.title.trim()) return t('Please give it a name.');
      rec = { ...base, title: edit.title.trim(), fix: edit.fix.trim(), explore: edit.explore.trim(), arrive: edit.arrive.trim() };
    }
    try {
      await putRow(rec);
    } catch (err) {
      return saveFailed(err);
    }
  }
  async function remove() {
    const r = edit.row;
    const label = r.title || r.text?.slice(0, 40) || t('Entry');
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: label }) });
    if (answer !== 'delete') return false;
    await deleteWithUndo({ run: () => deleteRow(r.id), undo: (rec) => restoreRow(rec), text: t('"{name}" deleted.', { name: label }), name: label });
  }
  const toggleMood = (k) => (edit.moods = edit.moods.includes(k) ? edit.moods.filter((x) => x !== k) : [...edit.moods, k]);
</script>

<div class="fz" data-page="reise">
  <Crumb path={[{ href: '#/me', label: t('Me|place') }, { href: '#/me/frei', label: t('Free time') }]} here={t('Travel wishes')} />
  <h1 class="fz-h1" tabindex="-1" data-page-title>{t('Travel wishes')}</h1>
  <p class="fz-intro">{t('First the longing, then the destination. And after the trip: did you find what you hoped for?')}</p>

  <section class="fz-form" aria-labelledby="fzr-long-h" data-longing>
    <h2 id="fzr-long-h" class="fz-h2"><Sparkles size={18} aria-hidden="true" /> {t('What I long for')}</h2>
    {#if counts.length}<p class="fz-note" data-strongest>{t('Strongest right now: {name}', { name: lName(counts[0]) })} · {tn(counts[0].n, '{n} thought', '{n} thoughts')}</p>{/if}
    <div class="fz-chips" role="group" aria-label={t('What I long for')}>
      <button type="button" class="fz-chip" aria-pressed={!filter} onclick={() => (filter = '')}>{t('All')}</button>
      {#each longings as l (l.key)}<button type="button" class="fz-chip" aria-pressed={filter === l.key} onclick={() => (filter = filter === l.key ? '' : l.key)} data-longing-chip={l.key}>{lName(l)}</button>{/each}
      <button type="button" class="fz-chip" aria-expanded={manageLong} onclick={() => (manageLong = !manageLong)}><Pencil size={14} aria-hidden="true" /> {t('Change')}</button>
    </div>
    {#if manageLong}
      <div class="fz-box">
        <ul class="fz-list">
          {#each longings as l (l.key)}<li class="fz-row"><span class="fz-row-main"><b>{lName(l)}</b></span><button type="button" class="fz-icon" aria-label={t('Delete {name}', { name: lName(l) })} onclick={() => removeLonging(l)}><X size={18} aria-hidden="true" /></button></li>{/each}
        </ul>
        <form class="fz-inline" onsubmit={addLonging}>
          <input class="inp" maxlength="40" bind:value={newLonging} aria-label={t('Your own longing')} placeholder={t('Your own longing, e.g. the sea')} />
          <button type="submit" class="btn sm">{t('Add')}</button>
        </form>
      </div>
    {/if}
    {#if !shownThoughts.length}<p class="fz-empty">{t('No thought yet. A photo, a sentence, a place you dream of: all of it counts.')}</p>{/if}
    <div class="fz-grid three">
      {#each shownThoughts as x (x.id)}
        <button type="button" class="fz-box fzr-card" onclick={() => openThought(x)} data-thought={x.id}>
          {#if x.photos?.length}<img src={x.photos[x.photos.length - 1].src} alt="" />{/if}
          {#if x.text}<span class="fz-text">{x.text}</span>{/if}
          <span class="fz-note">{[...(x.data?.moods ?? []).map((k) => longings.find((l) => l.key === k)).filter(Boolean).map(lName), x.data?.dest].filter(Boolean).join(' · ')}</span>
        </button>
      {/each}
    </div>
    <div class="fz-acts"><button type="button" class="btn" onclick={() => openThought()} data-new-thought><Plus size={16} aria-hidden="true" />{t('A thought or a picture')}</button></div>
  </section>

  <section class="fz-form" aria-labelledby="fzr-hope-h" data-hopes>
    <h2 id="fzr-hope-h" class="fz-h2"><Plane size={18} aria-hidden="true" /> {t('What I want to bring home')}</h2>
    <p class="fz-note">{t('Before the trip one wish that really matters. After it, what you really experienced, right beside it.')}</p>
    {#if !hopes.length}<p class="fz-empty">{t('No wish yet. Which trip is coming up?')}</p>{/if}
    {#each hopes as h (h.id)}
      <article class="fz-box" data-hope={h.id}>
        <div class="fz-row">
          <span class="fz-row-main"><b>{h.title}</b></span>
          <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: h.title })} onclick={() => openHope(h)}><Pencil size={18} aria-hidden="true" /></button>
        </div>
        <div class="fz-grid">
          <div><span class="fz-kick">{t('I hope for')}</span><p class="fz-text">{h.hope}</p></div>
          <div>
            <span class="fz-kick">{t('What I experienced')}</span>
            {#if h.lived}<p class="fz-text">{h.lived}</p>
            {:else}<button type="button" class="btn sm" onclick={() => openHope(h)} data-lived>{over(h) ? t('The trip is over: how was it?') : t('Write it after the trip')}</button>{/if}
          </div>
        </div>
      </article>
    {/each}
    <div class="fz-acts"><button type="button" class="btn" onclick={() => openHope()} data-new-hope><Plus size={16} aria-hidden="true" />{t('A wish for a trip')}</button></div>
  </section>

  <section class="fz-form" aria-labelledby="fzr-day-h" data-dayplans>
    <h2 id="fzr-day-h" class="fz-h2"><CalendarRange size={18} aria-hidden="true" /> {t('A day with room for surprises')}</h2>
    <p class="fz-note">{t('Two anchors, and room in between. Decide in advance where you want certainty and where you leave space.')}</p>
    {#each plans as p (p.id)}
      <article class="fz-box" data-dayplan={p.id}>
        <div class="fz-row">
          <span class="fz-row-main"><b>{p.title}</b></span>
          <button type="button" class="fz-icon" aria-label={t('Change {name}', { name: p.title })} onclick={() => openPlan(p)}><Pencil size={18} aria-hidden="true" /></button>
        </div>
        <ol class="fzr-strip">
          <li><span class="fz-kick">{t('Fixed')}</span><span>{p.fix || '–'}</span></li>
          <li class="fzr-free"><span class="fz-kick">{t('Time to discover')}</span><span>{p.explore || t('room for whatever comes')}</span></li>
          <li><span class="fz-kick">{t('Arriving')}</span><span>{p.arrive || '–'}</span></li>
        </ol>
      </article>
    {/each}
    <div class="fz-acts"><button type="button" class="btn" onclick={() => openPlan()} data-new-dayplan><Plus size={16} aria-hidden="true" />{t('Plan a day like this')}</button></div>
  </section>
</div>

{#if edit}
  <FreiSheet title={edit.kind === 'longing' ? t('A thought or a picture') : edit.kind === 'hope' ? t('A wish for a trip') : t('A day with room for surprises')} onsave={save} ondelete={edit.row ? remove : null} onclose={() => (edit = null)}>
    {#if edit.kind === 'longing'}
      <label class="fz-lab">{t('Thought')}<textarea class="inp" rows="3" maxlength="1000" bind:value={edit.text} data-thought-text></textarea></label>
      <div class="fz-lab"><span>{t('What I long for')}</span>
        <div class="fz-chips">{#each longings as l (l.key)}<button type="button" class="fz-chip" aria-pressed={edit.moods.includes(l.key)} onclick={() => toggleMood(l.key)}>{lName(l)}</button>{/each}</div>
      </div>
      <label class="fz-lab">{t('A destination that fits (optional)')}<input class="inp" maxlength="80" bind:value={edit.dest} /></label>
      <div class="fz-lab"><span>{t('Photos')}</span>
        {#if edit.photos.length}<div class="fz-thumbs">{#each edit.photos as p, n (n)}<img src={p.src} alt="" />{/each}</div><button type="button" class="btn sm" onclick={() => (edit.photos = edit.photos.slice(0, -1))}>{t('Remove the last photo')}</button>{/if}
        <PhotoPick onfile={addPhoto} busy={photoBusy} has={!!edit.photos.length} again="Add a photo" />
      </div>
    {:else if edit.kind === 'hope'}
      <label class="fz-lab">{t('Trip')}
        <select class="inp" bind:value={edit.tripId}>
          <option value="">{t('Not in the app yet')}</option>
          {#each trips as x (x.id)}<option value={x.id}>{x.name}</option>{/each}
        </select>
      </label>
      {#if !edit.tripId}<label class="fz-lab">{t('Name of the trip')}<input class="inp" maxlength="80" bind:value={edit.title} data-hope-title /></label>{/if}
      <label class="fz-lab">{t('I hope for')}<textarea class="inp" rows="3" maxlength="1000" bind:value={edit.hope} placeholder={t('e.g. speak Italian every day')} data-hope-text></textarea></label>
      <label class="fz-lab">{t('What I experienced')}<textarea class="inp" rows="3" maxlength="1000" bind:value={edit.lived} data-lived-text></textarea></label>
    {:else}
      <label class="fz-lab">{t('Name')}<input class="inp" maxlength="80" bind:value={edit.title} placeholder={t('e.g. Day 2, Lake Como')} data-plan-title /></label>
      <label class="fz-lab">{t('Fixed: the place I want to see')}<input class="inp" maxlength="200" bind:value={edit.fix} /></label>
      <label class="fz-lab">{t('Time to discover: what I would like to find')}<input class="inp" maxlength="200" bind:value={edit.explore} placeholder={t('e.g. a market, a chat, a swim')} /></label>
      <label class="fz-lab">{t('Arriving: where I sleep')}<input class="inp" maxlength="200" bind:value={edit.arrive} /></label>
    {/if}
  </FreiSheet>
{/if}

<style>
  .fzr-card {
    align-items: stretch;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .fzr-card img {
    width: 100%;
    max-height: 200px;
    border-radius: 10px;
    object-fit: cover;
  }
  .fzr-strip {
    display: grid;
    grid-template-columns: 1fr 1.6fr 1fr;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .fzr-strip li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 8px 10px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    overflow-wrap: break-word;
  }
  .fzr-strip .fzr-free {
    background: var(--accent-soft);
  }
</style>
