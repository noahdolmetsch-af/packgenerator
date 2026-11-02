<script>
  /**
   * «Meilensteine aktiver machen» PR 3 (Noah «3a»): the tone of the words around stars and reminders: Off · Calm · Funny.
   * A small switch used in the star window and on a sport page.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { TONE_KEY, toneOf } from './tone.js';
  import { t } from '../i18n.svelte.js';

  const q = $derived(liveQuery(() => db.settings.get(TONE_KEY)));
  const tone = $derived(toneOf($q?.value));
  const opts = $derived([
    ['off', t('Off|tone')],
    ['calm', t('Calm|tone')],
    ['funny', t('Funny|tone')],
  ]);
</script>

<div class="tn" data-tone-setting role="group" aria-label={t('Tone of the app')}>
  <span class="tnl">{t('Tone of the app')}</span>
  <div class="seg">
    {#each opts as [id, label] (id)}
      <button type="button" class="o" class:on={tone === id} aria-pressed={tone === id} data-tone={id} onclick={() => putSetting(db, TONE_KEY, { tone: id })}>{label}</button>
    {/each}
  </div>
</div>

<style>
  .tn {
    display: grid;
    gap: 6px;
    justify-items: center;
  }
  .tnl {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--line);
    border-radius: 999px;
    overflow: hidden;
  }
  .o {
    min-height: 40px;
    padding: 0 14px;
    border: 0;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
  }
  .o.on {
    background: var(--ink);
    color: var(--paper);
  }
</style>
