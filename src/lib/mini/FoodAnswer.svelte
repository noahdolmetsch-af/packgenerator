<script>
  /**
   * Mini-Tools «Essen und Unverträglichkeiten» (idea 7): what the people asked see (#/mitmachen/<id>/<key>):
   * name, how many people, what they eat, allergies and how hungry. Changeable later.
   * The answer is locked for the maker alone (client.js sealFor). food: read from the link (essen.js readFood).
   */
  import { untrack } from 'svelte';
  import { db } from '../db.js';
  import { t, locale } from '../i18n.svelte.js';
  import { sendAnswer, MINI_ERRORS } from './client.js';
  import { readJoined, saveJoined } from './store.js';
  import { DIETS, SIZES, PEOPLE_MAX, cleanFoodAnswer, cleanName } from './essen.js';
  import { Lock, Send, Minus, Plus, CalendarDays } from '@lucide/svelte';

  let { food, id, end } = $props();
  const q = untrack(() => food);
  let name = $state('');
  let n = $state(1);
  let diets = $state([]);
  let other = $state('');
  let size = $state('m');
  let mine = $state.raw(null);
  let busy = $state(false);
  let err = $state('');
  let sent = $state('');
  const endFmt = (iso) => new Date(iso).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Zurich' });
  const when = q.day ? new Date(`${q.day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  $effect(() => {
    untrack(async () => {
      try {
        const j = (await readJoined(db))[id];
        if (j?.aid) {
          mine = { aid: j.aid, del: j.del };
          name = j.name ?? '';
          n = j.n ?? 1;
          diets = [...(j.diets ?? [])];
          other = j.other ?? '';
          size = j.size ?? 'm';
          sent = t('You already answered. You can change your answer and send it again.');
        }
      } catch {
        /* no storage in this browser */
      }
    });
  });
  const flip = (k) => (diets = diets.includes(k) ? diets.filter((x) => x !== k) : [...diets, k]);

  async function send(e) {
    e?.preventDefault?.();
    err = '';
    if (!cleanName(name)) return (err = t('Write your name first, so they know who answered.'));
    const answer = cleanFoodAnswer({ name, n, diets, other, size });
    busy = true;
    try {
      const r = await sendAnswer(id, q.pk, answer, mine);
      mine = { aid: r.aid, del: r.del };
      try {
        await saveJoined(db, id, { aid: r.aid, del: r.del, ...answer, at: r.at });
      } catch {
        /* not kept here */
      }
      sent = t('Thank you, your answer is sent. You can change it until {day}.', { day: endFmt(end) });
    } catch (e2) {
      err = t(MINI_ERRORS[e2?.code] ?? MINI_ERRORS.server_error);
    } finally {
      busy = false;
    }
  }
</script>

<header>
  <p class="kick">{q.by ? t('{name} asks', { name: q.by }) : t('Who eats what')}</p>
  <h1 data-page-title tabindex="-1">{q.title}</h1>
  {#if q.note}<p class="sub">{q.note}</p>{/if}
  {#if when}<p class="sub fa-when"><CalendarDays size={16} aria-hidden="true" />{when}</p>{/if}
</header>
<form class="card fa-box" onsubmit={send} data-fa>
  <label class="fa-fld"><span>{t('Your name')}</span><input type="text" bind:value={name} maxlength="40" autocomplete="given-name" data-fa-name /></label>
  <div class="fa-fld">
    <span id="fa-n">{t('How many people eat with you, you included?')}</span>
    <div class="fa-n" role="group" aria-labelledby="fa-n">
      <button type="button" class="fa-step" aria-label={t('One person less')} onclick={() => (n = Math.max(1, n - 1))} disabled={n <= 1}><Minus size={18} aria-hidden="true" /></button>
      <b data-fa-count>{n}</b>
      <button type="button" class="fa-step" aria-label={t('One person more')} onclick={() => (n = Math.min(PEOPLE_MAX, n + 1))} disabled={n >= PEOPLE_MAX} data-fa-more><Plus size={18} aria-hidden="true" /></button>
    </div>
  </div>
  <div class="fa-fld">
    <span>{t('What do you eat? Tick what fits, or nothing.')}</span>
    <div class="fa-chips" role="group" aria-label={t('What you eat')}>
      {#each DIETS as d (d.key)}<button type="button" class="fa-chip" class:on={diets.includes(d.key)} aria-pressed={diets.includes(d.key)} onclick={() => flip(d.key)} data-fa-diet={d.key}>{t(d.label)}</button>{/each}
    </div>
  </div>
  <label class="fa-fld"><span>{t('Allergies or anything else (optional)')}</span><input type="text" bind:value={other} maxlength="160" placeholder={t('e.g. celery, no mushrooms')} data-fa-other /></label>
  <div class="fa-fld">
    <span>{t('How hungry')}</span>
    <div class="fa-chips" role="radiogroup" aria-label={t('How hungry')}>
      {#each SIZES as s (s.key)}<button type="button" role="radio" class="fa-chip" class:on={size === s.key} aria-checked={size === s.key} onclick={() => (size = s.key)} data-fa-size={s.key}>{t(s.label)}</button>{/each}
    </div>
  </div>
  {#if err}<p class="fa-err" role="alert" data-fa-err>{err}</p>{/if}
  <button type="submit" class="btn hi" disabled={busy} data-fa-send><Send size={18} aria-hidden="true" />{mine ? t('Send the changed answer') : t('Send my answer')}</button>
  {#if sent}<p class="fa-ok" role="status" data-fa-sent>{sent}</p>{/if}
</form>
<p class="fa-help"><Lock size={14} aria-hidden="true" /> {t('No app and no account needed. Only the person who asked can read your answer; the server cannot read it and deletes it by itself.')}</p>

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
  .fa-when {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
  .fa-box {
    display: grid;
    gap: var(--sp-3);
  }
  .fa-fld {
    display: grid;
    gap: var(--sp-1);
  }
  .fa-fld > span {
    font-weight: 600;
  }
  .fa-fld input {
    min-height: 44px;
    width: 100%;
    box-sizing: border-box;
  }
  .fa-n {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }
  .fa-n b {
    min-width: 2ch;
    text-align: center;
    font-size: var(--fs-sub);
  }
  .fa-step {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .fa-step:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .fa-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .fa-chip {
    min-height: 44px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .fa-chip.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .fa-err {
    margin: 0;
    color: var(--bad);
    font-weight: 600;
  }
  .fa-ok {
    margin: 0;
    font-weight: 600;
  }
  .fa-help {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
