<script>
  /**
   * «Rennen-Check» (Ziel 6, Noah 27.10.2026 «1b 2b»): the paper check of a race on the page «Rennen
   * detailliert planen» (#/racecheck/<tripId>). Five sheets as small tabs; every field saves by itself into the race
   * (stored.check, in the backup). «Load answers» takes the file of the fillable sheets page.
   * Gets `ctx` from RaceDetail; the sheets live in check-lib.js.
   */
  import { Upload, Eraser, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { SHEETS, STATIONS, RACE_QUESTIONS, BAGS, LIST, SLEEP_COLS, SLEEP_ROWS, NIGHT, valueOf, withValue, answersFrom, filled } from './check-lib.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { askDelete } from '../ui/ask.js';
  import { t } from '../i18n.svelte.js';

  let { ctx } = $props();

  const KEY = 'race-check-sheet';
  let sheet = $state(readSheet());
  function readSheet() {
    try {
      const s = localStorage.getItem(KEY);
      return SHEETS.some((x) => x.id === s) ? s : SHEETS[0].id;
    } catch {
      return SHEETS[0].id;
    }
  }
  function go(id) {
    sheet = id;
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* the tab is only a convenience */
    }
    document.querySelector('[data-race-check]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  const at = $derived(SHEETS.findIndex((x) => x.id === sheet));
  const cur = $derived(SHEETS[at]);
  const check = $derived(ctx.stored.check ?? null);
  const v = (k) => valueOf(check, k);
  const when = (x) => (/^\d/.test(x) ? x : t(x)); // «17:00» stays, «Sunday» is a word

  // typing saves after a short pause, leaving the field at once
  const waiting = new Map();
  function put(k, value) {
    clearTimeout(waiting.get(k)?.timer);
    waiting.delete(k);
    ctx.save((s) => ({ ...s, check: withValue(s.check, k, value) }));
  }
  function typed(k, value) {
    clearTimeout(waiting.get(k)?.timer);
    waiting.set(k, { value, timer: setTimeout(() => put(k, value), 700) });
  }
  const flush = (k) => waiting.has(k) && put(k, waiting.get(k).value);
  $effect(() => () => [...waiting.keys()].forEach(flush));

  // answers from the fillable sheets page (a .json file); Undo puts the check back
  let fileEl = $state(null);
  let note = $state('');
  async function load(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    let got = null;
    try {
      got = answersFrom(JSON.parse(await f.text()));
    } catch {
      got = null;
    }
    if (!got) return (note = t('This file has no answers for the race check.'));
    note = '';
    let before = null;
    await ctx.save((s) => {
      before = s.check ?? null;
      return { ...s, check: { values: { ...(s.check?.values ?? {}), ...got.values }, at: new Date().toISOString() } };
    });
    offerDone(t('{n} answers loaded.', { n: got.n }), () => ctx.save((s) => ({ ...s, check: before })));
  }

  async function clearSheet() {
    const ok = await askDelete({ title: t('Empty «{name}»?', { name: t(cur.title) }), text: t('Your answers on this sheet are removed. You can undo it right after.'), label: t('Empty') });
    if (!ok) return;
    let before = null;
    await ctx.save((s) => {
      before = s.check ?? null;
      const values = Object.fromEntries(Object.entries(s.check?.values ?? {}).filter(([k]) => !k.startsWith(`${sheet}.`)));
      return { ...s, check: { values, at: new Date().toISOString() } };
    });
    offerDone(t('«{name}» is empty.', { name: t(cur.title) }), () => ctx.save((s) => ({ ...s, check: before })));
  }
</script>

{#snippet area(k, label, ph = '', rows = 2)}
  <label class="rc-lab">{label}<textarea class="inp" {rows} placeholder={ph} value={v(k)} oninput={(e) => typed(k, e.currentTarget.value)} onblur={() => flush(k)} data-check-field={k}></textarea></label>
{/snippet}
{#snippet line(k, label, ph = '')}
  <label class="rc-lab">{label}<input class="inp" type="text" placeholder={ph} value={v(k)} oninput={(e) => typed(k, e.currentTarget.value)} onblur={() => flush(k)} data-check-field={k} /></label>
{/snippet}
{#snippet tick(k, label)}
  <label class="ck-tick"><input type="checkbox" checked={!!v(k)} onchange={(e) => put(k, e.currentTarget.checked)} data-check-field={k} />{label}</label>
{/snippet}

<div class="ck" data-race-part="check" data-race-check>
  <p class="rc-note">{t('The paper check of the race, five sheets. Everything is a suggestion: write your own, leave out what does not fit.')}</p>
  <div class="ck-tabs" role="tablist" aria-label={t('Sheets')}>
    {#each SHEETS as s (s.id)}
      {@const f = filled(check, s.id)}
      <button type="button" role="tab" class="rc-tab" aria-selected={s.id === sheet} aria-current={s.id === sheet ? 'page' : undefined} onclick={() => go(s.id)} data-check-tab={s.id}>
        {t(s.tab)}{#if f.done}<small class="ck-n">{f.done}</small>{/if}
      </button>
    {/each}
  </div>

  <section class="rc-box" aria-labelledby="ck-h" data-check-sheet={cur.id}>
    <h2 id="ck-h" class="rc-h2">{t(cur.title)}</h2>
    <p class="rc-note">{t(cur.lead)}</p>

    {#if cur.id === 'ablauf'}
      {#each STATIONS as s (s.k)}
        <div class="ck-step">
          <h3 class="ck-h3"><span class="ck-letter" aria-hidden="true">{s.k}</span>{t(s.t)}</h3>
          {#if s.tip}<p class="rc-note">{t(s.tip)}</p>{/if}
          {#if s.extra === 'race'}
            <div class="ck-two">
              {@render line('ablauf.race', t('Race'), ctx.trip.title)}
              {@render line('ablauf.racedate', t('Date'))}
              {@render line('ablauf.racekm', t('km / m up'))}
              {@render line('ablauf.racedays', t('Days planned'))}
            </div>
            <div class="ck-ticks">{#each RACE_QUESTIONS as q (q.k)}{@render tick(`ablauf.q.${q.k}`, t(q.label))}{/each}</div>
            {@render line('ablauf.depotkm', t('Drop bag at km'))}
          {/if}
          {@render area(`ablauf.${s.k}`, s.extra === 'race' ? t('Notes') : t('Your rule'), s.ph ? t(s.ph) : '')}
          {#if s.extra === 'test'}
            <div class="ck-two">{@render line('ablauf.testdate', t('Test ride on'))}{@render line('ablauf.testkm', t('km'))}</div>
            {@render area('ablauf.testbad', t('What was in the way?'))}
          {/if}
        </div>
      {/each}
      <div class="ck-step">{@render area('ablauf.missing', t('What is missing in this order? What would you do differently?'), '', 3)}</div>
    {:else if cur.id === 'setup'}
      <svg class="ck-bike" viewBox="0 0 760 300" role="img" aria-label={t('Sketch of a bike with five numbered bags')}>
        <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="170" cy="210" r="78" /><circle cx="560" cy="210" r="78" /><path d="M170 210 L300 90 L470 90 L370 215 Z" /><path d="M470 90 L560 210" /><path d="M300 90 L285 55" /><path d="M262 52 L310 50" /><path d="M470 90 L480 42 L520 40" /></g>
        <g class="ck-bags" stroke-width="2"><path d="M205 58 C175 50 150 62 158 78 C172 90 232 78 262 62 Z" /><path d="M335 96 L455 96 L400 164 L355 164 Z" /><rect x="395" y="72" width="62" height="16" rx="6" /><path d="M330 182 L362 210 L352 220 L318 192 Z" /><rect x="487" y="26" width="22" height="30" rx="6" /><rect x="532" y="26" width="22" height="30" rx="6" /></g>
        <g class="ck-num" font-size="18" font-weight="700"><text x="190" y="44">1</text><text x="420" y="66">2</text><text x="390" y="140">3</text><text x="300" y="186">4</text><text x="512" y="20">5</text></g>
      </svg>
      <p class="rc-note">{t('The numbers are the bags below. A bag is missing? Write it under «New bags».')}</p>
      {#each BAGS as b, i (b.name)}
        <div class="ck-step">
          <h3 class="ck-h3">{#if b.n}<span class="ck-letter" aria-hidden="true">{b.n}</span>{/if}{t(b.name)}</h3>
          {@render area(`setup.${i}.v`, t('Contents|bag'), t(b.ph))}
          <div class="ck-two">{@render line(`setup.${i}.g`, t('empty (g)'))}{@render line(`setup.${i}.full`, t('full (g)'))}</div>
        </div>
      {/each}
      <div class="ck-step">
        {@render line('setup.total', t('Weight target in all (without bike and water)'), t('e.g. 4 kg'))}
        {@render area('setup.gone', t('No longer along'))}
        {@render area('setup.newbags', t('New bags / changes'))}
      </div>
    {:else if cur.id === 'liste'}
      {#each LIST as r, i (r.name)}
        <div class="ck-step">
          <h3 class="ck-h3">{t(r.name)}</h3>
          {@render area(`liste.${i}.v`, t('What'), r.ph ? t(r.ph) : '')}
          <div class="ck-ticks">{@render tick(`liste.${i}.on`, t('always along'))}</div>
          <div class="ck-two">{@render line(`liste.${i}.w`, t('only if …'), r.w ? t(r.w) : '')}{@render line(`liste.${i}.bag`, t('Bag'))}</div>
        </div>
      {/each}
    {:else if cur.id === 'schlaf'}
      <div class="ck-cols">
        {#each SLEEP_COLS as c, j (c)}
          <div class="ck-step">
            <h3 class="ck-h3">{t(c)}</h3>
            {#each SLEEP_ROWS as r, i (r)}{@render line(`schlaf.${i}.${j}`, t(r))}{/each}
          </div>
        {/each}
      </div>
      <div class="ck-step">
        {@render area('schlaf.own', t('Your own variant (e.g. ride through 1 night, then a hotel)'), '', 3)}
        {@render area('schlaf.rule', t('Sleep rule for the way'), t('e.g. 4–6 h per night between 00:00 and 04:30; a 20 min nap in the day'))}
      </div>
    {:else if cur.id === 'nacht'}
      {#each NIGHT as n, i (n[0])}
        <div class="ck-step ck-time">
          <b class="ck-at">{when(n[0])}</b>
          <div>{@render area(`nacht.${i}`, t(n[1]), n[2] ? t(n[2]) : '')}</div>
        </div>
      {/each}
      <div class="ck-step">{@render area('nacht.help', t('What would have helped you most on the phone in this night?'), '', 3)}</div>
    {/if}

    <div class="ck-nav">
      {#if at > 0}<button type="button" class="btn" onclick={() => go(SHEETS[at - 1].id)} data-check-prev><ChevronLeft size={16} aria-hidden="true" />{t(SHEETS[at - 1].tab)}</button>{:else}<span></span>{/if}
      {#if at < SHEETS.length - 1}<button type="button" class="btn hi" onclick={() => go(SHEETS[at + 1].id)} data-check-next>{t(SHEETS[at + 1].tab)}<ChevronRight size={16} aria-hidden="true" /></button>{/if}
    </div>
  </section>

  <section class="rc-box" aria-labelledby="ck-more">
    <h2 id="ck-more" class="rc-h2">{t('Answers')}</h2>
    <p class="rc-note">{t('Everything saves by itself in this race and is in the backup. Answers from the fillable sheets page come in as a file.')}</p>
    <div class="rc-acts">
      <button type="button" class="btn sm" onclick={() => fileEl?.click()} data-check-load><Upload size={16} aria-hidden="true" />{t('Load answers')}</button>
      <button type="button" class="btn sm" onclick={clearSheet} data-check-clear><Eraser size={16} aria-hidden="true" />{t('Empty this sheet')}</button>
    </div>
    <input bind:this={fileEl} type="file" accept=".json,application/json" hidden onchange={load} data-check-file />
    {#if note}<p class="rc-warn" role="status">{note}</p>{/if}
  </section>
</div>

<style>
  .ck {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .ck-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .ck-tabs .rc-tab {
    cursor: pointer;
  }
  .ck-n {
    min-width: 1.4em;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--line);
    color: var(--ink);
    font-size: var(--fs-small);
    text-align: center;
  }
  .ck-step {
    display: grid;
    gap: 8px;
    padding: 12px 0;
    border-top: 1px solid var(--line);
    min-width: 0;
  }
  .ck-h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font: 600 var(--fs-body) var(--font-body);
  }
  .ck-letter {
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--paper);
    font-size: var(--fs-small);
    flex: none;
  }
  .ck-two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 8px;
  }
  .ck-ticks {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
  }
  .ck-tick {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  .ck-tick input {
    width: 20px;
    height: 20px;
  }
  .ck-bike {
    width: 100%;
    max-width: 520px;
    height: auto;
    color: var(--ink-2);
  }
  .ck-bags {
    fill: var(--paper-2);
    stroke: var(--accent);
  }
  .ck-num {
    fill: var(--accent);
  }
  .ck-cols {
    display: grid;
    gap: 0 16px;
  }
  @media (min-width: 900px) {
    .ck-cols {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .ck-time {
    grid-template-columns: 4.5rem minmax(0, 1fr);
    align-items: start;
  }
  .ck-at {
    padding-top: 2px;
    font-variant-numeric: tabular-nums;
  }
  .ck-nav {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
</style>
