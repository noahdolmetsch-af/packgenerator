<script>
  /**
   * v0.51.0 «Im Flow»: the sheet of a long press on an activity, only when needed: where (Yoga
   * Studio / Zuhause), how many (Liegestütze +10 / +20 / own number), how long (optional), a commute,
   * or straight into the countdown.
   */
  import ActIcon from './ActIcon.svelte';
  import Seg from '../ui/Seg.svelte';
  import { Timer, Bike } from '@lucide/svelte';
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

<dialog class="sheet from-below" bind:this={dlg} onclose={close} onclick={(e) => e.target === dlg && close()} aria-labelledby="tick-h">
  {#if a}
    <div class="hd">
      <ActIcon icon={a.icon} ring={a.ring} />
      <div><h2 id="tick-h" class="title">{t('Tick {name}', { name: actName(a) })}</h2><p class="muted">{t('long press · only when needed')}</p></div>
    </div>
    {#if st.goals.length > 1}
      <p class="lbl" id="tick-where">{t('Where')}</p>
      <Seg full={false} labelledby="tick-where" value={sub} onchange={(k) => (sub = k)} options={st.goals.map((r) => ({ key: r.goal.id, name: goalName(r.goal) }))} />
    {/if}
    {#if a.perTap > 1}
      <p class="lbl" id="tick-n">{t('How many')}</p>
      <Seg full={false} labelledby="tick-n" value={amount} onchange={(k) => (amount = k)} options={[{ key: a.perTap, name: `+${a.perTap}` }, { key: a.perTap * 2, name: `+${a.perTap * 2}` }, { key: 'own', name: t('own number') }]} />
      {#if amount === 'own'}<input class="inp own" type="number" inputmode="numeric" min="1" bind:value={own} aria-label={t('How many')} />{/if}
    {/if}
    <p class="lbl" id="tick-min">{t('Duration (optional)')}</p>
    <Seg full={false} labelledby="tick-min" value={min} onchange={(k) => (min = k)} options={[15, 30, 45, 60].map((m) => ({ key: m, name: m === 60 ? '60 min' : String(m) }))} />
    <div class="acts">
      <button type="button" class="btn hi" onclick={go}>{t('Tick off')}</button>
      {#if a.counts.includes('commute')}<button type="button" class="btn" onclick={commute}><Bike size={18} aria-hidden="true" />{t('Commute')}</button>{/if}
      <button type="button" class="btn" onclick={clock}><Timer size={18} aria-hidden="true" />{t('Stopwatch')}</button>
    </div>
    <button type="button" class="btn sm x" onclick={close}>{t('Cancel')}</button>
  {/if}
</dialog>

<style>
  .hd {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }
  .hd .title {
    font-size: var(--fs-sub);
  }
  .muted {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  dialog .lbl {
    margin: 14px 0 6px;
  }
  .own {
    margin-top: 8px;
    max-width: 140px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }
  .acts .btn {
    min-height: 48px;
    border-radius: 12px;
  }
  .acts .btn.hi {
    flex: 1 1 140px;
  }
  .x {
    margin-top: 10px;
    border: 0;
    background: none;
    color: var(--ink-2);
  }
</style>
