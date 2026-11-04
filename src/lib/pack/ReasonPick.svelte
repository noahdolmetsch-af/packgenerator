<script>
  /**
   * «Why was it different?» (Noah 04.11.2026 «2a», Persönliches Lernen Idee 4): one tap says why a tour went
   * differently from the plan: marked «Not riding» (Planen), or ridden km a quarter or more away from the planned
   * km (tour page). The reasons are an app list (Me › Lists and types: rename, add, hide). «Not now» puts the
   * question away for this change; a second tap on the chosen reason takes it away (with Undo). From three
   * answers on one calm line says what came up most often. Never required, never explained.
   * trip: the trip; kind: gruende.js kindOf (null: no card); km: the planned and ridden km for the sentence.
   */
  import { liveQuery } from 'dexie';
  import { HelpCircle } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, num } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { whyOf, whyChange, whySkip, reasonsOffered, reasonName, pattern, WHY_FIELD } from '../gruende.js';

  let { trip, kind = null, km = null } = $props();
  const why = $derived(whyOf(trip));
  const mine = $derived(why && why.kind === kind ? why : null);
  const answer = $derived(mine?.reason ?? null);
  const away = $derived(!!mine?.skip);
  let change = $state(false);
  const reasons = $derived(reasonsOffered(answer));
  const histQ = liveQuery(() => db.trips.toArray());
  const seen = $derived(pattern($histQ ?? []));
  const top = $derived(seen?.top[0] ?? null);

  async function pick(reason) {
    const before = trip[WHY_FIELD] ?? null;
    const removing = answer === reason;
    await db.trips.update(trip.id, touched(whyChange(trip, kind, reason)));
    change = false;
    if (removing) offerDone(t('Your answer was removed.'), () => db.trips.update(trip.id, touched({ [WHY_FIELD]: before })));
  }
  const later = () => db.trips.update(trip.id, touched(whySkip(kind)));
  const SAY = { skipped: 'Why are you not riding?', shorter: 'Why was it different?', longer: 'Why was it different?' };
</script>

{#if kind && !away}
  <section class="why card pad" aria-labelledby="why-h" data-change-why={kind}>
    <h2 id="why-h"><HelpCircle size={18} aria-hidden="true" />{answer && !change ? t('Noted: {reason}', { reason: reasonName(answer, t) }) : t(SAY[kind])}</h2>
    {#if km && !answer}<p class="ws">{t('You planned {a} km and rode {b} km.', { a: num(km.plan), b: num(km.real) })}</p>{/if}
    {#if !answer || change}
      <div class="chips" role="group" aria-labelledby="why-h">
        {#each reasons as r (r.id)}
          <button type="button" class="chip" aria-pressed={answer === r.id} onclick={() => pick(r.id)} data-why={r.id}>{reasonName(r.id, t)}</button>
        {/each}
      </div>
      <p class="ws">{t('One tap is enough, and you can skip it. Only on this device.')}</p>
    {/if}
    <div class="row">
      {#if answer}<button type="button" class="btn btn-link" aria-expanded={change} onclick={() => (change = !change)} data-why-change>{t('Change my answer')}</button>{:else}<button type="button" class="btn btn-link" onclick={later} data-why-later>{t('Not now')}</button>{/if}
      <a class="btn btn-link" href="#/me/lists">{t('Change the reasons: Me › Lists and types')}</a>
    </div>
    {#if top}<p class="ws" data-why-pattern>{t('Over {n} changes the reason was most often «{name}» ({count} times). This only counts what you noted.', { n: seen.n, name: reasonName(top.reason, t), count: top.count })}</p>{/if}
  </section>
{/if}

<style>
  .why { display: grid; gap: 8px; min-width: 0; margin-top: 16px; }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0; font: 600 var(--fs-sub) / 1.3 var(--font-body); }
  .ws { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { min-height: 44px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  .chip[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .row { display: flex; flex-wrap: wrap; gap: 4px 16px; }
  .row :global(.btn) { min-height: 44px; }
</style>
