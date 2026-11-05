<script>
  /**
   * «Schneefallgrenze» on the weather page (Noah 04.11.2026 «3a 4a 5a»): in the card «Today» one line with the
   * snow line now (m above sea level) and its low and high over the day, six times from 6 to 21 h, a hint when
   * the line is down to your own height, and two settings (your height, the line on Today). Nothing shows
   * without a value. Kept answers are shown as they are (the page says «As of …»).
   * wetter-seite mounts it with one line.
   */
  import { liveQuery } from 'dexie';
  import { Snowflake, TriangleAlert } from '@lucide/svelte';
  import { db } from '../db.js';
  import { lineNow, lineRange, lineSlots, allApprox, ownHeight, lowHint, OWN_KEY, HOME_KEY, BELOW_FREEZING_M } from './schneegrenze.js';
  import { t, num } from '../i18n.svelte.js';

  let { core, now = Date.now() } = $props();
  const ownQ = liveQuery(() => db.settings.get(OWN_KEY));
  const homeQ = liveQuery(() => db.settings.get(HOME_KEY));

  const cur = $derived(lineNow(core, now));
  const range = $derived(lineRange(core, now));
  const slots = $derived(lineSlots(core, now));
  const own = $derived(ownHeight(core, $ownQ?.value));
  const hint = $derived(lowHint(core, now, own));
  const approx = $derived(allApprox([cur, ...slots].filter(Boolean)));
  const onHome = $derived($homeQ?.value !== false);

  let typed = $state('');
  let bad = $state(false);
  async function saveOwn(e) {
    e?.preventDefault();
    const raw = typed.trim();
    if (!raw) {
      await db.settings.delete(OWN_KEY); // empty: back to the height of the place
      bad = false;
      return;
    }
    const m = Number(raw.replace(',', '.'));
    if (!Number.isFinite(m) || m < 0 || m > 4800) return (bad = true);
    bad = false;
    await db.settings.put({ key: OWN_KEY, value: Math.round(m) });
    typed = '';
  }
  const toggleHome = (e) => db.settings.put({ key: HOME_KEY, value: e.currentTarget.checked });
</script>

{#if cur}
  <div class="sg" data-snowline>
    <p class="sg-main">
      <Snowflake size={18} aria-hidden="true" />
      <span><b data-snowline-now>{t('Snow line {m} m above sea level', { m: num(cur.m) })}</b>{#if range && range.min !== range.max}<small> · {t('today between {a} and {b} m', { a: num(range.min), b: num(range.max) })}</small>{/if}</span>
    </p>
    {#if hint}
      <p class="sg-hint" role="status" data-snowline-hint><TriangleAlert size={16} aria-hidden="true" />{t('Snow possible down to your height when it rains: the line goes down to {m} m, your place is at {own} m.', { m: num(hint.m), own: num(hint.ownM) })}</p>
    {/if}
    {#if slots.length}
      <ul class="sg-slots" aria-label={t('Snow line through the day')} data-snowline-slots>
        {#each slots as s (s.hour)}<li><span>{t('{h} h', { h: s.hour })}</span><b>{num(s.m)}</b><small>m</small></li>{/each}
      </ul>
    {/if}
    <p class="sg-src">{approx ? t('A guess: about {m} m below the freezing level. The same rule as on the map and for ski tours.', { m: BELOW_FREEZING_M }) : t('From Open-Meteo, where the weather model has it; otherwise about {m} m below the freezing level.', { m: BELOW_FREEZING_M })}</p>
    <details class="sg-set" data-snowline-set>
      <summary>{t('Set snow line')}</summary>
      <label class="sg-check"><input type="checkbox" checked={onHome} onchange={toggleHome} data-snowline-home />{t('Show the snow line on Today')}</label>
      <form class="sg-own" onsubmit={saveOwn}>
        <label for="sg-own">{t('Your height for the hint (m above sea level)')}</label>
        <div class="sg-row">
          <input id="sg-own" class="inp" inputmode="numeric" bind:value={typed} placeholder={own != null ? num(own) : ''} data-snowline-own />
          <button type="submit" class="btn sm">{t('Save')}</button>
        </div>
        <small class="sg-src">{$ownQ?.value != null ? t('Now: {m} m. Empty and save: back to the height of the place.', { m: num($ownQ.value) }) : t('Empty: the height of the place is used.')}</small>
        {#if bad}<small class="rc-warn" role="status">{t('Type a height between 0 and 4800 m.')}</small>{/if}
      </form>
    </details>
  </div>
{/if}

<style>
  .sg {
    display: grid;
    gap: 8px;
    margin: 12px 0 0;
  }
  .sg-main,
  .sg-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
  }
  .sg-main small {
    color: var(--ink-2);
  }
  .sg-hint {
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .sg-slots {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 4px;
    text-align: center;
  }
  .sg-slots li {
    display: grid;
    padding: 6px 2px;
    border-radius: 8px;
    background: var(--paper-2);
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  .sg-slots span,
  .sg-slots small,
  .sg-src {
    color: var(--ink-2);
  }
  .sg-src {
    margin: 0;
    font-size: var(--fs-small);
  }
  .sg-set summary {
    cursor: pointer;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .sg-set > * {
    margin-top: 8px;
  }
  .sg-check {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .sg-own {
    display: grid;
    gap: 4px;
  }
  .sg-row {
    display: flex;
    gap: 8px;
  }
  .sg-row .inp {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
