<script>
  /**
   * Request a lesson with wish times (Noah 08.11.2026 «1c», «1a 2a»): for offers in mode «wish» the
   * parents do not pick a fixed time. They tick the places, name up to three wish times in the next
   * 14 days, say how many children come, leave a contact and how they found the trainer. Nothing is
   * booked: the trainer checks a court and answers. The price by number of children follows in the
   * next step, so no price is shown here yet.
   */
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { sendWish, errorText } from '../lib/booking/client.js';
  import { addDays } from '../lib/booking/model.js';
  import { localDay } from '../lib/localday.js';
  import { Check, Plus, Minus, X } from '@lucide/svelte';

  let { offer, offerId } = $props();

  const MAX_WISHES = 3;
  const DAYS = 14;
  const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
  const SOURCES = [
    { key: 'flyer', name: 'Flyer' },
    { key: 'google', name: 'Google' },
    { key: 'friends', name: 'Recommendation' },
    { key: 'club', name: 'Club' },
    { key: 'other', name: 'Other' },
  ];

  const places = $derived(offer?.venues ?? []);
  const tomorrow = addDays(localDay(), 1);
  const dayList = Array.from({ length: DAYS }, (_, i) => addDays(tomorrow, i));
  const fmtDay = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' });

  let chosen = $state([]); // places ticked
  let rows = $state([{ day: tomorrow, time: '17:00' }]);
  let kids = $state(1);
  let kidNames = $state('');
  let name = $state('');
  let contact = $state('');
  let source = $state('');
  let note = $state('');
  let busy = $state(false);
  let error = $state('');
  let sent = $state(null);

  $effect(() => {
    // one place: nothing to choose, it counts as ticked
    if (places.length === 1 && !chosen.length) chosen = [places[0]];
  });

  const toggle = (v) => (chosen = chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v]);
  const addRow = () => {
    if (rows.length >= MAX_WISHES) return;
    const last = rows[rows.length - 1];
    rows = [...rows, { day: addDays(last.day, 1) > dayList[dayList.length - 1] ? last.day : addDays(last.day, 1), time: last.time }];
  };
  const dropRow = (i) => (rows = rows.filter((_, k) => k !== i));

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    error = '';
    if (name.trim().length < 2 || contact.trim().length < 3) return (error = t(errorText('bad_person')));
    if (places.length && !chosen.length) return (error = t('Please tick at least one place.'));
    const wishes = [...new Set(rows.map((r) => `${r.day}T${r.time}`))];
    busy = true;
    const r = await sendWish({ id: offerId, venues: chosen, wishes, kids, kidNames, source, name, contact, note });
    busy = false;
    if (!r.ok) return (error = t(errorText(r.code)));
    sent = r.booking;
    scrollTo(0, 0);
  }
</script>

