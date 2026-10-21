<script>
  /**
   * Paket P1 «Packen und Strom» (mockups L1 and L4, Noah 12.10.2026 «L1-L4 freigeben»): the row «Power» of an
   * item in Electronics or Lights. Battery, how long it lasts, how long it charges (half and a quarter worked
   * out), each value with where it comes from; a lamp's levels with their hours (add, rename, sort with arrows
   * and drag, delete); «Measure charging once»: start the stopwatch, choose the plug, «Full · stop» writes
   * the time as measured. The fields go into the item's draft and are saved with «Save»; the stopwatch writes
   * at once (charging takes hours, the window may close). Rules: lib/strom.js.
   */
  import { Timer, Plus, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import Field from '../ui/Field.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { powerRole } from '../power.js';
  import { SOURCES, PLUGS, plugName, partialCharge, hoursText, elapsedHours, stopCharge, setSource, addMode, updateMode, dropMode, moveMode } from '../strom.js';
  import { t } from '../i18n.svelte.js';

  let { draft = $bindable(), errors = {}, itemId = null } = $props();

  const isLight = $derived(draft.category === 'light');
  const part = $derived(partialCharge(draft.chargeH));
  const src = (field) => draft.powerSrc?.[field] ?? '';
  const pickSrc = (field, key) => (draft.powerSrc = setSource(draft.powerSrc, field, key));
  // a value typed by hand without a source counts as the maker's
  const typed = (field) => {
    if (String(draft[field] ?? '').trim() && !src(field)) pickSrc(field, 'maker');
  };

  /* the lamp's levels */
  let modeName = $state('');
  let modeH = $state('');
  const uid = () => `lm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  function addOne(e) {
    e.preventDefault();
    if (!modeName.trim()) return;
    draft.lightModes = addMode(draft.lightModes, modeName, modeH, uid());
    modeName = '';
    modeH = '';
  }
  const move = (from, to) => (draft.lightModes = moveMode(draft.lightModes, from, to));

  /* the stopwatch: written at once, the window may close while it charges */
  let plug = $state(draft.chargeTimer?.plug ?? 'wall');
  let now = $state(Date.now());
  $effect(() => {
    if (!draft.chargeTimer?.startedAt) return;
    const id = setInterval(() => (now = Date.now()), 30000);
    return () => clearInterval(id);
  });
  const running = $derived(draft.chargeTimer?.startedAt ? elapsedHours(draft.chargeTimer.startedAt, now) : null);
  async function start() {
    const chargeTimer = { startedAt: new Date().toISOString(), plug };
    draft.chargeTimer = chargeTimer;
    now = Date.now();
    if (itemId) await db.items.update(itemId, { chargeTimer });
  }
  async function stop() {
    const patch = stopCharge($state.snapshot(draft), Date.now());
    if (!patch) return;
    Object.assign(draft, patch);
    if (itemId) await db.items.update(itemId, patch);
  }
  async function cancel() {
    draft.chargeTimer = null;
    if (itemId) await db.items.update(itemId, { chargeTimer: null });
  }
</script>

{#snippet source(field)}
  <select class="sel src" value={src(field)} onchange={(e) => pickSrc(field, e.currentTarget.value)} aria-label={t('Source')} data-src={field}>
    <option value="">{t('Source?')}</option>
    {#each SOURCES as s (s.key)}<option value={s.key}>{t(s.name)}</option>{/each}
  </select>
{/snippet}

<p class="note">{t('All optional. The power budget uses these values; without them it takes usual values. Each value can say where it comes from.')}</p>
<div class="pw">
  <div class="pwf">
    <Field id="it-mah" label={t('Battery (mAh)')} optional example={t('e.g. {x}', { x: '10000' })} error={errors.mah}>
      {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.mah} onchange={() => typed('mah')} />{/snippet}
    </Field>
    {@render source('mah')}
  </div>
  <div class="pwf">
    <Field id="it-run" label={t('Battery lasts (h)')} optional example={t('e.g. {x}', { x: '12' })} error={errors.runH}>
      {#snippet children(f)}<input class="inp num" type="text" inputmode="decimal" {...f.attrs} bind:value={draft.runH} onchange={() => typed('runH')} />{/snippet}
    </Field>
    {@render source('runH')}
  </div>
  <div class="pwf">
    <Field id="it-chg" label={t('Charging takes (h)')} optional example={t('e.g. {x}', { x: '3' })} error={errors.chargeH}>
      {#snippet children(f)}<input class="inp num" type="text" inputmode="decimal" {...f.attrs} bind:value={draft.chargeH} onchange={() => typed('chargeH')} />{/snippet}
    </Field>
    {@render source('chargeH')}
  </div>
  {#if ['bank', 'charger'].includes(powerRole(draft))}
    <Field id="it-ports" label={t('Sockets')} optional example={t('e.g. {x}', { x: '3' })} error={errors.ports}>
      {#snippet children(f)}<input class="inp num" type="text" inputmode="numeric" {...f.attrs} bind:value={draft.ports} />{/snippet}
    </Field>
  {/if}
</div>
{#if part}
  <p class="note num" data-partial>{t('Full {full} · half {half} · a quarter {quarter}', { full: hoursText(part.full), half: hoursText(part.half), quarter: hoursText(part.quarter) })} <small>({t('half and a quarter: calculated')})</small></p>
{/if}

<div class="pw-sw" data-stopwatch>
  <p class="pw-lbl"><Timer size={16} aria-hidden="true" />{t('Measure charging once')}</p>
  {#if running != null}
    <p class="num" data-running>{t('Charging since {time} · {h} so far', { time: new Date(draft.chargeTimer.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), h: hoursText(running) })}{#if draft.chargeTimer.plug}{' · '}{t(plugName(draft.chargeTimer.plug))}{/if}</p>
    <span class="row"><button type="button" class="btn hi" onclick={stop} data-stop>{t('Full · stop')}</button><button type="button" class="text-button" onclick={cancel}>{t('Cancel')}</button></span>
  {:else}
    <p class="note">{t('Plug it in empty and start; tap «Full · stop» when it is full. The time is kept as measured.')}</p>
    <span class="row">
      <select class="sel" bind:value={plug} aria-label={t('Charged from')} data-plug>
        {#each PLUGS as p (p.key)}<option value={p.key}>{t(p.name)}</option>{/each}
      </select>
      <button type="button" class="btn" onclick={start} data-start>{t('Start the stopwatch')}</button>
    </span>
    {#if draft.chargePlug && src('chargeH') === 'measured'}<p class="note">{t('Last measured with: {plug}', { plug: t(plugName(draft.chargePlug)) })}</p>{/if}
  {/if}
</div>

{#if isLight}
  <div class="lm" data-light-modes>
    <p class="pw-lbl">{t('Light levels')}</p>
    <p class="note">{t('How long each level lasts on a full battery, e.g. high 1.5 h, low 12 h.')}</p>
    {#if draft.lightModes?.length}
      <ul use:sortable={{ onmove: move }}>
        {#each draft.lightModes as m, i (m.id)}
          <li data-sort-id={m.id} data-mode={m.name}>
            <SortGrip name={m.name} onstep={(dir) => move(i, i + dir)} />
            <input class="inp nm" value={m.name} aria-label={t('Name of the level')} onchange={(e) => (draft.lightModes = updateMode(draft.lightModes, m.id, { name: e.currentTarget.value }))} />
            <input class="inp num h" value={m.h ?? ''} inputmode="decimal" aria-label={t('Hours of {name}', { name: m.name })} onchange={(e) => (draft.lightModes = updateMode(draft.lightModes, m.id, { h: e.currentTarget.value }))} />
            <span class="u">h</span>
            <SortArrows name={m.name} {i} n={draft.lightModes.length} onstep={(dir) => move(i, i + dir)} />
            <button type="button" class="ib" aria-label={t('Delete {name}', { name: m.name })} onclick={() => (draft.lightModes = dropMode(draft.lightModes, m.id))}><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {/if}
    <form class="row" onsubmit={addOne}>
      <input class="inp nm" bind:value={modeName} placeholder={t('e.g. {x}', { x: t('High') })} aria-label={t('New level')} data-mode-new />
      <input class="inp num h" bind:value={modeH} inputmode="decimal" placeholder="h" aria-label={t('Hours')} data-mode-h />
      <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </div>
{/if}

<style>
  .note {
    margin: 0 0 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .pw {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    margin-bottom: 10px;
  }
  .pw :global(.fld-u) {
    margin: 0;
  }
  @media (max-width: 359px) {
    .pw {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .pwf {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .src {
    min-height: 36px;
    font-size: var(--fs-small);
  }
  .pw-sw,
  .lm {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .pw-lbl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-weight: 600;
  }
  .pw-sw p,
  .lm p {
    margin: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .row .sel,
  .row .btn {
    min-height: 44px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    border-bottom: 1px solid var(--line);
  }
  .nm {
    flex: 1 1 8em;
    min-width: 0;
    min-height: 44px;
  }
  .h {
    width: 4.5em;
    min-height: 44px;
  }
  .u {
    color: var(--ink-2);
  }
  .ib {
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
</style>
