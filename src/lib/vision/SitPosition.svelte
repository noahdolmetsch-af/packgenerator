<script>
  /**
   * Paket L2 «Velo-Einstellung per Kamera» (Noah 19.10.2026 «3 a und b möglich 4a»): a side photo with the
   * pedal at the bottom, OR a short video while pedalling. The device finds the body points and measures
   * the knee, hip and back angles; the result is kept with the bike as «Sitzposition» with its history
   * (date, saddle height, angles). Only suggestions from a picture: no medical rating. The photo or video
   * is never stored and never leaves the device.
   */
  import { Camera, ImagePlus, Video as VideoIcon, Save } from '@lucide/svelte';
  import { tick } from 'svelte';
  import Seg from '../ui/Seg.svelte';
  import { db } from '../db.js';
  import { sortBikes, bikesHash } from '../bikes.js';
  import { fitValue } from '../bikespecs.js';
  import { localDay } from '../localday.js';
  import { saveFailed } from '../ui/ask.js';
  import * as engine from './engine.js';
  import { photoCanvas } from './picture.js';
  import { anglesOf, videoSummary, fitHints, addSitPos, sitPosOf, POINTS } from './fit.js';
  import { loadPrefs, savePrefs } from './store.js';
  import SitPosList from './SitPosList.svelte';
  import { t } from '../i18n.svelte.js';
  import '../tools/tools.css';

  let bikes = $state([]);
  let bikeId = $state('');
  async function load() {
    bikes = sortBikes(await db.bikes.toArray());
    if (!bikeId) {
      const want = /[?&]bike=([^&]+)/.exec(location.hash)?.[1];
      bikeId = (want && bikes.find((b) => b.id === decodeURIComponent(want))?.id) || bikes[0]?.id || '';
    }
  }
  load().catch(() => {});
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? null);
  const prev = $derived(bike ? sitPosOf(bike)[0] ?? null : null);

  let way = $state('photo'); // 'photo' | 'video'
  loadPrefs().then((p) => (way = p.video ? 'video' : 'photo'));
  const setWay = (w) => {
    way = w;
    savePrefs({ video: w === 'video' });
    reset();
  };

  let shown = $state();
  let step = $state(''); // '' | 'loading' | 'looking'
  let progress = $state(0);
  let error = $state('');
  let m = $state(null); // the measurement
  let seat = $state('');
  let note = $state('');
  let saved = $state('');
  let camIn = $state();
  let galIn = $state();

  function reset() {
    m = null;
    error = '';
    saved = '';
  }

  // the picture with the measured lines (shoulder–hip–knee–ankle, shoulder–elbow–wrist)
  function draw(src, w, h, lm, side) {
    if (!shown) return;
    shown.width = w;
    shown.height = h;
    const g = shown.getContext('2d');
    g.drawImage(src, 0, 0, w, h);
    if (!lm) return;
    const P = POINTS[side];
    const at = (k) => [lm[P[k]].x * w, lm[P[k]].y * h];
    g.lineWidth = Math.max(4, w / 160);
    g.lineCap = 'round';
    const path = (keys, color) => {
      g.strokeStyle = color;
      g.beginPath();
      keys.forEach((k, i) => (i ? g.lineTo(...at(k)) : g.moveTo(...at(k))));
      g.stroke();
    };
    path(['shoulder', 'hip', 'knee', 'ankle'], '#2f6b52');
    path(['shoulder', 'elbow', 'wrist'], '#4a7360');
    g.fillStyle = '#b4541a';
    for (const k of Object.keys(P)) {
      g.beginPath();
      g.arc(...at(k), Math.max(5, w / 120), 0, Math.PI * 2);
      g.fill();
    }
  }

  async function pick(e) {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    reset();
    seat = fitValue(bike, 'seatHeight') ?? '';
    note = '';
    try {
      if (way === 'video' || /^video\//.test(file.type)) await fromVideo(file);
      else await fromPhoto(file);
    } catch (err) {
      console.warn(err);
      error = navigator.onLine === false ? t('The recognition must be downloaded once. Connect to the internet and try again.') : t('The measurement did not work with this file. Try another photo or video.');
    } finally {
      step = '';
    }
  }

  async function fromPhoto(file) {
    step = 'loading';
    const canvas = await photoCanvas(file);
    await engine.preparePose(false);
    step = 'looking';
    const lm = await engine.pose(canvas);
    const a = anglesOf(lm, canvas.width, canvas.height);
    if (!a) {
      error = t('No person found on the photo. Take it from the side, the whole body and the bike in the picture.');
      return;
    }
    m = { ...a, source: 'photo' };
    await tick();
    draw(canvas, canvas.width, canvas.height, lm, a.side);
  }

  async function fromVideo(file) {
    step = 'loading';
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.src = url;
    try {
      await new Promise((res, rej) => ((v.onloadeddata = res), (v.onerror = () => rej(new Error('video')))));
      await engine.preparePose(true);
      step = 'looking';
      const dur = Math.min(Number.isFinite(v.duration) ? v.duration : 0, 12);
      const N = 48;
      const frames = [];
      let best = null;
      for (let i = 0; i < N; i++) {
        const at = dur ? (dur * (i + 0.5)) / N : 0;
        if (Math.abs(v.currentTime - at) > 0.001) {
          await new Promise((res) => {
            v.onseeked = res;
            v.currentTime = at;
          });
        }
        const lm = await engine.poseVideo(v, at * 1000);
        const a = anglesOf(lm, v.videoWidth, v.videoHeight);
        progress = Math.round(((i + 1) / N) * 100);
        if (!a) continue;
        frames.push(a);
        if (a.sure && (!best || a.knee > best.a.knee)) {
          const c = document.createElement('canvas');
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0);
          best = { a, lm, c };
        }
      }
      const s = videoSummary(frames);
      if (!s) {
        error = t('Too few good pictures in the video. Film from the side, the whole body in the picture, at least two crank turns.');
        return;
      }
      m = { ...s, source: 'video' };
      await tick();
      if (best) draw(best.c, best.c.width, best.c.height, best.lm, best.a.side);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const hints = $derived(m ? fitHints(m, prev) : []);

  async function save() {
    if (!m || !bike) return;
    const h = String(seat ?? '').trim() === '' ? null : Number(String(seat).replace(',', '.'));
    if (h != null && !(h > 300 && h < 1200)) {
      error = t('Type the saddle height in millimetres, e.g. 740.');
      return;
    }
    try {
      const cur = await db.bikes.get(bike.id);
      await db.bikes.update(bike.id, addSitPos(cur, { ...m, seatHeight: h, note: note.trim() }, { date: localDay() }));
      saved = t('Saved with the {bike} as sitting position.', { bike: bike.name });
      m = null;
      await load();
    } catch (err) {
      error = saveFailed(err);
    }
  }
</script>

<section class="tool-card sp" data-way={way}>
  {#if !bikes.length}
    <p class="tool-status">{t('No bike yet. Add your bike under Bikes first.')}</p>
  {:else}
    <label class="tool-field"><span>{t('Bike')}</span>
      <select class="tool-input" bind:value={bikeId} onchange={reset} data-sp-bike>
        {#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
      </select>
    </label>
    <Seg label={t('Measure with')} value={way} onchange={setWay} options={[{ key: 'photo', name: t('Photo from the side') }, { key: 'video', name: t('Video while pedalling') }]} />
    {#if way === 'photo'}
      <p class="tool-help">{t('Sit on the bike as you ride, one pedal at the very bottom. Someone takes the photo from the side, at hip height, the whole body and both wheels in the picture.')}</p>
    {:else}
      <p class="tool-help">{t('On the trainer or holding on: pedal calmly. Someone films from the side for about 5 seconds, at hip height, the whole body in the picture. The app looks at many pictures of one crank turn.')}</p>
    {/if}
    <p class="tool-muted">{t('Measured on this device; the picture is not stored and does not leave it. The first time the app downloads the recognition once (about 20 MB).')}</p>

    <div class="tool-row">
      <button type="button" class="btn hi" onclick={() => camIn.click()} disabled={!!step}>{#if way === 'video'}<VideoIcon size={16} aria-hidden="true" />{t('Film')}{:else}<Camera size={16} aria-hidden="true" />{t('Take photo')}{/if}</button>
      <button type="button" class="btn" onclick={() => galIn.click()} disabled={!!step}><ImagePlus size={16} aria-hidden="true" />{t('From gallery')}</button>
      {#key way}
        <input bind:this={camIn} type="file" accept={way === 'video' ? 'video/*' : 'image/*'} capture="environment" hidden onchange={pick} data-sp-camera />
        <input bind:this={galIn} type="file" accept={way === 'video' ? 'video/*' : 'image/*'} hidden onchange={pick} data-sp-file />
      {/key}
    </div>

    {#if step === 'loading'}<p class="tool-status" role="status">{t('Loading the recognition … (the first time takes a moment)')}</p>{/if}
    {#if step === 'looking'}<p class="tool-status" role="status">{way === 'video' ? t('Measuring … {n} %', { n: progress }) : t('Measuring …')}</p>{/if}
    {#if error}<p class="tool-status err" role="alert">{error}</p>{/if}
    {#if saved}<p class="tool-status" role="status" data-sp-saved>{saved}</p>{/if}

    {#if m}
      <canvas class="sp-photo" bind:this={shown} aria-label={t('Your picture with the measured lines')}></canvas>
      <dl class="sp-vals" data-sp-result>
        <div><dt>{t('Knee at the bottom')}</dt><dd class="num">{m.knee ?? '–'}°</dd></div>
        {#if m.kneeTop != null}<div><dt>{t('Knee at the top')}</dt><dd class="num">{m.kneeTop}°</dd></div>{/if}
        <div><dt>{t('Back to the ground')}</dt><dd class="num">{m.back ?? '–'}°</dd></div>
        <div><dt>{t('Hip')}</dt><dd class="num">{m.hip ?? '–'}°</dd></div>
        {#if m.elbow != null}<div><dt>{t('Elbow')}</dt><dd class="num">{m.elbow}°</dd></div>{/if}
      </dl>
      <ul class="sp-hints">
        {#each hints as h (h.key)}<li data-hint={h.kind ?? ''}>{t(h.key, h)}</li>{/each}
      </ul>
      <p class="tool-muted">{t('Only a suggestion from the picture, no medical rating and no professional bike fit. Change the saddle in small steps (2–3 mm) and see how it feels.')}</p>
      <div class="tool-row sp-save">
        <label class="tool-field"><span>{t('Saddle height (mm)')}</span><input class="tool-input" inputmode="decimal" bind:value={seat} placeholder="740" data-sp-seat /></label>
        <label class="tool-field sp-note"><span>{t('Note')}</span><input class="tool-input" bind:value={note} placeholder={t('e.g. saddle 3 mm lower')} /></label>
      </div>
      <div><button type="button" class="btn hi" onclick={save} data-sp-save><Save size={16} aria-hidden="true" />{t('Save with the bike')}</button></div>
    {/if}

    {#if bike && sitPosOf(bike).length}
      <h3 class="sp-h">{t('Sitting position of the {bike}', { bike: bike.name })}</h3>
      <SitPosList {bike} onchange={load} />
      <p class="tool-muted"><a href={bikesHash({ tab: 'setup', bike: bike.id })}>{t('To the bike')}</a></p>
    {/if}
  {/if}
</section>

<style>
  .sp-photo {
    width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .sp-vals {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: var(--sp-2);
    margin: 0;
  }
  .sp-vals div {
    padding: var(--sp-2) var(--sp-3);
    border-radius: 10px;
    background: var(--paper-2);
  }
  .sp-vals dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sp-vals dd {
    margin: 0;
    font-size: var(--fs-title);
    font-weight: 600;
  }
  .sp-hints {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding-left: 1.2em;
  }
  .sp-save .tool-field {
    flex: 1 1 160px;
  }
  .sp-note {
    flex: 2 1 220px !important;
  }
  .sp-h {
    margin: var(--sp-3) 0 0;
    font-size: var(--fs-body);
  }
</style>