{#if sent}
  <section class="card conf" aria-labelledby="wish-ok-h" data-wish-sent>
    <span class="big-ok" aria-hidden="true"><Check size={36} /></span>
    <h2 id="wish-ok-h">{t('Request sent')}</h2>
    <p class="wait" role="status">{t('Nothing is booked yet. I check whether a court is free and answer, usually within an hour.')}</p>
    <dl class="sum">
      <dt>{t('Who')}</dt><dd>{sent.name}</dd>
      <dt>{tn(sent.wish.wishes.length, 'Wish time', 'Wish times')}</dt><dd>{sent.wish.wishes.map((w) => `${fmtDay(w.slice(0, 10))} ${w.slice(11, 16)}`).join(' · ')}</dd>
      {#if sent.wish.venues.length}<dt>{t('Places|venues')}</dt><dd>{sent.wish.venues.join(' · ')}</dd>{/if}
      <dt>{t('Children')}</dt><dd>{sent.wish.kids}</dd>
    </dl>
    <p class="muted fine">{t('Please keep your phone or e-mail within reach. I will write to you there.')}</p>
  </section>
{:else}
  <form class="card wf" onsubmit={submit} novalidate data-wish-form aria-labelledby="wf-h">
    <h2 id="wf-h">{t('Ask for a lesson')}</h2>
    <p class="muted">{t('Nothing is booked yet. I check whether a court is free and answer, usually within an hour.')}</p>

    {#if places.length > 1}
      <fieldset class="wf-set">
        <legend>{t('1. Where?')}</legend>
        <p class="muted fine">{t('Several places are fine, I book the first one that is free.')}</p>
        <div class="wf-chips">
          {#each places as v (v)}<button type="button" class="wf-chip" aria-pressed={chosen.includes(v)} onclick={() => toggle(v)} data-wish-place>{v}</button>{/each}
        </div>
      </fieldset>
    {:else if places.length === 1}
      <p class="muted"><b>{places[0]}</b></p>
    {/if}

    <fieldset class="wf-set">
      <legend>{places.length > 1 ? t('2. When?') : t('1. When?')}</legend>
      <p class="muted fine">{t('Up to three wish times in the next 14 days.')}</p>
      {#each rows as r, i (i)}
        <div class="wf-row" data-wish-row>
          <label class="wf-l">
            <span>{t('Wish day {n}', { n: i + 1 })}</span>
            <select class="inp" bind:value={r.day}>{#each dayList as d (d)}<option value={d}>{fmtDay(d)}</option>{/each}</select>
          </label>
          <label class="wf-l">
            <span>{t('Time')}</span>
            <select class="inp" bind:value={r.time}>{#each HOURS as h (h)}<option value={h}>{h}</option>{/each}</select>
          </label>
          {#if rows.length > 1}<button type="button" class="ibtn" aria-label={t('Remove this wish time')} onclick={() => dropRow(i)}><X size={18} aria-hidden="true" /></button>{/if}
        </div>
      {/each}
      {#if rows.length < MAX_WISHES}<button type="button" class="btn wf-add" onclick={addRow} data-wish-add><Plus size={18} aria-hidden="true" />{t('Add another wish time')}</button>{/if}
    </fieldset>

    <fieldset class="wf-set">
      <legend>{places.length > 1 ? t('3. How many children?') : t('2. How many children?')}</legend>
      <div class="wf-step">
        <button type="button" class="wf-rnd" aria-label={t('One child less')} disabled={kids <= 1} onclick={() => (kids -= 1)}><Minus size={20} aria-hidden="true" /></button>
        <output aria-live="polite" data-wish-kids>{kids}</output>
        <button type="button" class="wf-rnd" aria-label={t('One child more')} disabled={kids >= 4} onclick={() => (kids += 1)}><Plus size={20} aria-hidden="true" /></button>
        <span class="muted fine">{t('Children (1 to 4)')}</span>
      </div>
      <label class="wf-l"><span>{t('First names and ages of the children')}</span><input class="inp" bind:value={kidNames} maxlength="120" placeholder={t('e.g. Mia (8), Leo (7)')} /></label>
    </fieldset>

    <fieldset class="wf-set">
      <legend>{places.length > 1 ? t('4. How can I reach you?') : t('3. How can I reach you?')}</legend>
      <label class="wf-l"><span>{t('Your name|formal')}</span><input class="inp" bind:value={name} autocomplete="name" maxlength="60" placeholder={t('First and last name')} /></label>
      <label class="wf-l"><span>{t('Phone or e-mail')}</span><input class="inp" bind:value={contact} autocomplete="tel" maxlength="80" placeholder={t('so you can be reached')} /></label>
    </fieldset>

    <fieldset class="wf-set">
      <legend>{places.length > 1 ? t('5. How did you find me?') : t('4. How did you find me?')}</legend>
      <select class="inp" bind:value={source} aria-label={t('How did you find me?')} data-wish-source>
        <option value="">{t('Please choose')}</option>
        {#each SOURCES as s (s.key)}<option value={s.key}>{t(s.name)}</option>{/each}
      </select>
      <label class="wf-l"><span>{t('Note (optional)')}</span><textarea class="inp" rows="2" maxlength="300" bind:value={note} placeholder={t('e.g. level, wishes, questions')}></textarea></label>
    </fieldset>

    {#if error}<p class="err" role="alert">{error}</p>{/if}
    <button type="submit" class="btn hi go" disabled={busy}><Check size={20} aria-hidden="true" />{t('Send request')}</button>
    <p class="muted fine">{t('Cancel up to {n} h before: free. After that the full price applies.', { n: offer.cancelHours })}</p>
  </form>
{/if}

<style>
  .wf {
    display: grid;
    gap: 14px;
    max-width: 640px;
    width: 100%;
    margin: 0 auto;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .wf-set {
    border: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  legend {
    padding: 0;
    font-weight: 700;
    font-size: var(--fs-body);
    margin-bottom: 2px;
  }
  .wf-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .wf-chip {
    padding: 8px 14px;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .wf-chip[aria-pressed='true'] {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--paper);
  }
  .wf-row {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
    gap: 8px;
    align-items: end;
  }
  .wf-l {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .wf-l span {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .wf-add {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    justify-self: start;
  }
  .wf-step {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .wf-step output {
    min-width: 2ch;
    text-align: center;
    font-size: var(--fs-section);
    font-weight: 700;
  }
  .wf-rnd {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid var(--hi);
    background: var(--paper);
    color: var(--hi);
    cursor: pointer;
  }
  .wf-rnd:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .ibtn {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .muted {
    margin: 0;
    color: var(--ink-2);
  }
  .fine {
    font-size: var(--fs-small);
  }
  .err {
    margin: 0;
    color: var(--bad);
  }
  .go {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 56px;
    font-size: var(--fs-sub);
  }
  .conf {
    max-width: 520px;
    width: 100%;
    margin: 0 auto;
    text-align: center;
  }
  .big-ok {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    margin: 4px auto 12px;
    border-radius: 50%;
    background: var(--hi);
    color: var(--paper);
  }
  .wait {
    background: var(--warn-soft);
    border-radius: 8px;
    padding: 8px 10px;
    margin: 0;
  }
  .sum {
    display: grid;
    grid-template-columns: auto 1fr;
    margin: 12px 0 0;
    text-align: left;
  }
  .sum dt,
  .sum dd {
    margin: 0;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .sum dt {
    color: var(--ink-2);
  }
  .sum dd {
    text-align: right;
    font-weight: 600;
    overflow-wrap: break-word;
  }
</style>
