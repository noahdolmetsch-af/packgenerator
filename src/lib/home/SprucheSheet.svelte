<script>
  /**
   * «All sayings» (Noah 07.11.2026 «bau spruch pr3 und 4»): the window behind the tile «Saying» on Today. The tone
   * (mix or one tone), a switch for each source and a switch for each sentence (both wordings go together). Every change
   * is saved at once in the row of the tile (spruch.js SPRUCH_KEY); closing offers Undo for the whole change. Nothing is
   * deleted. The sentences are fixed text, the quotes themselves are chosen under «Cushion time».
   */
  import { X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import { t } from '../i18n.svelte.js';
  import { SPRUCH_KEY, TEMPLATES, ABOUT, SOURCES, SOURCE_NAME, TONE_NAME, TONE_CHOICES, baseId, fitting, spruchOf, setTon, setSource, setTemplate } from './spruch.js';
  import '../bikes/velo-dlg.css';

  /** rec: the stored row of the tile; ctx: what the sentences need today (to mark «fits today»). */
  let { rec = null, ctx, onclose } = $props();

  const row = $derived(spruchOf(rec));
  const fitsNow = $derived(new Set(fitting(ctx, {}).map((x) => baseId(x.id))));
  const toneOptions = $derived(TONE_CHOICES.map((k) => ({ key: k, name: k === 'mix' ? t('Mix|saying') : t(TONE_NAME[k]) })));
  const byTemplate = (src) => TEMPLATES.filter((x) => x.src === src);

  // svelte-ignore state_referenced_locally
  const before = rec;
  let changed = false;
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });

  function save(next) {
    changed = true;
    return db.settings.put({ key: SPRUCH_KEY, value: $state.snapshot(next) });
  }
  const closed = () => {
    if (changed) offerDone(t('Sayings changed.'), () => db.settings.put({ key: SPRUCH_KEY, value: before }));
    onclose?.({ changed });
  };
</script>

<dialog class="sheet vdlg spr" bind:this={dialog} use:backClose onclose={closed} aria-labelledby="spr-h" data-spruch-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="spr-h">{t('All sayings')}</h2>
      <p class="vd-sub">{t('Choose the tone and what the sayings may be made of. Nothing is deleted, you can switch it on again any time.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <h3 id="spr-ton">{t('Tone|saying')}</h3>
  <div data-spruch-tones>
    <Seg options={toneOptions} value={row.ton} labelledby="spr-ton" chips full={false} onchange={(k) => save(setTon(rec, k))} />
  </div>
  <p class="hint">{t('A challenge only comes when your sleep and resting pulse are in your normal. With «Mix» the tone changes by itself.')}</p>

  <h3>{t('Where the sayings come from')}</h3>
  {#each SOURCES as src (src)}
    <section class="src" data-spruch-source={src}>
      <label class="head">
        <input type="checkbox" role="switch" checked={!row.offSrc.includes(src)} onchange={(e) => save(setSource(rec, src, e.currentTarget.checked))} data-spruch-src-switch={src} />
        <span class="nm">{t(SOURCE_NAME[src])}</span>
      </label>
      {#if src === 'quote'}
        <p class="hint">{t('The quotes themselves you choose under «Cushion time».')}</p>
      {:else}
        <ul>
          {#each byTemplate(src) as x (x.id)}
            <li>
              <label>
                <input type="checkbox" role="switch" checked={!row.off.includes(x.id)} disabled={row.offSrc.includes(src)} onchange={(e) => save(setTemplate(rec, x.id, e.currentTarget.checked))} data-spruch-template={x.id} />
                <span class="nm">{t(ABOUT[x.id])}<small>{t(TONE_NAME[x.ton])}{fitsNow.has(x.id) ? ` · ${t('fits today|saying')}` : ''}</small></span>
              </label>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/each}

  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={() => dialog.close()} data-spruch-done>{t('Done|customise')}</button>
  </div>
</dialog>

<style>
  h3 {
    margin: 14px 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0 0 0 18px;
  }
  li {
    border-top: 1px solid var(--line);
  }
  .src {
    border-top: 1px solid var(--line);
    padding: 2px 0 6px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    cursor: pointer;
  }
  .head .nm {
    font-weight: 600;
  }
  .nm {
    flex: 1 1 8rem;
    min-width: 0;
    overflow-wrap: break-word;
  }
  small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .hint {
    margin: 8px 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  input:disabled + .nm {
    opacity: 0.55;
  }
</style>
