<script>
  /**
   * «Adjust the examples» (Noah 23.11.2026 «1-5a», V1): the choice of the interests that used to stand in the first
   * start window. Me › Data and backup opens it; it only ADDS what is missing (an example that is already there is
   * shown as «Already in» and is never written over), «Remove the examples» takes them away again.
   */
  import { Check, Circle } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { settling } from '../settled.js';
  import { tidyData } from '../tidy.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { addExamples, INTERESTS, interestsPresent, examplesLeft } from '../firststart.js';
  import '../bikes/velo-dlg.css';

  let open = $state(false);
  let dialog = $state();
  let busy = $state(false);
  let present = $state([]);
  let picked = $state([]);

  $effect(() => {
    if (open && dialog && !dialog.open) dialog.showModal();
  });

  /** Opens the window: what is there stays, what is missing is ticked as a suggestion. */
  export async function show() {
    present = interestsPresent(await examplesLeft(db));
    picked = INTERESTS.map((x) => x.key).filter((k) => !present.includes(k));
    open = true;
  }
  const flip = (k) => (picked = picked.includes(k) ? picked.filter((x) => x !== k) : [...picked, k]);

  async function go() {
    busy = true;
    try {
      await settling(async () => {
        await addExamples(db, localDay(), { interests: $state.snapshot(picked) });
        await tidyData(db);
      });
      dialog?.close();
      offerDone(t('The examples you chose are in. Me › Data and backup › «Remove the examples» takes them away again.'), null, 8000);
    } catch (err) {
      console.error(err);
      offerDone(t("That didn't work. Nothing was changed. Try again."));
    } finally {
      busy = false;
    }
  }
</script>

{#if open}
  <dialog class="sheet vdlg" bind:this={dialog} use:backClose onclose={() => (open = false)} aria-labelledby="ae-h" data-testid="adjust-examples">
    <div class="vd-head">
      <div class="vd-t">
        <h2 id="ae-h">{t('Adjust the examples')}</h2>
        <p class="vd-sub">{t('Which examples fit you? A few that fit are better than a full app. You can get the rest later.')}</p>
      </div>
    </div>
    <div class="opts" role="group" aria-label={t('Your interests')}>
      {#each INTERESTS as x (x.key)}
        {@const there = present.includes(x.key)}
        <button type="button" class="opt" aria-pressed={there || picked.includes(x.key)} disabled={there} onclick={() => flip(x.key)} data-interest={x.key}>
          <span class="ic" aria-hidden="true">{#if there || picked.includes(x.key)}<Check size={18} />{:else}<Circle size={18} />{/if}</span>
          <span class="tx"><b>{t(x.name)}</b><small>{there ? t('Already in') : t(x.sub)}</small></span>
        </button>
      {/each}
    </div>
    <div class="foot">
      <button type="button" class="btn" disabled={busy} onclick={() => dialog?.close()} data-choice="cancel">{t('Cancel')}</button>
      <button type="button" class="btn hi" disabled={busy || !picked.length} onclick={go} data-choice="examples-go">{t('Put the examples in')}</button>
    </div>
  </dialog>
{/if}

<style>
  .opts {
    display: grid;
    gap: 10px;
  }
  .opt {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    text-align: left;
    padding: 12px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .opt[aria-pressed='true'] {
    border-color: var(--hi);
  }
  .opt:disabled {
    cursor: default;
    opacity: 0.75;
  }
  .ic {
    flex: none;
    color: var(--hi);
    padding-top: 2px;
  }
  .tx {
    display: grid;
    gap: 2px;
  }
  .opt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .foot {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
</style>
