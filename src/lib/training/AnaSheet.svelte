<script>
  /**
   * TR7c/TR7g «Analysen anpassen»: every analysis of the groups asked for with a switch, «Fertig» and
   * «Wie am Anfang». Hidden ones stay here and come back with one tap. Mounted once per page; it opens
   * when ana.sheet holds groups (openAnaSheet).
   */
  import { backClose } from '../ui/backclose.js';
  import { ana, showAna, resetAna } from './analyses.svelte.js';
  import { ANALYSES, GROUP_NAMES } from './analyses.js';
  import { t } from '../i18n.svelte.js';

  let dialog = $state();
  const groups = $derived(ana.sheet ?? []);
  $effect(() => {
    if (ana.sheet && dialog && !dialog.open) dialog.showModal();
    if (!ana.sheet && dialog?.open) dialog.close();
  });
  const close = () => (ana.sheet = null);
</script>

<dialog class="sheet anas" bind:this={dialog} use:backClose onclose={close} aria-labelledby="anas-h" data-ana-sheet>
  <div class="hd">
    <h2 id="anas-h" class="title">{t('Adjust analyses')}</h2>
    <p class="muted">{t('applies to all activities')}</p>
  </div>
  {#each groups as g (g)}
    {#if groups.length > 1}<h3 class="gh">{t(GROUP_NAMES[g])}</h3>{/if}
    <ul class="rows">
      {#each ANALYSES[g] as a (a.key)}
        {@const on = !ana.hidden.includes(a.key)}
        <li>
          <span class="m"><b>{t(a.title)}</b><small>{t(a.sub)}</small></span>
          <button type="button" class="switch" role="switch" aria-checked={on} aria-label={t('Show {field}', { field: t(a.title) })} data-ana-switch={a.key} onclick={() => showAna(a.key, !on)}><span class="knob"></span></button>
        </li>
      {/each}
    </ul>
  {/each}
  <p class="muted note">{t('Everything stays a suggestion. Hidden ones stay here and come back with one tap.')}</p>
  <div class="acts">
    <button type="button" class="btn hi" onclick={close}>{t('Done|ana')}</button>
    <button type="button" class="btn" onclick={() => resetAna(groups)}>{t('As at the start')}</button>
  </div>
</dialog>

<style>
  .anas {
    max-width: 520px;
  }
  .hd {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 12px;
  }
  h2,
  p {
    margin: 0;
  }
  .gh {
    margin: 16px 0 0;
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .rows {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .m {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .m small {
    color: var(--ink-3);
  }
  .note {
    margin-top: 12px;
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
  }
  .switch {
    position: relative;
    flex: none;
    width: 52px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .switch::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 26px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--line);
  }
  .switch .knob {
    position: absolute;
    top: 50%;
    left: 7px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--input);
    box-shadow: 0 1px 2px var(--shadow);
  }
  .switch[aria-checked='true']::before {
    background: var(--hi);
  }
  .switch[aria-checked='true'] .knob {
    left: 25px;
  }
</style>
