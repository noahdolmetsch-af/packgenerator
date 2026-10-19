<script>
  /**
   * Paket L «Werkzeugkasten» (Strichcode-Scanner → Material, Noah 19.10.2026): the camera reads the bar
   * code of a product (the browser's own detector, on the device), or the number is typed. A known code
   * opens its item in Material; a new code becomes a new item with the code, after a name and a
   * category. Nothing is looked up on the internet.
   */
  import { ScanLine } from '@lucide/svelte';
  import { db } from '../db.js';
  import { choosable } from '../gear.js';
  import { newItem } from '../gearimport.js';
  import { FORMATS, cleanCode, checkDigitOk, itemsWithCode } from './barcode.js';
  import { backCamera, stopStream, cameraError } from './camera.js';
  import { saveFailed } from '../ui/ask.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window;
  let video = $state();
  let stream = null;
  let scanning = $state(false);
  let camErr = $state('');
  let code = $state('');
  let found = $state(null); // null = not looked up; [] = new; [items]
  let name = $state('');
  let cat = $state('');
  let error = $state('');
  let cats = $state([]);

  async function scan() {
    camErr = '';
    try {
      stream = await backCamera();
    } catch (err) {
      camErr = cameraError(err);
      return;
    }
    scanning = true;
    await Promise.resolve();
    video.srcObject = stream;
    await video.play().catch(() => {});
    const det = new window.BarcodeDetector({ formats: FORMATS });
    const tick = async () => {
      if (!scanning) return;
      try {
        const hits = await det.detect(video);
        if (hits.length) {
          code = cleanCode(hits[0].rawValue);
          stop();
          return look();
        }
      } catch {
        /* a frame without picture yet */
      }
      setTimeout(tick, 250);
    };
    tick();
  }
  function stop() {
    scanning = false;
    stopStream(stream);
    stream = null;
  }
  $effect(() => () => stop());

  async function look() {
    error = '';
    const c = cleanCode(code);
    if (!c) return;
    cats = choosable();
    found = itemsWithCode(await db.items.toArray(), c);
  }
  async function create(e) {
    e.preventDefault();
    if (!name.trim()) return (error = t('Please type a name.'));
    try {
      const all = await db.items.toArray();
      const item = { ...newItem({ name: name.trim(), category: cat }, all), barcode: cleanCode(code), sources: 'barcode' };
      await db.items.add(item);
      location.hash = `#/gear?item=${encodeURIComponent(item.id)}`;
    } catch (err) {
      error = saveFailed(err);
    }
  }
</script>

<section class="tool-card barcode">
  {#if scanning}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video class="tool-cam" bind:this={video} playsinline muted></video>
    <button type="button" class="btn" onclick={stop}>{t('Stop camera')}</button>
  {:else if canScan}
    <div><button type="button" class="btn hi" onclick={scan}><ScanLine size={16} aria-hidden="true" />{t('Scan bar code')}</button></div>
  {:else}
    <p class="tool-status">{t('This browser cannot read bar codes with the camera. Type the number under the bars.')}</p>
  {/if}
  {#if camErr}
    <p class="tool-status err">{camErr === 'denied' ? t('The camera was not allowed. Allow the camera for this site in the browser settings.') : t('No camera found on this device.')}</p>
  {/if}
  <form class="tool-row" onsubmit={(e) => (e.preventDefault(), look())}>
    <label class="tool-field b-code"><span>{t('Number under the bars')}</span><input class="tool-input" inputmode="numeric" autocomplete="off" bind:value={code} oninput={() => (found = null)} /></label>
    <button type="submit" class="btn" disabled={!cleanCode(code)}>{t('Look up')}</button>
  </form>
  {#if cleanCode(code) && !checkDigitOk(code)}
    <p class="tool-status err">{t('The last digit does not fit. Check the number.')}</p>
  {/if}
  {#if found?.length}
    <p class="tool-help">{t('This code is already in your gear:')}</p>
    <ul class="tool-list">
      {#each found as it (it.id)}
        <li><a href={`#/gear?item=${encodeURIComponent(it.id)}`} data-item={it.id}>{it.name}</a></li>
      {/each}
    </ul>
  {:else if found}
    <form class="b-new" onsubmit={create}>
      <p class="tool-help">{t('New code. Add it to your gear:')}</p>
      <label class="tool-field"><span>{t('Name|item')}</span><input class="tool-input" bind:value={name} autocomplete="off" /></label>
      <label class="tool-field"><span>{t('Category')}</span>
        <select class="tool-input" bind:value={cat}>
          <option value="">–</option>
          {#each cats as c (c.key)}<option value={c.key}>{t(c.name)}</option>{/each}
        </select>
      </label>
      {#if error}<p class="tool-status err" role="alert">{error}</p>{/if}
      <div><button type="submit" class="btn hi">{t('Add to gear')}</button></div>
    </form>
  {/if}
  <p class="tool-help">{t('The code stays with the item. Next time the scan opens it right away. Nothing is looked up on the internet.')}</p>
</section>

<style>
  .b-code {
    flex: 1 1 220px;
  }
  .b-new {
    display: grid;
    gap: var(--sp-3);
  }
</style>
