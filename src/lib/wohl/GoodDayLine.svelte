<script>
  /**
   * Paket P4 «Aktiv», mockup E4 (Noah 21.10.2026 «alle offenen Mockups freigegeben»): in the evening review,
   * above «Fertig»: «Schöner Tag? Diesen Tag merken» keeps the day as a recipe for «Das tut mir gut»
   * (Ich › Was mir gut tut). In the morning check a kept day planned for today shows as a reminder.
   * part: 'evening' | 'morning'. Rules: lib/gutertag.js.
   */
  import { liveQuery } from 'dexie';
  import { Sparkles, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { GOOD_DAYS_KEY, goodDaysOf, rememberDay, dueToday, shortVersion } from '../gutertag.js';
  import { saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { part = 'evening', today } = $props();

  const q = liveQuery(() => db.settings.get(GOOD_DAYS_KEY));
  const list = $derived(goodDaysOf($q?.value));
  const kept = $derived(list.find((x) => x.day === today) ?? null);
  const due = $derived(dueToday(list, today));
  let text = $state(null); // the open field
  const save = (value) => db.settings.put({ key: GOOD_DAYS_KEY, value: JSON.parse(JSON.stringify(value)) });

  async function keep(e) {
    e.preventDefault();
    if (!text?.trim()) return;
    const before = $q?.value ?? [];
    try {
      await save(rememberDay(before, { day: today, text }));
      text = null;
      offerDone(t('Day kept as a recipe in «What does me good».'), () => save(before));
    } catch (err) {
      saveFailed(err);
    }
  }
</script>

{#if part === 'evening'}
  <div class="gd" data-good-day>
    {#if text !== null}
      <form class="gd-form" onsubmit={keep}>
        <label for="gd-text"><b>{t('What made it a good day?')}</b></label>
        <input id="gd-text" class="inp" maxlength="200" bind:value={text} placeholder={t('e.g. quiet morning, outside in the afternoon, friends in the evening')} data-good-day-text />
        <span class="gd-acts">
          <button type="submit" class="btn hi sm" disabled={!text.trim()} data-good-day-save>{t('Keep the day')}</button>
          <button type="button" class="btn sm" onclick={() => (text = null)}>{t('Cancel')}</button>
        </span>
      </form>
    {:else if kept}
      <p class="gd-line" data-good-day-kept><Check size={16} aria-hidden="true" /><span>{t('Kept: «{text}»', { text: kept.text })}</span><button type="button" class="tp-link gd-link" onclick={() => (text = kept.text)}>{t('Change')}</button></p>
    {:else}
      <p class="gd-line"><Sparkles size={16} aria-hidden="true" /><span>{t('A good day? Keep it as a recipe in «What does me good».')}</span><button type="button" class="btn sm" onclick={() => (text = '')} data-good-day-open>{t('Keep this day')}</button></p>
    {/if}
  </div>
{:else if due.length}
  <div class="gd" data-good-day-due>
    {#each due as d (d.id)}
      <p class="gd-line"><Sparkles size={16} aria-hidden="true" /><span>{t('Today again: «{text}»', { text: d.text })}{#if shortVersion(d.text)}{' · '}{t('short version: {text}', { text: shortVersion(d.text) })}{/if}</span></p>
    {/each}
  </div>
{/if}

<style>
  .gd {
    margin: 0 0 12px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
  }
  .gd-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0;
    overflow-wrap: break-word;
  }
  .gd-line span {
    flex: 1 1 12em;
    min-width: 0;
  }
  .gd-line .btn,
  .gd-link {
    min-height: 44px;
  }
  .gd-form {
    display: grid;
    gap: 8px;
  }
  .gd-form .inp {
    min-height: 44px;
  }
  .gd-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .gd-acts .btn {
    min-height: 44px;
  }
</style>
