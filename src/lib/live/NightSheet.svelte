<script>
  /**
   * «Nacht-Blatt» (Noah 02.11.2026 «1b»: only when you open it from the «⋯» menu): one calm page for the night
   * on the live map. Ride on or sleep (races: from your tiredness, the hours awake and the next bed), the bed
   * ahead, the last open shop, the stops of today and your three goals. Nothing here changes your ride.
   */
  import { Moon, Store, Clock, Flag, X, Pencil, Check } from '@lucide/svelte';
  import KindIcon from '../map/KindIcon.svelte';
  import { backClose } from '../ui/backclose.js';
  import { rideOrSleep, hhmm, hm, TIRED } from '../race/race.js';
  import NapTimer from '../race/ride/NapTimer.svelte';
  import { minText } from '../unterwegs/heimweg.js';
  import { t } from '../i18n.svelte.js';

  // ctx: { trip, race, stored, plan, save } of the race (null on a ride without a race); the sheet writes only the tiredness, the nap and the three goals
  let { race = null, ctx = null, awake = 0, now = Date.now(), km = null, pace = {}, bed = null, shop = null, movingS = 0, pausedS = 0, onclose } = $props();
  let dialog = $state();
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const kmh = $derived(pace?.kmh > 0 ? pace.kmh : 18);
  const bedAhead = $derived(bed?.best ?? null);
  const pick = $derived(
    race
      ? rideOrSleep({ tired: race.tired.at(-1)?.v ?? 2, hour: new Date(now).getHours(), awakeH: awake, kmToBed: bedAhead?.distKm ?? 20, kmh, bagC: race.bagC })
      : null,
  );
  // the light and the plain sentence (Noah 02.11.2026: «für Nutzer unverständlich» → colour + one sentence + reasons in plain words)
  const SAY = { ride: 'Riding on is fine.', nap: 'Better take a short nap.', sleep: 'Sleep now.' };
  const COLOR = { ride: 'ok', nap: 'warn', sleep: 'bad' };
  const tiredNow = $derived(race?.tired.at(-1)?.v ?? 0);
  const setTired = (v) => ctx?.save({ tired: [...(race?.tired ?? []), { at: new Date().toISOString(), v }] });
  let why = $state(false);
  // the three goals: the pencil opens the lines; two edits in a row must not overwrite each other
  let editing = $state(false);
  let tierNow = null;
  const setTier = (key, v) => {
    tierNow = { ...(tierNow ?? race.tiers), [key]: v.trim() };
    return ctx?.save({ tiers: tierNow });
  };
  const TIER_ROWS = [['vision', 'Vision|goal'], ['super', 'Super|goal'], ['least', 'At least|goal']];
  const whyText = (k) => t(k, { h: k.includes('awake') ? Math.round(awake) : hm(pick.toBedH) });
  const goals = $derived(race ? [['Vision|goal', race.tiers.vision], ['Super|goal', race.tiers.super], ['At least|goal', race.tiers.least]].filter(([, v]) => v) : []);
  const shopRow = $derived(shop?.state === 'ok' ? shop.last : shop?.next ?? null);
</script>

