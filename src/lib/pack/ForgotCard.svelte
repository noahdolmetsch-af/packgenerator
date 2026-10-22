<script>
  /**
   * Paket P3 «Warum? und Regeln», C «Meist vergessen» (decision 12.10.2026 2a): the top 3 of what was missing
   * on earlier trips of this type (from the debriefs), at the top of Pack. A thing you have in Gear goes on the
   * list with one tap; anything else goes into this trip's evening-before check. Pin keeps a thing on top,
   * × takes it out of the list (with Undo). All of it: Me › Checks per trip type. Rules: lib/checks.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { domainOf } from '../domains.js';
  import { FORGOT_KEY, mostForgotten, togglePin, hideForgot, forgotKey, checkOf, checkKey, addCheck } from '../checks.js';
  import { shortDay } from '../trip/checkhints.js';
  import { saveFailed } from '../ui/ask.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { Pin, PinOff, X, Plus, Check, ChevronRight, Undo2 } from '@lucide/svelte';

  let { trip, trips = [], debriefs = [], items = [], onadd } = $props();

  const domain = $derived(domainOf(trip));
  const prefsQ = liveQuery(() => db.settings.get(FORGOT_KEY));
  const stdQ = liveQuery(() => db.settings.get(checkKey('eve', domainOf(trip))));
  const prefs = $derived($prefsQ?.value ?? null);
  const list = $derived(mostForgotten(trips, debriefs, domain, { except: trip.id, prefs }));
  const onList = $derived(new Set((trip.entries ?? []).map((e) => e.itemId)));
  const eve = $derived(checkOf(trip, 'eve', $stdQ?.value ?? null));
  const itemOf = (key) => items.find((i) => forgotKey(nameOf(i)) === key || forgotKey(i.name) === key) ?? null;
  const inCheck = (name) => eve.some((r) => forgotKey(r.label).includes(forgotKey(name)));
  let undo = $state(null); // { key, name } of the thing just taken out

  const savePrefs = (fn) => db.settings.put({ key: FORGOT_KEY, value: fn($prefsQ?.value ?? null) }).catch(saveFailed);
  const pin = (m) => savePrefs((v) => togglePin(v, m.key));
  async function hide(m) {
    await savePrefs((v) => hideForgot(v, m.key));
    undo = { key: m.key, name: m.name };
  }
  async function back() {
    const u = undo;
    undo = null;
    if (u) await savePrefs((v) => hideForgot(v, u.key, false));
  }
  async function toCheck(name) {
    try {
      await db.transaction('rw', db.trips, async () => {
        const cur = await db.trips.get(trip.id);
        if (cur) await db.trips.update(trip.id, touched({ eve: addCheck(checkOf(cur, 'eve', $stdQ?.value ?? null), t('Pack {name}', { name })) }));
      });
    } catch (err) {
      saveFailed(err);
    }
  }
</script>

{#if list.length || undo}
  <section class="tp-card fg" aria-labelledby="fg-h" data-forgot>
    <div class="fg-h">
      <h2 id="fg-h">{t('Most often forgotten')}</h2>
      <a class="tp-link fg-all" href={`#/me/checks?${domain}`}>{t('All')}<ChevronRight size={14} aria-hidden="true" /></a>
    </div>
    <p class="fg-sub">{t('From your debriefs of this trip type')}</p>
    <ul class="fg-list">
      {#each list as m (m.key)}
        {@const it = itemOf(m.key)}
        <li data-forgot-row={m.name}>
          <span class="fg-m">
            <b>{m.name}{#if m.pinned}{' '}<Pin size={13} aria-label={t('pinned')} />{/if}</b>
            <small>{tn(m.n, 'missing {n} time · debrief of {day}', 'missing {n} times · last debrief {day}', { day: shortDay(m.at) })}</small>
          </span>
          <span class="fg-acts">
            {#if it && onList.has(it.id)}<span class="fg-done"><Check size={15} aria-hidden="true" />{t('on the list')}</span>
            {:else if it && onadd}<button type="button" class="btn sm" onclick={() => onadd(it.id)} data-forgot-add>{t('Onto the list')}</button>
            {:else if inCheck(m.name)}<span class="fg-done"><Check size={15} aria-hidden="true" />{t('in the evening-before check')}</span>
            {:else}<button type="button" class="btn sm" onclick={() => toCheck(m.name)} data-forgot-check><Plus size={15} aria-hidden="true" />{t('To the evening before')}</button>{/if}
            <button type="button" class="fg-ib" aria-pressed={m.pinned} aria-label={m.pinned ? t('Unpin {name}', { name: m.name }) : t('Pin {name}', { name: m.name })} onclick={() => pin(m)} data-forgot-pin>{#if m.pinned}<PinOff size={17} aria-hidden="true" />{:else}<Pin size={17} aria-hidden="true" />{/if}</button>
            <button type="button" class="fg-ib" aria-label={t('Take {name} out of this list', { name: m.name })} onclick={() => hide(m)} data-forgot-hide><X size={17} aria-hidden="true" /></button>
          </span>
        </li>
      {/each}
    </ul>
    {#if undo}<p class="fg-undo" role="status"><span>{t('«{name}» is no longer shown.', { name: undo.name })}</span><button type="button" class="tp-link" onclick={back} data-forgot-undo><Undo2 size={15} aria-hidden="true" />{t('Undo')}</button></p>{/if}
  </section>
{/if}

<style>
  .fg {
    margin: 0 0 var(--sp-4);
  }
  .fg-h {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .fg-h h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .fg-all {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: var(--fs-small);
  }
  .fg-sub {
    margin: 0 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fg-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .fg-list li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .fg-m {
    flex: 1 1 10em;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .fg-m b {
    font-weight: 500;
  }
  .fg-m small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .fg-acts {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
  }
  .fg-acts .btn {
    min-height: 44px;
  }
  .fg-done {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .fg-ib {
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .fg-ib[aria-pressed='true'] {
    color: var(--ink);
  }
  .fg-undo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 6px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
