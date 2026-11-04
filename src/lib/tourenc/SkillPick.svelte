<script>
  /**
   * «What did you practise?» (Noah 04.11.2026 «4a», Persönliches Lernen Idee 3): on the debrief you tick the riding
   * techniques you worked on and say how it went. A tap on a chip ticks it, another tap takes it away; under a ticked
   * one «Went well» / «Still unsure» (the same again goes back). The techniques are a list you change (Me › Lists
   * and types). All optional. d: the debrief (reads d.skills); onchange(skills | null): the caller stores it.
   */
  import { liveQuery } from 'dexie';
  import { Bike } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { skillsOf, skillToggle, skillSay, techName, techOffered, wanted, TECH_KEY } from '../technik.js';

  let { d, onchange } = $props();
  const mine = $derived(skillsOf(d));
  const recQ = liveQuery(() => db.settings.get(TECH_KEY));
  const want = $derived(new Set(wanted($recQ?.value)));
  const list = $derived.by(() => {
    const all = techOffered(Object.keys(mine));
    return [...all.filter((e) => want.has(e.id)), ...all.filter((e) => !want.has(e.id))];
  });
</script>

<section class="rv-sec skl" aria-labelledby="skl-h" data-debrief-skills>
  <div class="rv-h"><div><h2 id="skl-h"><Bike size={18} aria-hidden="true" />{t('What did you practise?')}</h2><p class="rv-sub">{t('Tick the riding techniques you worked on. All optional.')}</p></div></div>
  <div class="rv-box pad sk">
    <div class="chips" role="group" aria-labelledby="skl-h">
      {#each list as e (e.id)}
        <button type="button" class="chip" aria-pressed={e.id in mine} onclick={() => onchange(skillToggle(d, e.id))} data-skill={e.id}>{techName(e.id, t)}{#if want.has(e.id)}<span class="wish">· {t('you wanted this')}</span>{/if}</button>
      {/each}
    </div>
    {#each Object.keys(mine) as id (id)}
      <div class="say" role="group" aria-label={techName(id, t)} data-skill-say={id}>
        <b>{techName(id, t)}</b>
        <button type="button" class="chip" aria-pressed={mine[id] === 'good'} onclick={() => onchange(skillSay(d, id, 'good'))} data-skill-kind="good">{t('Went well|technique')}</button>
        <button type="button" class="chip" aria-pressed={mine[id] === 'unsure'} onclick={() => onchange(skillSay(d, id, 'unsure'))} data-skill-kind="unsure">{t('Still unsure')}</button>
      </div>
    {/each}
    <p class="lk"><a href="#/debrief/technik">{t('Your riding technique diary')}</a> · <a href="#/me/lists">{t('Change the techniques: Me › Lists and types')}</a></p>
  </div>
</section>

<style>
  h2 { display: flex; align-items: center; gap: 8px; }
  .sk { display: grid; gap: 12px; min-width: 0; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { min-height: 44px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  .chip[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .wish { margin-left: 6px; font-size: var(--fs-small); opacity: 0.85; }
  .say { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .say b { flex: 1 1 100%; }
  .lk { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .lk a { display: inline-block; min-height: 44px; line-height: 44px; }
</style>
