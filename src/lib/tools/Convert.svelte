<script>
  /**
   * Paket L «Werkzeugkasten» (Bildformat umwandeln, Noah 19.10.2026): choose pictures (HEIC from an
   * iPhone, WebP from a web page, PNG …), get JPG or PNG to save or share. Everything on the device.
   */
  import { Images } from '@lucide/svelte';
  import { TARGETS, isHeic, freeNames, convertImage } from './convert.js';
  import { sizeText } from './pdftools.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let target = $state('jpg');
  let input = $state();
  let rows = $state([]); // { name, size, state: wait|busy|done|fail, blob, out }
  async function pick(e) {
    const el = e.currentTarget;
    const files = [...(el.files ?? [])];
    el.value = '';
    const tg = TARGETS.find((x) => x.key === target) ?? TARGETS[0];
    // Einzelidee 38: every new picture keeps its old name and never takes the name of an old file
    const outs = freeNames(files.map((f) => f.name), tg.key, t('converted|file'));
    rows = files.map((f, i) => ({ name: f.name, size: f.size, heic: isHeic(f), state: 'wait', blob: null, out: outs[i] }));
    for (let i = 0; i < files.length; i++) {
      rows[i].state = 'busy';
      try {
        rows[i].blob = await convertImage(files[i], tg);
        rows[i].state = 'done';
      } catch (err) {
        console.error(err);
        rows[i].state = 'fail';
      }
    }
  }
  const ready = $derived(rows.filter((r) => r.state === 'done'));
  async function saveAll() {
    for (const r of ready) await deliver(r.blob, r.out, { share: ready.length === 1 });
  }
</script>

<section class="tool-card convert">
  <div class="tool-row" role="radiogroup" aria-label={t('New format')}>
    {#each TARGETS as x (x.key)}
      <label class="tool-chip"><input type="radio" name="cv-to" value={x.key} bind:group={target} /> {x.label}</label>
    {/each}
  </div>
  <input bind:this={input} type="file" accept="image/*,.heic,.heif" multiple hidden onchange={pick} />
  <div><button type="button" class="btn hi" onclick={() => input.click()}><Images size={16} aria-hidden="true" />{t('Choose pictures')}</button></div>
  {#if rows.length}
    <ul class="tool-list" aria-live="polite">
      {#each rows as r, i (i)}
        <li data-state={r.state}>
          <span class="cv-m"><b>{r.out}</b><small class="tool-muted">{t('from {name}', { name: r.name })} · {sizeText(r.size)}{r.blob ? ` → ${sizeText(r.blob.size)}` : ''}</small></span>
          {#if r.state === 'done'}
            <button type="button" class="btn sm" onclick={() => deliver(r.blob, r.out)}>{t('Save')}</button>
          {:else if r.state === 'fail'}
            <span class="tool-status err">{r.heic ? t('Needs the internet once for HEIC.') : t('Could not be read.')}</span>
          {:else}
            <span class="tool-status">{t('Working …')}</span>
          {/if}
        </li>
      {/each}
    </ul>
    {#if ready.length > 1}<div><button type="button" class="btn" onclick={saveAll}>{t('Save all ({n})', { n: ready.length })}</button></div>{/if}
  {/if}
  <p class="tool-help" data-convert-keep>{t('Your pictures stay as they are. Each new one keeps the old name and gets a name of its own, so nothing is overwritten.')}</p>
  <p class="tool-help">{t('HEIC photos from an iPhone need a small helper from the internet the first time; after that it works offline. The pictures never leave the device.')}</p>
</section>

<style>
  .cv-m {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
  }
  .cv-m b {
    overflow-wrap: break-word;
  }
</style>
