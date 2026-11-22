<script>
  /**
   * «All sayings» (Noah 07.11.2026 «bau spruch pr3 und 4»): the window behind the tile «Saying» on Today. The tone
   * (mix or one tone), a switch for each source and a switch for each sentence (both wordings go together). Every change
   * is saved at once in the row of the tile (spruch.js SPRUCH_KEY); closing offers Undo for the whole change. Nothing is
   * deleted. The sentences are fixed text, the quotes themselves are chosen under «Cushion time».
   * PR 4: your own sayings: write, change (text and tone), switch off and delete (with Undo), up to 40.
   */
  import { X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import Seg from '../ui/Seg.svelte';
  import { t } from '../i18n.svelte.js';
  import { SPRUCH_KEY, OWN_KEY, OWN_MAX, OWN_LEN, TEMPLATES, ABOUT, SOURCES, SOURCE_NAME, TONES, TONE_NAME, TONE_CHOICES, baseId, fitting, spruchOf, setTon, setSource, setTemplate, addOwn, editOwn, dropOwn } from './spruch.js';
  import '../bikes/velo-dlg.css';

  /** rec: the stored row of the tile; ctx: what the sentences need today (to mark «fits today»). */
  let { rec = null, ctx, onclose } = $props();

  const row = $derived(spruchOf(rec));
  const fitsNow = $derived(new Set(fitting(ctx, {}).map((x) => baseId(x.id))));
  const toneOptions = $derived(TONE_CHOICES.map((k) => ({ key: k, name: k === 'mix' ? t('Mix|saying') : t(TONE_NAME[k]) })));
  const byTemplate = (src) => TEMPLATES.filter((x) => x.src === src);
  // PR 4: your own sayings (from the tile's context, so a change shows at once)
  const own = $derived(ctx.own ?? []);
  const toneChips = $derived(TONES.map((k) => ({ key: k, name: t(TONE_NAME[k]) })));
  let add = $state({ text: '', ton: 'mot' });
  let edit = $state(null); // { id, text, ton } while one saying is changed
  let ownChanged = false;
  const short = (x) => (x.length > 40 ? `${x.slice(0, 40)}…` : x);

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
    onclose?.({ changed: changed || ownChanged });
  };

  function saveOwn(items) {
    ownChanged = true;
    return db.settings.put({ key: OWN_KEY, value: { items: $state.snapshot(items) } });
  }
  async function addNew() {
    const text = add.text.trim();
    if (!text || own.length >= OWN_MAX) return;
    const was = own;
    await saveOwn(addOwn(was, text, add.ton));
    add.text = '';
    offerDone(t('Saying added.'), () => saveOwn(was));
  }
  async function saveEdit() {
    const e = edit;
    if (!e || !e.text.trim()) return;
    const was = own;
    await saveOwn(editOwn(was, e.id, { text: e.text, ton: e.ton }));
    edit = null;
    offerDone(t('Saying saved.'), () => saveOwn(was));
  }
  async function removeOwn(o) {
    const answer = await askDelete({ title: t('Delete this saying?'), text: t('It is gone from your list. Right after, you can bring it back.'), lines: [o.text] });
    if (answer !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const was = own;
        await saveOwn(dropOwn(was, o.id));
        return was;
      },
      undo: (was) => saveOwn(was),
      text: t('Saying deleted.'),
      name: short(o.text),
    });
  }
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

  <h3>{t('Own sayings')}</h3>
  <section class="src" data-spruch-source="own">
    <label class="head">
      <input type="checkbox" role="switch" checked={!row.offSrc.includes('own')} onchange={(e) => save(setSource(rec, 'own', e.currentTarget.checked))} data-spruch-src-switch="own" />
      <span class="nm">{t(SOURCE_NAME.own)}</span>
    </label>
    <p class="hint">{t('Write your own sayings. They come with the others, in the tone you choose. They stay on this device and in your backup.')}</p>
    {#if own.length}
      <ul data-spruch-own>
        {#each own as o (o.id)}
          <li>
            {#if edit?.id === o.id}
              {@render editor(edit, saveEdit, () => (edit = null), t('Save|saying'))}
            {:else}
              <label>
                <input type="checkbox" role="switch" checked={!row.off.includes(`o.${o.id}`)} disabled={row.offSrc.includes('own')} onchange={(e) => save(setTemplate(rec, `o.${o.id}`, e.currentTarget.checked))} data-spruch-own-switch={o.id} />
                <span class="nm" lang="">{o.text}<small>{t(TONE_NAME[o.ton])}</small></span>
              </label>
              <span class="rowbtns">
                <button type="button" class="link" onclick={() => (edit = { id: o.id, text: o.text, ton: o.ton })} data-spruch-own-edit={o.id}>{t('Edit|saying')}</button>
                <button type="button" class="link" onclick={() => removeOwn(o)} data-spruch-own-delete={o.id}>{t('Delete|saying')}</button>
              </span>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="hint" data-spruch-own-empty>{t('No own sayings yet. Write one below: it comes with the others.')}</p>
    {/if}
    {#if own.length < OWN_MAX}
      <div class="addbox" data-spruch-own-add>
        {@render editor(add, addNew, null, t('Add'))}
      </div>
    {:else}
      <p class="hint">{t('That is the most: {n} own sayings. Delete one to write another.', { n: OWN_MAX })}</p>
    {/if}
  </section>

  <h3>{t('Where the sayings come from')}</h3>
  {#each SOURCES.filter((x) => x !== 'own') as src (src)}
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

{#snippet editor(d, onsave, oncancel, label)}
  <form class="ed" onsubmit={(e) => (e.preventDefault(), onsave())}>
    <input type="text" class="own-in" maxlength={OWN_LEN} bind:value={d.text} placeholder={t('Write a saying …')} aria-label={t('Your saying|saying')} data-spruch-own-text />
    <Seg options={toneChips} value={d.ton} label={t('Tone|saying')} chips full={false} onchange={(k) => (d.ton = k)} />
    <span class="rowbtns">
      <button type="submit" class="btn hi sm" disabled={!d.text.trim()} data-spruch-own-save>{label}</button>
      {#if oncancel}<button type="button" class="btn sm" onclick={oncancel}>{t('Cancel')}</button>{/if}
    </span>
  </form>
{/snippet}

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
  .rowbtns {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    margin: 0 0 6px 36px;
  }
  .rowbtns .link {
    border: 0;
    background: none;
    padding: 0;
    min-height: 44px;
    color: var(--accent);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .ed {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
  }
  .own-in {
    width: 100%;
    box-sizing: border-box;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .addbox {
    border-top: 1px solid var(--line);
    margin-top: 6px;
  }
  .addbox .rowbtns {
    margin-left: 0;
  }
</style>
