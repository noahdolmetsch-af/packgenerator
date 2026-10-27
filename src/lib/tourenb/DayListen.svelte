<script>
  /**
   * Idee 56 «Tagebuch aus Sprachnotizen» (Touren b, mockup B56, answer a: in the debrief per day): «Dein Tag zum
   * Hören». The voice notes of a tour day in time order, with the place (km on the route); «Alle abspielen» plays
   * them one after the other; «Als Text» turns the ones without words into text on this device (Whisper); the
   * order can be changed (arrows and drag). Stays on this device like the voice notes themselves.
   */
  import { liveQuery } from 'dexie';
  import { Play, Pause, Type, Headphones } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { saveFailed } from '../ui/ask.js';
  import { sortable } from '../ui/sortable.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { inputsOf, setVoice } from '../eingabe/inputs.js';
  import { voiceText } from '../eingabe/inputsdb.js';
  import { dayClips, clipDays, moveClip, dateOfDay } from './tagclips.js';
  import { shortDay } from '../trip/checkhints.js';
  import { t, num, lang } from '../i18n.svelte.js';

  let { trip } = $props();
  const srcQ = liveQuery(async () => {
    const [notes, places, diary] = await Promise.all([db.notes.toArray(), db.tracks.where('tripId').equals(trip.id).toArray(), db.frei.where('kind').equals('diary').toArray()]);
    return { notes, places, diary };
  });
  const sources = $derived($srcQ ?? { notes: [], places: [], diary: [] });
  const days = $derived(clipDays(trip, sources));
  let day = $state(null);
  const cur = $derived(day ?? days[0]?.day ?? 0);
  const clips = $derived(dayClips(trip, cur, sources));
  const total = $derived(clips.reduce((x, c) => x + (c.s || 0), 0));
  const time = (iso) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '');
  const whereOf = (c) => [c.km != null ? `km ${num(c.km)}` : '', c.where ?? ''].filter(Boolean).join(' · ') || t('Voice note');

  // play all, one after the other
  let player = $state();
  let playing = $state(-1);
  function playAt(i) {
    if (!player || i < 0 || i >= clips.length) return stopAll();
    playing = i;
    player.src = clips[i].src;
    player.play().catch(() => stopAll());
  }
  function stopAll() {
    playing = -1;
    try {
      player?.pause();
    } catch {
      /* nothing playing */
    }
  }
  const ended = () => playAt(playing + 1);

  async function move(from, to) {
    const keys = clips.map((c) => c.key);
    const [k] = keys.splice(from, 1);
    keys.splice(to, 0, k);
    await saveOrder(keys);
  }
  const step = (key, dir) => saveOrder(moveClip(clips.map((c) => c.key), key, dir));
  async function saveOrder(keys) {
    try {
      await db.trips.update(trip.id, touched({ clipOrder: { ...(trip.clipOrder ?? {}), [cur]: keys } }));
    } catch (err) {
      saveFailed(err);
    }
  }

  // «Als Text»: the clips without words, on this device
  let busy = $state(false);
  let msg = $state('');
  async function asText() {
    busy = true;
    msg = t('The words are found on this device. The first time it loads the speech model once (about 80 MB, free).');
    let n = 0;
    try {
      for (const c of clips.filter((x) => !x.said)) {
        const said = await voiceText(c.src, { lang: lang.v === 'en' ? 'en-GB' : 'de-CH', onprogress: (p) => (msg = t('Loading the speech model … {n} %', { n: p })) });
        if (!said) continue;
        const table = db[c.from.table];
        const rec = await table.get(c.from.id);
        if (!rec) continue;
        await table.put({ ...rec, inputs: setVoice(inputsOf(rec.inputs), c.from.voiceId, { text: said }) });
        n++;
      }
      msg = n ? t('{n} voice notes are text now.', { n }) : t('No words found in these voice notes.');
    } catch {
      msg = t('Turning it into text did not work here. The voice notes stay.');
    } finally {
      busy = false;
    }
  }
</script>

{#if days.length}
  <section class="tp-card dl" aria-labelledby="dl-h" data-day-listen>
    <h2 id="dl-h"><Headphones size={18} aria-hidden="true" /> {t('Your day to listen to')}</h2>
    <p class="dl-sub">{t('Your short voice notes of the day, in order of time and place. One tap plays them all. Stays on this device.')}</p>
    {#if days.length > 1 || (trip.days ?? 1) > 1}
      <div class="tp-chips" role="group" aria-label={t('Day')}>
        {#each days as d (d.day)}<button type="button" class="tp-chip" aria-pressed={cur === d.day} onclick={() => (stopAll(), (day = d.day))}>{t('Day {n}', { n: d.day + 1 })} · {num(d.n)}</button>{/each}
      </div>
    {/if}
    <div class="dl-top">
      <button type="button" class="dl-play" aria-label={playing >= 0 ? t('Stop') : t('Play all {n}', { n: clips.length })} onclick={() => (playing >= 0 ? stopAll() : playAt(0))} data-listen-all>{#if playing >= 0}<Pause size={22} aria-hidden="true" />{:else}<Play size={22} aria-hidden="true" />{/if}</button>
      <span class="dl-t"><b>{t('Play all {n}', { n: clips.length })}</b><small class="num">{t('{m} min {s} s', { m: Math.floor(total / 60), s: total % 60 })} · {shortDay(dateOfDay(trip, cur))}</small></span>
      <button type="button" class="btn" disabled={busy || clips.every((c) => c.said)} onclick={asText} data-listen-text><Type size={16} aria-hidden="true" />{t('As text')}</button>
    </div>
    <audio bind:this={player} onended={ended} preload="none" class="dl-audio"></audio>
    <ul class="dl-list" use:sortable={{ onmove: move }}>
      {#each clips as c, i (c.key)}
        <li class:on={playing === i} data-listen-clip>
          <SortGrip name={whereOf(c)} onstep={(d) => step(c.key, d)} />
          <span class="dl-h num">{time(c.at)}</span>
          <span class="dl-w"><b>{whereOf(c)}</b>{#if c.said || c.text}<small>«{c.said || c.text}»</small>{/if}</span>
          <button type="button" class="tp-icon-btn" aria-label={t('Play {name}', { name: whereOf(c) })} onclick={() => playAt(i)}><Play size={16} aria-hidden="true" /></button>
          <span class="tp-badge num">{t('{n} s', { n: num(c.s) })}</span>
          <SortArrows name={whereOf(c)} {i} n={clips.length} onstep={(d) => step(c.key, d)} />
        </li>
      {/each}
    </ul>
    {#if msg}<p class="tp-small tp-muted" role="status">{msg}</p>{/if}
    <p class="tp-small tp-muted">{t('A voice note comes from the ride page, «I am here» on the live map, a quick note or the diary of that day.')}</p>
  </section>
{/if}

<style>
  .dl {
    margin: 0 0 var(--sp-4);
  }
  .dl h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .dl-sub {
    margin: 0 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dl-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 10px 0;
    flex-wrap: wrap;
  }
  .dl-play {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 0;
    background: var(--brand);
    color: var(--brand-ink);
    display: grid;
    place-items: center;
    cursor: pointer;
    flex: none;
  }
  .dl-t {
    flex: 1 1 140px;
    display: grid;
  }
  .dl-t small,
  .dl-w small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dl-audio {
    display: none;
  }
  .dl-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .dl-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .dl-list li.on {
    background: var(--paper-2);
  }
  .dl-h {
    width: 3em;
    flex: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .dl-w {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .dl-w small {
    overflow-wrap: break-word;
  }
</style>
