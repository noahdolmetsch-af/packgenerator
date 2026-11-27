<script>
  /**
   * «Lichter» (Noah 26.11.2026 «1a 2b 3 4a»): the card of the lights on the live map. Any number of lights; for each
   * one what is left, the mode in use, the hours of light left, the charging time and, when it does not last, the
   * mode that would. Everything you type is «% in minutes» (7 % in 60 min; charging 20 % in 23 min). Deleting a light
   * is at once with Undo (it is quickly made again). The list belongs to the page (bind:lights); the plans are worked
   * out there (lichter.js, lightsPlan) because the alarm, the stops and the arrival report use them too.
   */
  import { Lightbulb, TriangleAlert, Plus, Trash2, X } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import { t, num } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { LAMP_FRAC } from './lamp.js';
  import { durText } from './after.js';
  import { modeHours, chargeMinutes, chargeFrom, newId, worstState, MAX_LIGHTS, MAX_MODES } from './lichter.js';

  let { lights = $bindable([]), plans = [], when = (ms) => String(ms), showWhenEmpty = true } = $props();

  const worst = $derived(worstState(plans));
  const nameOf = (l) => l.name || t('Light|lamp');
  const modeName = (l, m) => m.name || t('Mode {n}', { n: l.modes.indexOf(m) + 1 });
  const patch = (id, p) => (lights = lights.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const patchMode = (l, mid, p) => patch(l.id, { modes: l.modes.map((m) => (m.id === mid ? { ...m, ...p } : m)) });
  const val = (e) => Number(String(e.currentTarget.value).replace(',', '.')) || 0;
  const addLight = () => {
    if (lights.length >= MAX_LIGHTS) return;
    lights = [...lights, { id: newId(), name: '', left: 'full', mode: 'm1', modes: [{ id: 'm1', name: '', pct: 0, min: 0 }], charge: null }];
  };
  const addMode = (l) => {
    if (l.modes.length >= MAX_MODES) return;
    let n = l.modes.length + 1;
    while (l.modes.some((m) => m.id === `m${n}`)) n++;
    patch(l.id, { modes: [...l.modes, { id: `m${n}`, name: '', pct: 0, min: 0 }] });
  };
  const dropMode = (l, mid) => {
    if (l.modes.length < 2) return;
    const modes = l.modes.filter((m) => m.id !== mid);
    patch(l.id, { modes, mode: l.mode === mid ? modes[0].id : l.mode });
  };
  const setCharge = (l, key, v) => {
    patch(l.id, { charge: { pct: l.charge?.pct ?? 0, min: l.charge?.min ?? 0, [key]: v } });
  };
  function drop(l) {
    const at = lights.findIndex((x) => x.id === l.id);
    lights = lights.filter((x) => x.id !== l.id);
    offerDone(t('«{name}» deleted.', { name: nameOf(l) }), async () => {
      const next = [...lights];
      next.splice(Math.min(at, next.length), 0, l);
      lights = next;
    });
  }
</script>

{#if lights.length || showWhenEmpty}
  <div class="lt" data-live-lamp={worst}>
    <h3 class="lt-h"><Lightbulb size={16} aria-hidden="true" />{t('Your lights')}</h3>
    {#if worst === 'day' && plans.length}<p class="rc-note" data-live-lamp-say>{t('No darkness ahead on this ride: your lamp is not needed.')}</p>{/if}
    {#if !lights.length}<p class="rc-note" data-live-lights-none>{t('No light yet. Add the lights you ride with, then the app says whether they last through the dark.')}</p>{/if}
    {#each plans as p (p.light.id)}
      {@const l = p.light}
      <div class="lt-one" data-live-light={l.id} data-live-light-state={p.plan?.state ?? 'day'}>
        {#if p.plan && p.plan.state !== 'day'}
          {#if p.plan.state === 'short'}<p class="rc-warn lt-line" data-live-lamp-say><TriangleAlert size={20} aria-hidden="true" /><span><b>{nameOf(l)}:</b> {t('Your lamp will not last: it burns until about {at}, but you ride about {d} h in the dark. Charge it, use a lower mode or take a spare light.', { at: when(p.plan.untilAt), d: num(p.plan.darkH) })}</span></p>
          {:else if p.plan.state === 'tight'}<p class="rc-note" data-live-lamp-say><b>{nameOf(l)}:</b> {t('Your lamp just lasts: it burns until about {at}, you ride about {d} h in the dark.', { at: when(p.plan.untilAt), d: num(p.plan.darkH) })}</p>
          {:else}<p class="rc-note" data-live-lamp-say><b>{nameOf(l)}:</b> {t('Your lamp lasts: it burns until about {at}, you ride about {d} h in the dark.', { at: when(p.plan.untilAt), d: num(p.plan.darkH) })}</p>{/if}
          {#if p.advice.kind === 'lower'}<p class="rc-note" data-live-light-advice>{t('On «{mode}» it lasts to the end of the dark.', { mode: modeName(l, p.advice.mode) })}</p>{/if}
        {:else}
          <b class="lt-name">{nameOf(l)}</b>
        {/if}
        <div role="group" aria-label={t('What is left in your lamp?')}>
          <span class="rc-note">{t('What is left in your lamp?')}</span>
          <Seg small options={[{ key: 'full', name: t('Full|lamp') }, { key: 'half', name: t('Half|lamp') }, { key: 'low', name: t('Almost empty|lamp') }]} value={l.left} onchange={(k) => patch(l.id, { left: k })} />
        </div>
        {#if l.modes.length > 1}
          <div role="group" aria-label={t('Which mode is the light on?')}>
            <span class="rc-note">{t('Which mode is the light on?')}</span>
            <Seg small options={l.modes.map((m) => ({ key: m.id, name: modeName(l, m) }))} value={p.mode?.id ?? ''} onchange={(k) => patch(l.id, { mode: k })} data-live-light-mode />
          </div>
        {/if}
        {#if modeHours(p.mode) > 0}
          <p class="rc-note" data-live-lamp-rest>{t('About {h} h of light left; a full charge lasts {full} h.', { h: num(p.restH), full: num(p.fullH) })}{#if chargeMinutes(l.charge) > 0}{' '}{#if chargeFrom(l.charge, LAMP_FRAC[l.left] ?? 1) > 0}{t('Charging from empty takes about {t}, from now about {n}.', { t: durText(chargeMinutes(l.charge) * 60), n: durText(chargeFrom(l.charge, LAMP_FRAC[l.left] ?? 1) * 60) })}{:else}{t('Charging from empty takes about {t}.', { t: durText(chargeMinutes(l.charge) * 60) })}{/if}{/if}</p>
        {/if}
      </div>
    {/each}
    <details class="lt-set" data-live-lamp-set>
      <summary>{t('Change lamp')}</summary>
      <span class="rc-note">{t('For every mode type how much of the charge it uses in how many minutes, for example 7 % in 60 min. The same for charging, for example 20 % in 23 min.')}</span>
      {#each lights as l (l.id)}
        <fieldset class="lt-f" data-live-light-set={l.id}>
          <div class="lt-row">
            <input class="inp lt-grow" type="text" maxlength="40" value={l.name} placeholder={t('Light|lamp')} aria-label={t('Name of the light')} onchange={(e) => patch(l.id, { name: e.currentTarget.value.trim() })} data-live-light-name />
            <button type="button" class="lt-ic" onclick={() => drop(l)} aria-label={t('Delete light')} data-live-light-del><Trash2 size={18} aria-hidden="true" /></button>
          </div>
          {#each l.modes as m (m.id)}
            <div class="lt-row" data-live-light-modeset={m.id}>
              <input class="inp lt-full" type="text" maxlength="30" value={m.name} placeholder={t('Mode {n}', { n: l.modes.indexOf(m) + 1 })} aria-label={t('Name of the mode')} onchange={(e) => patchMode(l, m.id, { name: e.currentTarget.value.trim() })} />
              <input class="inp lt-n" type="number" inputmode="decimal" min="0" max="100" step="any" value={m.pct || ''} aria-label={t('Percent of the charge')} onchange={(e) => patchMode(l, m.id, { pct: val(e) })} data-live-light-pct />
              <span>%</span><span>{t('in|lamp')}</span>
              <input class="inp lt-n" type="number" inputmode="decimal" min="0" step="any" value={m.min || ''} aria-label={t('Minutes')} onchange={(e) => patchMode(l, m.id, { min: val(e) })} data-live-light-min />
              <span>min</span>
              {#if l.modes.length > 1}<button type="button" class="lt-ic" onclick={() => dropMode(l, m.id)} aria-label={t('Remove mode')}><X size={16} aria-hidden="true" /></button>{/if}
            </div>
          {/each}
          {#if l.modes.length < MAX_MODES}<button type="button" class="btn sm" onclick={() => addMode(l)} data-live-light-addmode><Plus size={16} aria-hidden="true" />{t('Add a mode')}</button>{/if}
          <div class="lt-row" data-live-light-chargeset>
            <span class="lt-lbl">{t('Charging')}</span>
            <input class="inp lt-n" type="number" inputmode="decimal" min="0" max="100" step="any" value={l.charge?.pct || ''} aria-label={t('Percent charged')} onchange={(e) => setCharge(l, 'pct', val(e))} data-live-light-cpct />
            <span>%</span><span>{t('in|lamp')}</span>
            <input class="inp lt-n" type="number" inputmode="decimal" min="0" step="any" value={l.charge?.min || ''} aria-label={t('Minutes')} onchange={(e) => setCharge(l, 'min', val(e))} data-live-light-cmin />
            <span>min</span>
          </div>
        </fieldset>
      {/each}
      {#if lights.length < MAX_LIGHTS}<button type="button" class="btn sm" onclick={addLight} data-live-light-add><Plus size={16} aria-hidden="true" />{t('Add a light')}</button>{/if}
    </details>
  </div>
{/if}

<style>
  .lt {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .lt-h {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .lt-one {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--line);
  }
  .lt-line {
    display: flex;
    gap: 8px;
    margin: 0;
  }
  .lt-set {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .lt-set summary {
    cursor: pointer;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .lt-f {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 6px 0 0;
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    min-width: 0;
  }
  .lt-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-small);
  }
  .lt-grow {
    flex: 1 1 120px;
    min-width: 0;
  }
  .lt-full {
    flex: 1 1 100%;
    min-width: 0;
  }
  .lt-n {
    width: 5.2em;
    min-width: 0;
  }
  .lt-lbl {
    min-width: 5em;
  }
  .lt-ic {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
  }
</style>
