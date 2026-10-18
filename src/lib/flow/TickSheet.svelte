<script>
  import { backClose } from '../ui/backclose.js'; // Regeln der App (14.10.2026): back closes this window first
  /**
   * v0.51.0 «Im Flow»: the sheet of a long press on an activity, only when needed: where (Yoga
   * Studio / Zuhause), how many (Liegestütze +10 / +20 / own number), how long (optional), a commute,
   * or straight into the countdown.
   */
  import Seg from '../ui/Seg.svelte';
  import { Timer, Bike, X, Check } from '@lucide/svelte';
  import { ui, tickWith, openTimer, actName, goalName, clockState } from './ui.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { st = null } = $props();
  let dlg = $state();
  let sub = $state(null);
  let amount = $state(null);
  let own = $state('');
  let min = $state(null);

  const a = $derived(st?.act ?? null);
  $effect(() => {
    if (st && dlg && !dlg.open) {
      sub = st.goals.length > 1 ? st.openSub : null;
      amount = st.act.perTap;
      own = '';
      min = null;
      dlg.showModal();
    }
    if (!st && dlg?.open) dlg.close();
  });
  const close = () => (ui.tick = null);
  const n = $derived(amount === 'own' ? Math.max(1, Math.round(Number(own) || 0)) : amount);
  async function go() {
    if (!a) return;
    await tickWith(a, { sub: sub ?? undefined, n: a.perTap > 1 ? n : undefined, min: min ?? undefined });
    close();
  }
  async function commute() {
    await tickWith(a, { via: 'commute', n: 1 });
    close();
  }
  function clock() {
    const id = a.id;
    close();
    if (!clockState.tm) clockState.sub = sub;
    openTimer(id);
  }
</script>

<dialog use:backClose class="sheet from-below aksheet" bind:this={dlg} onclose={close} onclick={(e) => e.target === dlg && close()} aria-labelledby="tick-h" data-backdrop="own">
  {#if a}
    <div class="hd">
      <div class="ht"><h2 id="tick-h">{t('Tick {name}', { name: actName(a) })}</h2><p class="muted">{t('long press · only when needed')}</p></div>
      <button type="button" class="xb" aria-label={t('Close')} onclick={close}><X size={18} aria-hidden="true" /></button>
    </div>
    {#if st.goals.length > 1}
      <p class="lbl" id="tick-where">{t('Where')}</p>
      <Seg chips full={false} labelledby="tick-where" value={sub} onchange={(k) => (sub = k)} options={st.goals.map((r) => ({ key: r.goal.id, name: goalName(r.goal) }))} />
    {/if}
    <p class="lbl" id="tick-min">{t('Duration (optional)')}</p>
    <Seg chips full={false} labelledby="tick-min" value={min} onchange={(k) => (min = k)} options={[15, 30, 45, 60].map((m) => ({ key: m, name: m === 60 ? '60 min' : String(m) }))} />
    {#if a.perTap > 1}
      <p class="lbl" id="tick-n">{t('How many')}</p>
      <Seg chips full={false} labelledby="tick-n" value={amount} onchange={(k) => (amount = k)} options={[{ key: a.perTap, name: `+${a.perTap}` }, { key: a.perTap * 2, name: `+${a.perTap * 2}` }, { key: 'own', name: t('own number') }]} />
      {#if amount === 'own'}<input class="inp own" type="number" inputmode="numeric" min="1" bind:value={own} aria-label={t('How many')} />{/if}
    {/if}
    <div class="rw">
      <span class="ib" aria-hidden="true"><Timer size={18} /></span>
      <span class="rt"><b>{t('Stopwatch')}</b><small>{t('runs until you are done, then ticks off')}</small></span>
      <button type="button" class="btn" onclick={clock}>{t('Start|check')}</button>
    </div>
    <div class="acts">
      {#if a.counts.includes('commute')}<button type="button" class="btn cm" onclick={commute}><Bike size={18} aria-hidden="true" />{t('Commute')}</button>{/if}
      <button type="button" class="btn" onclick={close}>{t('Cancel')}</button>
      <button type="button" class="btn hi" onclick={go}><Check size={16} aria-hidden="true" />{t('Tick off')}</button>
    </div>
  {/if}
</dialog>

<style>
  /* v0.105.0 Design-Refresh P8 «Aktiv» (A2): the light window: the title with the close button, the
     choices as chips, the stopwatch as a row, «Abbrechen» and «Abhaken» at the bottom right */
  dialog.aksheet {
    width: min(640px, calc(100vw - 24px));
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
  .own {
    margin-top: 8px;
    max-width: 140px;
  }
  .rw {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin-top: var(--sp-4);
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .cm {
    margin-right: auto;
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .rt {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .rt b {
    display: block;
    font-weight: 500;
  }
  .rt small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--sp-2);
    margin-top: var(--sp-5);
  }
</style>
