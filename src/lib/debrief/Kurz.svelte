<script>
  /**
   * «Rückblick in 30 Sekunden» (Noah 05.11.2026, Touren 3b): on the open debrief, above the long form. Three
   * questions with faces; «Fertig» saves like the long «Done» (the caller's finish). The long form below stays
   * as it is, and every answer here shows there too. Rules and mapping: kurz.js.
   * d: the debrief; items: gear not on the trip (to match a name); onfun(n), onamount(key), onmissing(list),
   * ondone(); busy while saving.
   */
  import { t } from '../i18n.svelte.js';
  import { joyOf } from '../freude.js';
  import { FUN_FACES, AMOUNT_FACES, addMissingName } from './kurz.js';
  import { Frown, Annoyed, Meh, Smile, Laugh, Timer, Plus, ArrowRight } from '@lucide/svelte';

  let { d, items = [], onfun, onamount, onmissing, ondone, busy = false } = $props();
  const ICON = { Frown, Annoyed, Meh, Smile, Laugh };
  const fun = $derived(joyOf(d).fun ?? null);
  let said = $state(null); // null: not answered, 'no' | 'yes'
  const yes = $derived(said === 'yes' || (said === null && d.missing.length > 0));
  let name = $state('');
  function add(e) {
    e.preventDefault();
    const list = addMissingName(d.missing, name, items);
    name = '';
    if (list) onmissing(list);
  }
</script>

<section class="rv-sec kurz" aria-labelledby="kurz-h" data-debrief-kurz>
  <div class="rv-h"><div><h2 id="kurz-h"><Timer size={18} aria-hidden="true" />{t('Debrief in 30 seconds')}</h2><p class="rv-sub">{t('Three questions for a tired evening. The long version is right below.')}</p></div></div>
  <div class="rv-box pad kz">
    <div class="q" role="group" aria-labelledby="kz-fun">
      <b id="kz-fun">{t('1. How was the ride?')}</b>
      <div class="faces five">
        {#each FUN_FACES as f (f.n)}
          {@const Icon = ICON[f.icon]}
          <button type="button" class="face" aria-pressed={fun === f.n} onclick={() => onfun(f.n)} data-kurz-fun={f.n}><Icon size={26} aria-hidden="true" /><span>{t(f.name)}</span></button>
        {/each}
      </div>
    </div>
    <div class="q" role="group" aria-labelledby="kz-amount">
      <b id="kz-amount">{t('2. Was the luggage right?')}</b>
      <div class="faces three">
        {#each AMOUNT_FACES as f (f.key)}
          {@const Icon = ICON[f.icon]}
          <button type="button" class="face" aria-pressed={d.amount === f.key} onclick={() => onamount(f.key)} data-kurz-amount={f.key}><Icon size={26} aria-hidden="true" /><span>{t(f.name)}</span></button>
        {/each}
      </div>
    </div>
    <div class="q" role="group" aria-labelledby="kz-miss">
      <b id="kz-miss">{t('3. Did you miss something?')}</b>
      <div class="faces two">
        <button type="button" class="face" aria-pressed={!yes && said === 'no'} onclick={() => (said = 'no')} data-kurz-miss="no"><Smile size={26} aria-hidden="true" /><span>{t('No, nothing')}</span></button>
        <button type="button" class="face" aria-pressed={yes} onclick={() => (said = 'yes')} data-kurz-miss="yes"><Meh size={26} aria-hidden="true" /><span>{t('Yes, something')}</span></button>
      </div>
      {#if yes}
        {#if d.missing.length}<p class="names">{d.missing.map((m) => m.name).join(', ')}</p>{/if}
        <form class="add" onsubmit={add}>
          <input class="inp" placeholder={t('What you missed, e.g. Headlamp')} bind:value={name} aria-label={t('What you missed')} data-kurz-name />
          <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
        </form>
      {/if}
    </div>
    <button type="button" class="btn hi done" disabled={busy} onclick={ondone} data-kurz-done>{t('Save the short version')}<ArrowRight size={20} aria-hidden="true" /></button>
    <p class="fine">{t('Everything else stays as planned. You can change it afterwards.')}</p>
  </div>
</section>

<style>
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .kz {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .q {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .faces {
    display: grid;
    gap: 6px;
  }
  .five {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .face {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 2px;
    min-height: 64px;
    min-width: 0;
    padding: 6px 2px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: center;
    overflow-wrap: break-word;
    cursor: pointer;
  }
  .face[aria-pressed='true'] {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--hi-ink);
  }
  .names,
  .fine {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .add {
    display: flex;
    gap: 8px;
  }
  .add .inp {
    flex: 1;
    min-width: 0;
  }
  .done {
    justify-self: start;
  }
</style>
