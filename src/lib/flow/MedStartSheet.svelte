<script>
  /**
   * v0.86.0 «Meditation einfach» (mockup A, Noah «1-5 a» 11.10.2026): tapping «Meditation» in «Heute
   * abhaken» opens this small start sheet instead of ticking at once. From below on a phone, a centred
   * dialog on a computer. One main button «Jetzt {n} Min ▷» starts at once with the last used template
   * (never used: the first suggestion); the chips 10 · 20 · 30 · 45 · andere change the minutes; one quiet
   * line says template, gong and sound. «Nur abhaken» does what the tap did before (tick with «Rückgängig»);
   * «Zur Meditations-Seite ›» opens the page. The start is the page's own (hobby/medstart.js).
   * st: the activity's flow state (flow.js actState); today; onclose. Heute can use it the same way.
   */
  import { Play, Check, ChevronRight, X } from '@lucide/svelte';
  import ActIcon from './ActIcon.svelte';
  import { medQuery, seedMed } from './data.svelte.js';
  import { tapAct, actName } from './ui.svelte.js';
  import { actGoalText } from './words.js';
  import { beginMed, tplStart, medTemplates, startLine } from './hobby/medstart.js';
  import { backClose } from '../ui/backclose.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  let { st = null, today = localDay(), onclose } = $props();
  const act = $derived(st?.act ?? null);
  const actId = $derived(act?.id ?? 'meditation');
  const q = $derived(medQuery(actId, today));
  const data = $derived($q);
  $effect(() => {
    seedMed(data, actId);
  });
  const tpl = $derived(medTemplates(data)[0] ?? null);
  const CHIPS = [10, 20, 30, 45];

  let dlg = $state();
  let min = $state(null); // null: the template's own minutes
  let other = $state(false);
  let own = $state('');
  const n = $derived(other ? Math.max(1, Math.min(600, Math.round(Number(own) || 0))) || (tpl?.minutes ?? 20) : (min ?? tpl?.minutes ?? 20));
  const start = $derived(tpl ? tplStart(tpl, n) : { minutes: n, bowl: { mode: 'none' }, sound: undefined, endSound: undefined, art: null, tplId: null, name: null });

  $effect(() => {
    if (dlg && !dlg.open) {
      min = null;
      other = false;
      own = '';
      dlg.showModal();
    }
  });
  const close = () => dlg?.open && dlg.close();
  function go() {
    const plan = start;
    close();
    beginMed(actId, data, plan);
  }
  async function tickOnly() {
    const s = st;
    close();
    if (s) await tapAct(s, today);
  }
  const pick = (m) => {
    other = false;
    min = m;
  };
  const chipOn = (m) => !other && n === m;
  const otherOn = $derived(other || !CHIPS.includes(n));
</script>

<dialog class="sheet from-below mss" bind:this={dlg} use:backClose onclose={() => onclose?.()} onclick={(e) => e.target === dlg && close()} aria-labelledby="mss-h" data-med-sheet>
  {#if act}
    <div class="hd">
      <ActIcon icon={act.icon} ring={act.ring} size={20} />
      <div class="ht">
        <h2 id="mss-h" class="ttl">{actName(act)}</h2>
        <p class="muted">{actGoalText(act, today, { season: false, min: false })} · {st?.todayDone ? t('done today') : t('still open today')}</p>
      </div>
      <button type="button" class="x" aria-label={t('Close')} onclick={close}><X size={20} aria-hidden="true" /></button>
    </div>

    <button type="button" class="btn hi go" onclick={go} data-start="sheet"><Play size={22} aria-hidden="true" />{t('Now {n} min', { n })}</button>

    <div class="chips" role="group" aria-label={t('Duration')}>
      {#each CHIPS as m (m)}
        <button type="button" class="chip num" class:on={chipOn(m)} aria-pressed={chipOn(m)} onclick={() => pick(m)} data-min-chip={m}>{m}</button>
      {/each}
      <button type="button" class="chip other" class:on={otherOn} aria-pressed={otherOn} onclick={() => ((other = true), (own = String(n)))}>{t('other|duration')}</button>
    </div>
    {#if other}
      <label class="own"><span class="lbl">{t('Minutes')}</span><input class="inp num" type="number" inputmode="numeric" min="1" max="600" bind:value={own} data-min-own /></label>
    {/if}
    <p class="line">{startLine(start)}</p>

    <ul class="rows">
      <li>
        <button type="button" class="row" onclick={tickOnly} data-tick-only>
          <span class="ri" aria-hidden="true"><Check size={18} /></span>
          <span class="rt">{#if st?.todayDone}<b>{t('Take today’s tick back')}</b><small>{t('with «Undo»')}</small>{:else}<b>{t('Only tick off')}</b><small>{t('meditated already, without the clock')}</small>{/if}</span>
        </button>
      </li>
      <li>
        <a class="row" href="#/flow/act/{encodeURIComponent(actId)}" onclick={close} data-to="meditation">
          <ActIcon icon={act.icon} ring="rest" size={18} />
          <span class="rt"><b>{t('To the meditation page')}</b><small>{t('Templates, log, stars')}</small></span>
          <ChevronRight size={18} aria-hidden="true" />
        </a>
      </li>
    </ul>
  {/if}
</dialog>

<style>
  .mss {
    width: min(480px, calc(100vw - 24px));
    padding: 22px 24px 18px;
    border-radius: var(--radius-card);
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .ht {
    flex: 1;
    min-width: 0;
  }
  .ttl {
    margin: 0;
    font: 700 var(--fs-sub)/1.2 var(--font-body);
  }
  .muted {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -8px -10px 0 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .go {
    width: 100%;
    min-height: 64px;
    justify-content: center;
    gap: 10px;
    border-radius: 14px;
    font: 700 var(--fs-sub)/1.2 var(--font-body);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
  .chip {
    min-width: 50px;
    min-height: 44px;
    padding: 0 14px;
    border: 1.5px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 600 var(--fs-body)/1 var(--font-body);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--ok-soft);
    color: var(--accent);
  }
  .chip.other {
    border-style: dashed;
    font-weight: 500;
    color: var(--ink-2);
  }
  .chip.other.on {
    border-style: solid;
    color: var(--accent);
  }
  .own {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
  }
  .own .lbl {
    margin: 0;
  }
  .own .inp {
    width: 110px;
    min-height: 44px;
  }
  .line {
    margin: 12px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .rows {
    margin: 14px 0 0;
    padding: 0;
    list-style: none;
  }
  .rows li + li {
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 64px;
    padding: 8px 4px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .ri {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink);
  }
  .rt {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .rt b {
    display: block;
    font-weight: 600;
  }
  .rt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .row > :global(svg:last-child) {
    flex: none;
    color: var(--ink-2);
  }
</style>
