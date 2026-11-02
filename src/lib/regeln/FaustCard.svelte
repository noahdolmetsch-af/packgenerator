<script>
  /**
   * «Faustregeln aus deinen Rückblicken» (idea D2 «App denkt mit», Noah 02.11.2026 «3b»): on Me › How the app
   * decides. When your debriefs show that an own block was used only in some weather or on some trips, the
   * app suggests a rule for it. «Make it a rule» saves the rule of the block (Undo); «Not this one» stops
   * the suggestion for that block and value (Undo). Nothing happens by itself.
   */
  import { liveQuery } from 'dexie';
  import { Lightbulb, Check, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { SETS_KEY } from '../sets.js';
  import { setOwnRule, METRICS } from '../situation.js';
  import { ruleLine } from '../situationtext.js';
  import { editSets } from '../gear/assign.js';
  import { ruleSuggestions } from '../faustregel.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { saveFailed } from '../ui/ask.js';

  const DISMISS_KEY = 'rules.dismissed';
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const dismissQ = liveQuery(() => db.settings.get(DISMISS_KEY));
  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const itemsQ = liveQuery(() => db.items.toArray());
  const list = $derived(ruleSuggestions({ trips: $tripsQ ?? [], debriefs: $debriefsQ ?? [], items: $itemsQ ?? [], setsValue: $setsQ?.value ?? [], dismissed: $dismissQ?.value ?? [] }));

  async function accept(s) {
    try {
      const res = await editSets(db, (v) => ({ value: setOwnRule(v, s.key, { on: true, ...s.rule }) }));
      if (res.error) return saveFailed();
      offerDone(t('{block}: rule saved.', { block: s.name }), () => (res.snap.sets ? db.settings.put(res.snap.sets) : db.settings.delete(SETS_KEY)));
    } catch {
      saveFailed();
    }
  }
  async function dismiss(s) {
    const before = $dismissQ ?? null;
    await db.settings.put({ key: DISMISS_KEY, value: [...($dismissQ?.value ?? []), `${s.key}:${s.rule.metric}`] });
    offerDone(t('{block}: no more suggestions for this rule.', { block: s.name }), () => (before ? db.settings.put(before) : db.settings.delete(DISMISS_KEY)));
  }
</script>

<section class="card fr" aria-labelledby="fr-h" data-faust>
    <h2 id="fr-h"><Lightbulb size={18} aria-hidden="true" />{t('Rules of thumb from your debriefs')}</h2>
    <p class="quiet">{t('Your finished trips show a pattern. A rule is only a suggestion in Packen; you can change it any time on Blocks.')}</p>
    {#if !list.length}<p class="quiet" data-faust-none>{t('No pattern yet. With an own block and four finished trips, the app can suggest a rule here.')}</p>{/if}
    <ul>
      {#each list as s (s.key)}
        <li data-faust-row={s.key}>
          <span><b>{s.name}</b><small>{t('Used on {used} of {n} trips.', { used: s.used, n: s.n })} {t(METRICS[s.rule.metric].name)} {ruleLine(s.key, s.rule)}</small></span>
          <details class="parts" data-faust-parts>
            <summary>{t('{n} items in this block', { n: s.parts.length })}</summary>
            <ul>{#each s.parts as name}<li>{name}</li>{/each}</ul>
          </details>
          <p class="then" data-faust-then>{t('If you make it a rule: Packen puts all {n} items on the list when {rule}, and leaves them out otherwise. You can untick any item on a trip and change the rule any time on Blocks.', { n: s.parts.length, rule: `${t(METRICS[s.rule.metric].name)} ${ruleLine(s.key, s.rule)}` })}</p>
          <span class="acts">
            <button type="button" class="btn sm" onclick={() => accept(s)} data-faust-yes><Check size={14} aria-hidden="true" />{t('Make it a rule')}</button>
            <button type="button" class="btn sm quiet" onclick={() => dismiss(s)} data-faust-no><X size={14} aria-hidden="true" />{t('Not this one')}</button>
          </span>
        </li>
      {/each}
    </ul>
</section>

<style>
  .fr {
    margin: 0 0 14px;
    padding: 14px 16px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
    font-size: var(--fs-section);
  }
  .quiet {
    color: var(--ink-2);
    font-size: var(--fs-small);
    margin: 0 0 8px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: grid;
    gap: 8px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  li:first-child {
    border-top: 0;
  }
  small {
    display: block;
    color: var(--ink-2);
  }
  .parts summary {
    cursor: pointer;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .parts ul {
    margin: 6px 0 0;
    padding-left: 18px;
    list-style: disc;
  }
  .parts li {
    display: list-item;
    padding: 2px 0;
    border: 0;
  }
  .then {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .parts summary {
    cursor: pointer;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .parts ul {
    margin: 6px 0 0;
    padding-left: 18px;
    list-style: disc;
  }
  .parts li {
    display: list-item;
    padding: 2px 0;
    border: 0;
  }
  .then {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
