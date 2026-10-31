<script>
  /**
   * Mini-Tools «Anmeldeliste» (idea 4): what the people asked see (#/mitmachen/<id>/<key>). How many places
   * are still free, then name and «I am in» (or «Put me on the waiting list» when it is full). Afterwards the
   * page says the place or the place on the waiting list; «Sign off» takes the answer back, and the next one
   * moves up. The name is locked for the maker alone (client.js sealFor).
   * list: the list read from the link (liste.js readList), id: the server id, end: until when, n: answers so far.
   */
  import { untrack } from 'svelte';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { sendAnswer, myPlace, leaveAnswer, MINI_ERRORS } from './client.js';
  import { readJoined, saveJoined, JOINED_KEY } from './store.js';
  import { cleanListAnswer, cleanName, placeState, freeOf } from './liste.js';
  import { askDelete } from '../ui/ask.js';
  import { Lock, UserPlus, UserMinus, CalendarDays, MapPin, Clock, CircleCheck } from '@lucide/svelte';

  let { list, id, end, n = 0 } = $props();
  const L = untrack(() => list);
  let count = $state(untrack(() => n));
  let name = $state('');
  let note = $state('');
  let mine = $state.raw(null);
  let place = $state.raw(null); // { state, n }
  let busy = $state(false);
  let err = $state('');
  let said = $state('');
  const free = $derived(freeOf(count, L.places));
  const endFmt = (iso) => new Date(iso).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Zurich' });
  const when = L.day ? `${new Date(`${L.day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}${L.time ? `, ${L.time}` : ''}` : '';
  const errText = (e) => t(MINI_ERRORS[e?.code] ?? MINI_ERRORS.server_error);

  async function where() {
    try {
      const p = await myPlace(id, mine);
      place = placeState(p.pos, L.places);
      count = p.n;
    } catch (e) {
      if (e?.code === 'gone') {
        place = null;
        mine = null;
        said = t('You are not on the list any more. You can sign up again.');
        await forget();
      } else err = errText(e);
    }
  }
  async function forget() {
    try {
      const all = await readJoined(db);
      delete all[id];
      await db.settings.put({ key: JOINED_KEY, value: all });
    } catch {
      /* nothing kept here */
    }
  }

  $effect(() => {
    untrack(async () => {
      try {
        const j = (await readJoined(db))[id];
        if (j?.aid) {
          mine = { aid: j.aid, del: j.del };
          name = j.name ?? '';
          note = j.note ?? '';
          await where();
        }
      } catch {
        /* no storage in this browser: signing up still works once */
      }
    });
  });

  async function join(e) {
    e?.preventDefault?.();
    err = '';
    said = '';
    const answer = cleanListAnswer({ name, note });
    if (!cleanName(name)) return (err = t('Write your name first, so they know who answered.'));
    busy = true;
    try {
      const r = await sendAnswer(id, L.pk, answer, mine);
      mine = { aid: r.aid, del: r.del };
      try {
        await saveJoined(db, id, { aid: r.aid, del: r.del, ...answer, at: r.at });
      } catch {
        /* not kept here */
      }
      await where();
    } catch (e2) {
      err = errText(e2);
    } finally {
      busy = false;
    }
  }
  async function leave() {
    const a = await askDelete({ title: t('Sign off?'), text: t('Your place goes to the next one on the waiting list. You can sign up again later, but then you are at the end.'), label: t('Sign off') });
    if (a !== 'delete') return;
    busy = true;
    err = '';
    try {
      await leaveAnswer(id, mine);
      mine = null;
      place = null;
      count = Math.max(0, count - 1);
      await forget();
      said = t('You are signed off.');
    } catch (e) {
      err = errText(e);
    } finally {
      busy = false;
    }
  }
</script>

<header>
  <p class="kick">{L.by ? t('{name} asks', { name: L.by }) : t('Sign-up list')}</p>
  <h1 data-page-title tabindex="-1">{L.title}</h1>
  {#if L.note}<p class="sub">{L.note}</p>{/if}
  <ul class="la-facts">
    {#if when}<li><CalendarDays size={16} aria-hidden="true" />{when}</li>{/if}
    {#if L.where}<li><MapPin size={16} aria-hidden="true" />{L.where}</li>{/if}
    <li><Clock size={16} aria-hidden="true" />{t('Sign-up possible until {day}', { day: endFmt(end) })}</li>
  </ul>
</header>

<div class="card la-box" data-la>
  <p class="la-free" data-la-free>{free ? t('{n} of {max} places free', { n: free, max: L.places }) : t('All {max} places are taken. You can go on the waiting list.', { max: L.places })}</p>
  <div class="la-bar" aria-hidden="true"><b style={`width:${(Math.min(count, L.places) / L.places) * 100}%`}></b></div>

  {#if place}
    <p class="la-place" class:wait={place.state === 'wait'} role="status" data-la-place={place.state}>
      <CircleCheck size={20} aria-hidden="true" />
      {place.state === 'yes' ? t('You are in: place {n} of {max}.', { n: place.n, max: L.places }) : t('You are on the waiting list, place {n}. If someone signs off, you move up by yourself.', { n: place.n })}
    </p>
    <p class="la-help">{t('Open this link again to see your place.')}</p>
    <div class="la-acts">
      <button type="button" class="btn" onclick={leave} disabled={busy} data-la-leave><UserMinus size={18} aria-hidden="true" />{t('Sign off')}</button>
    </div>
  {:else}
    <form class="la-form" onsubmit={join} data-la-form>
      <label class="la-fld"><span>{t('Your name')}</span><input type="text" bind:value={name} maxlength="40" autocomplete="given-name" data-la-name /></label>
      <label class="la-fld"><span>{t('A note (optional)')}</span><input type="text" bind:value={note} maxlength="120" data-la-note /></label>
      <button type="submit" class="btn hi" disabled={busy} data-la-join><UserPlus size={18} aria-hidden="true" />{free ? t('I am in') : t('Put me on the waiting list')}</button>
    </form>
  {/if}
  {#if err}<p class="la-err" role="alert" data-la-err>{err}</p>{/if}
  {#if said}<p class="la-help" role="status" data-la-said>{said}</p>{/if}
</div>
<p class="la-help"><Lock size={14} aria-hidden="true" /> {t('No app and no account needed. Only the person who asked sees your name; the server only counts the places and deletes everything by itself.')}</p>

<style>
  .kick {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  h1 {
    margin: 0;
    text-wrap: balance;
  }
  .sub {
    margin: var(--sp-1) 0 0;
    color: var(--ink-2);
  }
  .la-facts {
    list-style: none;
    margin: var(--sp-2) 0 0;
    padding: 0;
    display: grid;
    gap: 4px;
    color: var(--ink-2);
  }
  .la-facts li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .la-box,
  .la-form {
    display: grid;
    gap: var(--sp-3);
  }
  .la-free {
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 700;
  }
  .la-bar {
    height: 12px;
    border-radius: 6px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .la-bar b {
    display: block;
    height: 100%;
    background: var(--accent);
  }
  .la-place {
    margin: 0;
    display: flex;
    gap: var(--sp-2);
    align-items: flex-start;
    padding: var(--sp-3);
    border-radius: 10px;
    background: var(--ok-soft);
    font-weight: 600;
  }
  .la-place.wait {
    background: var(--warn-soft);
  }
  .la-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .la-fld > span {
    font-weight: 600;
  }
  .la-fld input {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .la-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .la-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .la-acts {
    display: flex;
    gap: var(--sp-2);
    flex-wrap: wrap;
  }
</style>
