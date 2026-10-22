<script>
  /**
   * P6 «Heute ergänzen», SN2l (Noah 21.10.2026 «2b»): «Weight this week?» on Heute, a calm card under the
   * greeting while no weight was typed for 7 days (weighin.js). The weight goes where Ich › Gewicht keeps it.
   * «Not today» until tomorrow; «Stop asking» takes the tile away (back via «Add a tile»). Never a must.
   */
  import { liveQuery } from 'dexie';
  import { Scale } from '@lucide/svelte';
  import { db } from '../db.js';
  import { weight, saveWeight } from '../weight.svelte.js';
  import { cleanKg, latestOf } from '../weight.js';
  import { WEIGH_KEY, notToday } from './weighin.js';
  import TileHead from './TileHead.svelte';
  import { t, num, locale } from '../i18n.svelte.js';

  let { today, isnew = false, onstop = () => {}, onsaved = () => {} } = $props();
  const last = $derived(latestOf(weight.entries));
  let kg = $state('');
  let saved = $state(null);
  const val = $derived(cleanKg(kg));
  const dayText = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  async function save(e) {
    e.preventDefault();
    if (val == null) return;
    await saveWeight(today, val);
    saved = val;
    onsaved();
  }
  const later = () => db.settings.put({ key: WEIGH_KEY, value: notToday(today) });
</script>

<section class="wg surf" aria-labelledby="wg-h" data-section="weighin">
  <TileHead icon={Scale} id="wg-h" title={t('Weight this week?')} {isnew} />
  {#if saved != null}
    <p class="ok" role="status" data-weigh-saved>{t('Saved: {kg} kg. Your weight is under Me › Weight.', { kg: num(saved) })}</p>
  {:else}
    <form onsubmit={save}>
      <!-- one row on the phone too: the field, «Save», «Not today»; the rest in one small line (Heute stays short) -->
      <div class="row">
        <label class="fld">
          <span class="sr">{t('Weight in kg')}</span>
          <input type="text" inputmode="decimal" placeholder={last ? num(last.kg) : '72.0'} bind:value={kg} data-weigh-kg />
          <span class="u">kg</span>
        </label>
        <button type="submit" class="btn sm hi" disabled={val == null} data-weigh-save>{t('Save')}</button>
        <button type="button" class="btn sm" onclick={later} data-weigh-later>{t('Not today')}</button>
      </div>
      <p class="more">{#if last}<span class="num">{t('last {kg} kg on {day}', { kg: num(last.kg), day: dayText(last.day) })}</span>{' · '}{/if}<a href="#/me/weight">{t('History under Me › Weight')}</a> · <button type="button" class="lk" onclick={onstop} data-weigh-stop>{t('Stop asking')}</button></p>
    </form>
  {/if}
</section>

<style>
  .wg {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 18px 4px;
    box-sizing: border-box;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .fld {
    display: flex;
    flex: 0 1 104px;
    align-items: center;
    gap: 6px;
    min-width: 88px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .fld input {
    flex: 1;
    min-width: 0;
    min-height: 42px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
  }
  .u,
  .more,
  .ok {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ok {
    color: var(--ink-2);
    padding-bottom: 8px;
  }
  .more a,
  .lk {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--hi);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
</style>
