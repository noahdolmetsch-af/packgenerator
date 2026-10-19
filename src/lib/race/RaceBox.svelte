<script>
  /**
   * Paket U «Rennen»: one function of the race pages as a box. Every function says what it does, what it
   * is good for and where its data comes from (Noah 19.10.2026 «alle mit erklärungen für den nutzer»):
   * the ⓘ button opens those three lines. what / why / from: English keys for t(). id: data-race-box.
   */
  import { Info, EyeOff, Power, Eye } from '@lucide/svelte';
  import { viewQ, setBox, stateOf } from './view.js';
  import { CASES_OF } from './overview.js';
  import { deleteWithUndo } from '../ui/ask.js';
  import { t, tn } from '../i18n.svelte.js';

  let { id, title, what = '', why = '', from = '', soft = false, children, actions } = $props();
  let open = $state(false);
  // one of the 40 functions: it can be hidden (one line) or switched off (Noah 19.10.2026 17:39)
  const cases = $derived(CASES_OF[id] ?? []);
  const st = $derived(cases.length ? stateOf($viewQ, id) : 'shown');
  const off = () => deleteWithUndo({ run: () => setBox(id, 'off'), undo: () => setBox(id, 'shown'), text: t('«{name}» is off. Switch it on again under Plan › All 40 functions.', { name: title }), name: title });
</script>

{#if st === 'off'}
  <!-- switched off: gone until you switch it on in Plan › All 40 functions -->
{:else if st === 'hidden'}
  <section class="rc-box rc-stub" data-race-box={id} data-race-hidden>
    <span class="rc-note">{t('«{name}» is hidden.', { name: title })}</span>
    <button type="button" class="btn sm" onclick={() => setBox(id, 'shown')} data-race-show={id}><Eye size={16} aria-hidden="true" />{t('Show')}</button>
  </section>
{:else}

<section class="rc-box" class:rc-soft={soft} aria-labelledby="rcb-{id}" data-race-box={id}>
  <div class="rc-head">
    <h2 id="rcb-{id}" class="rc-h2">{title}</h2>
    {@render actions?.()}
    <button type="button" class="rc-icon" aria-expanded={open} aria-label={t('What is «{name}»?', { name: title })} onclick={() => (open = !open)} data-race-info={id}><Info size={18} aria-hidden="true" /></button>
  </div>
  {#if open}
    <div class="rc-info" data-race-explain={id}>
      {#if what}<p><b>{t('What it does')}:</b> {t(what)}</p>{/if}
      {#if why}<p><b>{t('Good for')}:</b> {t(why)}</p>{/if}
      {#if from}<p><b>{t('Where the data comes from')}:</b> {t(from)}</p>{/if}
      {#if cases.length}
        <p class="rc-note">{tn(cases.length, 'Idea {list} of the 40', 'Ideas {list} of the 40', { list: cases.join(', ') })}</p>
        <div class="rc-acts">
          <button type="button" class="btn sm" onclick={() => setBox(id, 'hidden')} data-race-hide={id}><EyeOff size={16} aria-hidden="true" />{t('Hide|box')}</button>
          <button type="button" class="btn sm" onclick={off} data-race-off={id}><Power size={16} aria-hidden="true" />{t('Switch off')}</button>
        </div>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</section>
{/if}
