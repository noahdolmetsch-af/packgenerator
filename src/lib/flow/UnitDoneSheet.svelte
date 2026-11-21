<script>
  /**
   * «Plan zuerst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T4): the short sheet after «Done» on a unit of the
   * weekly plan (the line «Up now» on Heute, the tick on the weekly plan). Duration preselected from the plan, the feeling optional,
   * «Save» ticks the unit in the plan and in the history and opens «Geschafft». The sport is asked once per kind of unit (Noah «a»),
   * kept, and changeable here any time. Everything is optional: «Only in the plan» ticks the unit without a history entry.
   * The rules are in lib/flow/unitdone.js.
   */
  import { backClose } from '../ui/backclose.js';
  import Seg from '../ui/Seg.svelte';
  import { X, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { UNIT_NAME } from '../training/wochenplan-text.js';
  import { ui, tickWith, closeToast, actName } from './ui.svelte.js';
  import { FEELS } from './feel.js';
  import MinInput from './MinInput.svelte';
  import { FEEL_KEY } from './feelword.js';
  import { UNITACTS_KEY, takers, actForUnit, minuteChips, setUnitTick, unitActsOf, withUnitAct } from './unitdone.js';

  let { st = null } = $props();
  let dlg = $state();
  let acts = $state([]);
  let raw = $state(null);
  let actId = $state(null); // the chosen sport; 'none' = only in the plan
  let min = $state(null);
  let feel = $state(null);
  let change = $state(false); // the remembered sport is shown as a line; «Change» opens the choice
  let busy = false;

  $effect(() => {
    if (st && dlg && !dlg.open) {
      min = Number(st.mins) > 0 ? Math.round(Number(st.mins)) : null;
      feel = null;
      change = false;
      load(st);
      dlg.showModal();
    }
    if (!st && dlg?.open) dlg.close();
  });
  async function load(s) {
    const [list, set] = await Promise.all([db.flowActs.toArray(), db.settings.get(UNITACTS_KEY)]);
    if (ui.unit !== s) return;
    acts = takers(list);
    raw = set?.value ?? null;
    const f = actForUnit(s.type, acts, raw, actName);
    actId = f.act?.id ?? (acts.length ? null : 'none');
    remembered = f.remembered;
  }
  let remembered = $state(false);

  const close = () => (ui.unit = null);
  const what = $derived(st ? t(UNIT_NAME[st.type] ?? st.type) : '');
  const chosen = $derived(acts.find((a) => a.id === actId) ?? null);
  const showChoice = $derived(!remembered || change);

  async function save() {
    if (!st || busy) return;
    busy = true;
    const s = st;
    try {
      await setUnitTick(db, { monday: s.monday, id: s.id, on: true, today: s.today, units: s.units, hours: s.hours });
      if (chosen) {
        const e = await tickWith(chosen, { day: s.today, via: 'plan', min: min ?? undefined });
        await db.flowLog.update(e.id, { unit: s.id, ...(feel ? { feel } : {}) });
        if (!remembered || change) await db.settings.put({ key: UNITACTS_KEY, value: withUnitAct(unitActsOf(raw), s.type, chosen.id) });
        close();
        // the toast of the tick is replaced by the page (it has its own «Undo»); a star keeps its window
        if (!ui.star) closeToast();
        location.hash = `#/flow/geschafft?e=${encodeURIComponent(e.id)}`;
      } else {
        close();
        s.done?.();
      }
    } finally {
      busy = false;
    }
  }
</script>

<dialog use:backClose class="sheet from-below aksheet" bind:this={dlg} onclose={close} onclick={(e) => e.target === dlg && close()} aria-labelledby="ud-h" data-backdrop="own" data-unit-sheet>
  {#if st}
    <div class="hd">
      <div class="ht"><h2 id="ud-h">{t('Done: {what}', { what })}</h2><p class="muted">{t('Everything here is optional.')}</p></div>
      <button type="button" class="xb" aria-label={t('Close')} onclick={close}><X size={18} aria-hidden="true" /></button>
    </div>

    {#if chosen && !showChoice}
      <p class="cnt" data-unit-act>{t('Counts for: {sport}', { sport: actName(chosen) })} <button type="button" class="lk" onclick={() => (change = true)} data-unit-change>{t('Change|sport')}</button></p>
    {:else if acts.length}
      <p class="lbl" id="ud-act">{t('Which of your sports is this?')}</p>
      <Seg chips full={false} labelledby="ud-act" value={actId ?? ''} onchange={(k) => (actId = k || null)} options={[...acts.map((a) => ({ key: a.id, name: actName(a) })), { key: 'none', name: t('Only in the plan') }]} />
    {/if}

    {#if chosen}
      <p class="lbl" id="ud-min">{t('How long')}</p>
      <Seg chips full={false} labelledby="ud-min" value={min} onchange={(k) => (min = k === min ? null : k)} options={minuteChips(st.mins).map((m) => ({ key: m, name: m === Number(st.mins) ? t('{n} min planned', { n: m }) : t('{n} min', { n: m }) }))} />
      <MinInput value={min} chips={minuteChips(st.mins)} onset={(m) => (min = m)} id="ud-own-min" />
      <p class="lbl" id="ud-feel">{t('How was it? (optional)')}</p>
      <Seg chips full={false} labelledby="ud-feel" value={feel} onchange={(k) => (feel = k === feel ? null : k)} options={FEELS.map((f) => ({ key: f, name: t(FEEL_KEY[f]) }))} />
    {/if}

    <div class="acts">
      <button type="button" class="btn" onclick={close}>{t('Cancel')}</button>
      <button type="button" class="btn hi" onclick={save} data-unit-save><Check size={16} aria-hidden="true" />{t('Save')}</button>
    </div>
  {/if}
</dialog>

<style>
  dialog.aksheet {
    width: min(640px, calc(100vw - 24px));
    max-height: calc(100dvh - 24px);
    overflow-y: auto; /* many sports and a short phone: the sheet scrolls, «Save» stays reachable */
    padding: var(--sp-5);
    border-color: var(--card-line);
    border-radius: var(--radius-card);
  }
  .hd {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    margin-bottom: var(--sp-2);
  }
  .ht {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .muted {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .xb {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  dialog .lbl {
    margin: var(--sp-4) 0 6px;
  }
  .cnt {
    margin: var(--sp-3) 0 0;
  }
  .lk {
    min-height: 44px;
    margin-left: 6px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-2);
    margin-top: var(--sp-5);
  }
</style>
