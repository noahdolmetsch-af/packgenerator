<script>
  /**
   * Paket L «Werkzeugkasten» (Video verkleinern, Noah 19.10.2026): a video for WhatsApp or e-mail made
   * smaller on the device. Video-Probe (Noah 28.10.2026 «bauen»): first only 5 seconds are made smaller, so
   * the size can be judged before the whole video runs (it takes as long as the video).
   */
  import { Film, Eye } from '@lucide/svelte';
  import { VIDEO_SIZES, PROBE_SECONDS, probeStart, videoGuess, recType, shrinkVideo, lengthOf } from './video.js';
  import { sizeText } from './pdftools.js';
  import { outName } from './phototools.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  const can = typeof window !== 'undefined' && !!recType() && !!HTMLCanvasElement.prototype.captureStream;
  let input = $state();
  let size = $state('480');
  let file = $state(null);
  let secs = $state(0);
  let busy = $state(''); // '' | 'probe' | 'all'
  let share = $state(0);
  let probe = $state(null); // { url, bytes, key }
  let result = $state(null);
  let fail = $state(false);
  const plan = $derived(VIDEO_SIZES.find((x) => x.key === size));
  const fileLine = $derived(file ? [file.name, sizeText(file.size), secs ? t('{n} s', { n: Math.round(secs) }) : ''].filter(Boolean).join(' · ') : '');
  const guess = $derived(probe && secs ? Math.round((probe.bytes / Math.min(PROBE_SECONDS, secs)) * secs) : 0);

  function clearProbe() {
    if (probe?.url) URL.revokeObjectURL(probe.url);
    probe = null;
  }
  function pick(e) {
    const el = e.currentTarget;
    file = el.files?.[0] ?? null;
    el.value = '';
    result = null;
    fail = false;
    clearProbe();
    secs = 0;
    if (!file) return;
    const v = document.createElement('video');
    const u = URL.createObjectURL(file);
    v.preload = 'metadata';
    v.onloadedmetadata = async () => ((secs = await lengthOf(v)), URL.revokeObjectURL(u));
    v.onerror = () => URL.revokeObjectURL(u);
    v.src = u;
  }
  function chooseSize() {
    clearProbe();
    result = null;
  }
  async function run(kind) {
    busy = kind;
    share = 0;
    fail = false;
    result = null;
    try {
      if (kind === 'probe') {
        clearProbe();
        const blob = await shrinkVideo(file, plan, { onprogress: (p) => (share = p), start: probeStart(secs), seconds: PROBE_SECONDS });
        probe = { url: URL.createObjectURL(blob), bytes: blob.size, key: size };
      } else {
        const blob = await shrinkVideo(file, plan, { onprogress: (p) => (share = p) });
        result = { blob, name: outName(file.name, 'klein', blob.type.includes('mp4') ? 'mp4' : 'webm') };
      }
    } catch (err) {
      console.error(err);
      fail = true;
    }
    busy = '';
  }
</script>

<section class="tool-card video">
  {#if can}
    <div class="tool-row" role="radiogroup" aria-label={t('Size|video')}>
      {#each VIDEO_SIZES as x (x.key)}
        <label class="tool-chip"><input type="radio" name="vd-size" value={x.key} bind:group={size} onchange={chooseSize} disabled={!!busy} /> {t(x.label)} · {x.key}p</label>
      {/each}
    </div>
    <input bind:this={input} type="file" accept="video/*" hidden onchange={pick} />
    <div class="tool-row">
      <button type="button" class="btn {file ? '' : 'hi'}" disabled={!!busy} onclick={() => input.click()}><Film size={16} aria-hidden="true" />{file ? t('Another video') : t('Choose video')}</button>
    </div>
    {#if file}
      <p class="tool-status" data-video-file>{fileLine}</p>
      <div class="tool-row">
        <button type="button" class="btn" disabled={!!busy} onclick={() => run('probe')} data-video-probe><Eye size={16} aria-hidden="true" />{t('Look at {n} seconds first', { n: PROBE_SECONDS })}</button>
        <button type="button" class="btn hi" disabled={!!busy} onclick={() => run('all')} data-video-all>{t('Make the whole video smaller')}</button>
      </div>
    {/if}
    {#if busy}
      <progress max="1" value={share}></progress>
      <p class="tool-status" aria-live="polite">
        {#if busy === 'probe'}{t('Making a test piece: {pct} %. It takes about {n} seconds.', { pct: Math.round(share * 100), n: PROBE_SECONDS })}{:else}{t('Making it smaller: {pct} %. Keep this page open; it takes as long as the video.', { pct: Math.round(share * 100) })}{/if}
      </p>
    {:else if result}
      <p class="tool-big">{sizeText(file.size)} → {sizeText(result.blob.size)}</p>
      <div><button type="button" class="btn hi" onclick={() => deliver(result.blob, result.name)}>{t('Save or share')}</button></div>
    {:else if probe}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video class="probe" src={probe.url} controls playsinline data-video-probe-view></video>
      <p class="tool-status guess" data-video-guess>{t('Test piece: {a} · whole video: about {b}', { a: sizeText(probe.bytes), b: sizeText(guess || videoGuess(secs, plan.bps)) })}</p>
      <p class="tool-help">{t('Not sharp enough? Choose «Medium» above and look again. Sharp enough? Make the whole video smaller.')}</p>
    {:else if fail}
      <p class="tool-status err">{t('This video could not be made smaller here. Try a shorter one, or another browser.')}</p>
    {/if}
  {:else}
    <p class="tool-status">{t('This browser cannot record video. Chrome on the phone or computer can.')}</p>
  {/if}
  <p class="tool-help">{t('The video stays on the device. Phones often film very big; «Small» is enough for messages.')}</p>
</section>

<style>
  progress {
    width: 100%;
  }
  .guess {
    font-weight: 600;
    color: var(--ink);
  }
  .probe {
    width: 100%;
    max-height: 50vh;
    border-radius: 12px;
    background: var(--ink);
  }
</style>