<dialog class="sheet from-below lv-night" bind:this={dialog} use:backClose={() => dialog.close()} onclose={() => onclose?.()} aria-labelledby="lv-night-h" data-live-night-sheet>
  <div class="lv-night-head">
    <h2 id="lv-night-h"><Moon size={20} aria-hidden="true" />{t('Night sheet')}</h2>
    <button type="button" class="rc-icon" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="rc-note">{t('A calm look at the night. It only shows; you decide.')}</p>

  {#if pick}
    <section class="lv-night-part" data-night-verdict={pick.pick}>
      <h3 class="lv-night-h3">{t('Ride on or sleep?')}</h3>
      <p class="lv-night-say"><span class="lv-night-dot lv-night-{COLOR[pick.pick]}" aria-hidden="true"></span><b>{t(SAY[pick.pick])}</b></p>
      {#if pick.why.length}<ul class="lv-night-chips" aria-label={t('The reasons')}>{#each pick.why as k (k)}<li>{whyText(k)}</li>{/each}</ul>{/if}
      <div role="group" aria-label={t('How tired are you?')}>
        <span class="rc-note">{t('How tired are you?')}</span>
        <div class="lv-night-scale">
          {#each TIRED as x (x.v)}<button type="button" class="btn sm" aria-pressed={tiredNow === x.v} onclick={() => setTired(x.v)} data-night-tired={x.v}>{x.v}<small>{t(x.name)}</small></button>{/each}
        </div>
      </div>
      <button type="button" class="btn sm" aria-expanded={why} onclick={() => (why = !why)} data-night-why>{t('Why this suggestion?')}</button>
      {#if why}
        <p class="rc-note" data-night-why-text>{t('Green: riding on is fine. Yellow: a short nap of 20 minutes is better. Red: sleep now. The colour counts how tired you are, how long you have been awake, the time of night, the way to the next bed and the cold. It is a suggestion, you decide.')}</p>
      {/if}
      {#if ctx}<NapTimer {ctx} {now} />{/if}
    </section>
  {/if}

  <section class="lv-night-part" data-night-bed>
    <h3 class="lv-night-h3">{t('Bed|night')}</h3>
    {#if bed?.planned}
      <p class="lv-line"><Moon size={18} aria-hidden="true" /><span>{t('Bed of the plan: km {km}', { km: Math.round(bed.planned.km) })}{#if bed.planned.name}{' '}· {bed.planned.name}{/if}</span></p>
    {/if}
    {#if bedAhead}
      <p class="lv-line"><KindIcon kind="sleep" size={18} /><span>{bedAhead.name || t('Place to sleep')} · {t('{d} km', { d: Math.round(bedAhead.distKm * 10) / 10 })} · {t('there about {at}', { at: hhmm(bedAhead.eta) })}</span></p>
    {:else if !bed?.planned}
      <p class="rc-empty">{t('No bed found ahead yet. Load the stops along the route.')}</p>
    {/if}
  </section>

  <section class="lv-night-part" data-night-shop>
    <h3 class="lv-night-h3">{t('Last open shop before the night')}</h3>
    {#if shopRow}
      <p class="lv-line"><Store size={18} aria-hidden="true" /><span>{shopRow.poi.name || t('Shop')} · {t('{d} km', { d: Math.round(shopRow.distKm * 10) / 10 })} · {t('there about {at}', { at: hhmm(shopRow.eta) })}{#if shopRow.closes}{' '}· {t('Open until {at}', { at: shopRow.closes })}{/if}</span></p>
      {#if shop.state === 'dark'}<p class="rc-note">{t('It is dark. The nearest shop ahead:')}</p>
      {:else if shop.state === 'none'}<p class="rc-note">{t('No open shop is left before the night. The nearest ahead:')}</p>{/if}
    {:else}
      <p class="rc-empty">{t('Load the stops along the route to see the last open shop before the night.')}</p>
    {/if}
  </section>

  <section class="lv-night-part" data-night-pauses>
    <h3 class="lv-night-h3">{t('Today so far')}</h3>
    <p class="lv-line"><Clock size={18} aria-hidden="true" /><span>{t('Riding {a}, stopped {b}', { a: minText(Math.round(movingS / 60)), b: minText(Math.round(pausedS / 60)) })}</span></p>
  </section>

  {#if race}
    <section class="lv-night-part" data-night-goals>
      <h3 class="lv-night-h3"><Flag size={16} aria-hidden="true" />{t('Three goals')}
        {#if ctx}<button type="button" class="rc-icon" aria-label={editing ? t('Done') : t('Change my goals')} aria-pressed={editing} onclick={() => (editing = !editing)} data-night-goals-edit>{#if editing}<Check size={18} aria-hidden="true" />{:else}<Pencil size={18} aria-hidden="true" />{/if}</button>{/if}
      </h3>
      {#if editing}
        {#each TIER_ROWS as [k, name] (k)}
          <label class="rc-lab">{t(name)}<input class="inp" maxlength="160" value={race.tiers[k]} onchange={(e) => setTier(k, e.currentTarget.value)} data-night-tier={k} /></label>
        {/each}
        <p class="rc-note">{t('You can also write them under Race › Prepare.')}</p>
      {:else if goals.length}
        <ul class="lv-night-goals">{#each goals as [k, v] (k)}<li><b>{t(k)}</b> {v}</li>{/each}</ul>
      {:else}
        <p class="rc-empty">{t('You have not written your goals yet. Tap the pencil.')}</p>
      {/if}
    </section>
  {/if}
</dialog>

<style>
  .lv-night-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .lv-night-head h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
  .lv-night-part {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .lv-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
  }
  .lv-line > :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .lv-night-h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .lv-night-say {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .lv-night-dot {
    flex: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }
  .lv-night-ok {
    background: var(--ok);
  }
  .lv-night-warn {
    background: var(--warn);
  }
  .lv-night-bad {
    background: var(--bad);
  }
  .lv-night-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .lv-night-chips li {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: var(--fs-small);
  }
  .lv-night-scale {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    margin-top: 4px;
  }
  .lv-night-scale .btn {
    flex-direction: column;
    gap: 0;
    padding-inline: 2px;
    line-height: 1.2;
  }
  .lv-night-scale small {
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  .lv-night-pick {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .lv-night-why,
  .lv-night-goals {
    margin: 0;
    padding-left: 18px;
  }
  .lv-night-goals {
    list-style: none;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
