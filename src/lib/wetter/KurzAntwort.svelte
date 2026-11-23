<script>
  /**
   * «Die Kurzantwort» (Wetterseite aufräumen, Noah 23.11.2026 «ja»): the first thing on the part «Jetzt» of the weather
   * page, one short answer to «What is it like today?»: «Today: rain from 07:00, 3–5 °C. Take rain gear.»
   * The rain time is the one of the whole page (wetter/regenzeit.js). Under it everything stays as it was.
   * story: from rainStory; line: dayLine of the rest of today; hints: the keys of packHints for the rest of today.
   */
  import { CloudRain, Sun } from '@lucide/svelte';
  import { rainWords } from './regenzeit.js';
  import { t, num } from '../i18n.svelte.js';

  let { story = null, line = null, hints = [], hm = (ms) => String(ms) } = $props();

  const rainy = $derived(!!story && story.kind !== 'dry');
  const head = $derived(line ? `${t('Today')}: ${rainWords(story, t, hm) || t('dry')}, ${num(line.tmin)}–${num(line.tmax)} °C.` : '');
  const gear = $derived.by(() => {
    const out = [];
    if (rainy) out.push(t('Take rain gear.'));
    if (hints.includes('windjacket')) out.push(t('Windy: take a wind jacket.'));
    if (hints.includes('overshoes') || hints.includes('longgloves')) out.push(t('Cold: dress warm.'));
    if (hints.includes('water')) out.push(t('Hot: take water.'));
    return out.slice(0, 2).join(' ');
  });
</script>

{#if line}
  <p class="ka card" data-wx-answer data-wx-answer-rain={rainy ? 'yes' : 'no'} role="status">
    {#if rainy}<CloudRain size={20} aria-hidden="true" />{:else}<Sun size={20} aria-hidden="true" />{/if}
    <span><b>{head}</b>{#if gear}{' '}{gear}{/if}</span>
  </p>
{/if}

<style>
  .ka {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    margin: 0;
    padding: 12px;
    font-size: var(--fs-body);
  }
  .ka :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
