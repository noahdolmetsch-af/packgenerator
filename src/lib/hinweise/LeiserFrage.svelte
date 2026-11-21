<script>
  /**
   * «Hinweise lernen aus dem Wegtippen» (S5, Noah 21.11.2026 «4a»): under a hint that was sent away with «Not today» on
   * three days, one calm question: make this kind quieter? «Yes» switches it off (Undo for 4 s, and the text says where
   * it comes back), «Keep» is remembered. Nothing is ever switched off without this tap. Rules: leiser.js.
   * Place it where the hint stands; it shows only on the day of the last «Not today».
   */
  import { liveQuery } from 'dexie';
  import { Volume1 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { setArea } from '../clear/suggest.svelte.js';
  import { SKIPS_KEY, HINT_KINDS, askDue, skippedDays, keepAsIs, clearKind } from './leiser.js';
  import { t, tn } from '../i18n.svelte.js';

  let { kind, today } = $props();
  const q = liveQuery(() => db.settings.get(SKIPS_KEY));
  const info = $derived(HINT_KINDS[kind]);
  const due = $derived(!!info && askDue($q?.value, kind, today));
  const n = $derived(skippedDays($q?.value, kind, today));

  const setOn = (on) => (info.area ? setArea(info.area, on) : db.settings.put({ key: info.setting, value: on }));
  async function quieter() {
    const state = $q?.value;
    await setOn(false);
    await putSetting(db, SKIPS_KEY, clearKind(state, kind));
    offerDone(t('Switched off: {name}. It comes back under {where}.', { name: t(info.label), where: t(info.back) }), async () => {
      await setOn(true);
    });
  }
  const keep = () => putSetting(db, SKIPS_KEY, keepAsIs($q?.value, kind, today));
</script>

{#if due}
  <section class="lq" data-leiser={kind} aria-label={t('Make this hint quieter?')}>
    <Volume1 size={18} aria-hidden="true" />
    <div class="tx">
      <b>{t('Make this hint quieter?')}</b>
      <span>{tn(n, 'You sent «{name}» away on one day.', 'You sent «{name}» away on {n} different days.', { name: t(info.label) })}</span>
      <span class="acts">
        <button type="button" class="btn sm hi" onclick={quieter} data-leiser-yes>{t('Yes, quieter')}</button>
        <button type="button" class="btn sm" onclick={keep} data-leiser-keep>{t('Keep it')}</button>
      </span>
      <small>{t('You can switch it on again under {where}.', { where: t(info.back) })}</small>
    </div>
  </section>
{/if}

<style>
  .lq {
    flex: 1 1 100%;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .lq > :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .tx {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  small {
    color: var(--muted, var(--ink-2));
  }
</style>
