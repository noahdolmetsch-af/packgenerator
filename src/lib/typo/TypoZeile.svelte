<script>
  /**
   * «Tippfehler-Frage» (Warteliste 6; Noah 22.11.2026 «1a»): the quiet line under a number field. It shows after the field was left, when the
   * value looks unusual («Did you mean 70 kg?»): «Yes, 70 kg» puts the suggestion in, «It is right» keeps the value and the value is
   * not asked about again (setting typo.ok). Saving is never blocked. Rules: frage.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, num } from '../i18n.svelte.js';
  import { KINDS, OK_KEY, askTypo, askCounter, numberOf, okOf, withOk } from './frage.js';

  let { kind, text = '', own = [], last = null, shown = false, onuse = () => {} } = $props();
  // kind «counterKm»: the reading of a counter (km of a bike) is compared with the last reading (`last`)
  const okQ = liveQuery(() => db.settings.get(OK_KEY));
  const q = $derived(!shown ? null : kind === 'counterKm' ? askCounter({ value: numberOf(text), last, ok: okOf($okQ?.value) }) : askTypo({ kind, value: numberOf(text), own, ok: okOf($okQ?.value) }));
  const unit = $derived(t(kind === 'counterKm' ? 'km' : (KINDS[kind]?.unit ?? '')));
  const right = () => db.settings.put({ key: OK_KEY, value: withOk($okQ?.value, kind, q.value) });
</script>

{#if q}
  <p class="typo" aria-live="polite" data-typo-line>
    <span class="q" data-typo-text>{q.suggest != null ? t('Did you mean {value} {unit}?', { value: num(q.suggest), unit }) : t('{value} {unit} looks unusual. Is that right?', { value: num(q.value), unit })}</span>
    {#if q.suggest != null}<button type="button" class="tp-link" onclick={() => onuse(q.suggest)} data-typo-use>{t('Yes, {value} {unit}', { value: num(q.suggest), unit })}</button>{/if}
    <button type="button" class="tp-link" onclick={right} data-typo-right>{t('It is right')}</button>
  </p>
{/if}

<style>
  .typo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 14px;
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .typo .tp-link {
    min-height: 44px;
  }
</style>
