<script>
  /**
   * The week grid of «Termine und Aufgaben» (Noah 28.10.2026 «danach das Wochenraster wie bei Google»):
   * the days side by side, all-day entries on top, the hours down the side, appointments as blocks in the
   * colour of their calendar, a line for «now». A tap on a block opens it, a tap on an empty place starts
   * a new appointment at that time. The rows come from db.gEvents (src/lib/agenda.js weekLayout).
   */
  import { weekLayout, timeOf, clockIn } from '../agenda.js';
  import { t, locale } from '../i18n.svelte.js';

  let { events, days, today, colors = {}, picked = null, onpick, onnew } = $props();

  const HOUR = 44; // px per hour
  const layout = $derived(weekLayout(events, days));
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const hh = (h) => `${String(h).padStart(2, '0')}:00`;
  const label = (day, opt) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...opt });
  const colorOf = (e) => colors[e.cal] ?? 'var(--accent)';
  const clock = (e, from, to) => (e.allDay ? '' : `${timeOf(e)}–${timeOf({ start: e.end })}`);

  let scroller = $state(null);
  let nowMin = $state(null);
  const tick = () => (nowMin = (({ time }) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3)))(clockIn(new Date().toISOString())));
  $effect(() => {
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  });
  // start at 07:00, or a little before the first appointment of the week when it is earlier
  $effect(() => {
    if (!scroller) return;
    const first = Math.min(7 * 60, ...layout.flatMap((d) => d.timed.map((x) => x.from)));
    scroller.scrollTop = Math.max(0, ((first - 30) / 60) * HOUR);
  });

  function emptyTap(ev, day) {
    if (ev.target !== ev.currentTarget) return;
    const y = ev.clientY - ev.currentTarget.getBoundingClientRect().top;
    const m = Math.min(23 * 60 + 30, Math.floor(((y / HOUR) * 60) / 30) * 30);
    onnew?.(day, `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
</script>

<div class="wk" style:--n={days.length} style:--hour="{HOUR}px" data-week-grid>
  <div class="row head">
    <span class="gut"></span>
    {#each days as d (d)}
      <span class="dh" class:now={d === today}><small>{label(d, { weekday: 'short' })}</small><b>{label(d, { day: 'numeric' })}</b></span>
    {/each}
  </div>
  {#if layout.some((c) => c.allDay.length)}
    <div class="row all">
      <span class="gut"><small>{t('all day')}</small></span>
      {#each layout as c (c.day)}
        <div class="cell">
          {#each c.allDay as e (e.id)}
            <button type="button" class="chip-ev" class:sel={picked === e.id} style:--c={colorOf(e)} onclick={() => onpick?.(e, c.day)}>{e.title}</button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
  <div class="scroll" bind:this={scroller}>
    <div class="body" style:height="{HOUR * 24}px">
      <div class="gut">
        {#each hours as h (h)}<span class="hl" style:top="{h * HOUR}px">{h ? hh(h) : ''}</span>{/each}
      </div>
      {#each layout as c (c.day)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="col" class:now={c.day === today} onclick={(ev) => emptyTap(ev, c.day)}>
          {#each c.timed as x (x.e.id + c.day)}
            <button
              type="button"
              class="ev"
              class:sel={picked === x.e.id}
              class:free={x.e.busy === false}
              style:--c={colorOf(x.e)}
              style:top="{(x.from / 60) * HOUR}px"
              style:height="{Math.max(((x.to - x.from) / 60) * HOUR - 2, 16)}px"
              style:left="{(x.lane / x.lanes) * 100}%"
              style:width="calc({100 / x.lanes}% - 2px)"
              onclick={() => onpick?.(x.e, c.day)}
            >
              <b>{x.e.title}</b>
              {#if x.to - x.from >= 45}<span>{clock(x.e)}</span>{/if}
            </button>
          {/each}
          {#if c.day === today && nowMin != null}<span class="nowline" style:top="{(nowMin / 60) * HOUR}px" aria-hidden="true"></span>{/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .wk {
    --gw: 48px;
    border: 1px solid var(--line);
    border-radius: var(--r-card, 12px);
    background: var(--paper);
    overflow: hidden;
    min-width: 0;
  }
  .row {
    display: grid;
    grid-template-columns: var(--gw) repeat(var(--n), minmax(0, 1fr));
    border-bottom: 1px solid var(--line);
  }
  .gut small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .dh {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    border-left: 1px solid var(--line);
  }
  .dh b {
    font-size: var(--fs-sub);
    line-height: 1.3;
    color: var(--ink);
    min-width: 2rem;
    text-align: center;
    border-radius: 99px;
  }
  .dh.now b {
    background: var(--accent);
    color: var(--paper);
  }
  .all .cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 3px 2px;
    border-left: 1px solid var(--line);
    min-width: 0;
  }
  .all .gut {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .chip-ev {
    --c: var(--accent);
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    padding: 1px 6px;
    border-radius: 6px;
    font-size: var(--fs-small);
    line-height: 1.5;
    background: color-mix(in srgb, var(--c) 35%, var(--paper));
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .scroll {
    max-height: min(70vh, 640px);
    overflow-y: auto;
  }
  .body {
    position: relative;
    display: grid;
    grid-template-columns: var(--gw) repeat(var(--n), minmax(0, 1fr));
  }
  .body .gut {
    position: relative;
  }
  .hl {
    position: absolute;
    right: 4px;
    transform: translateY(-50%);
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .col {
    position: relative;
    border-left: 1px solid var(--line);
    cursor: cell;
    background-image: linear-gradient(to bottom, var(--line) 1px, transparent 1px);
    background-size: 100% var(--hour);
    min-width: 0;
  }
  .col.now {
    background-color: color-mix(in srgb, var(--accent) 5%, transparent);
  }
  .ev {
    --c: var(--accent);
    all: unset;
    box-sizing: border-box;
    position: absolute;
    cursor: pointer;
    overflow: hidden;
    padding: 1px 4px;
    border-radius: 6px;
    border-left: 3px solid var(--c);
    background: color-mix(in srgb, var(--c) 35%, var(--paper));
    color: var(--ink);
    font-size: var(--fs-small);
    line-height: 1.3;
  }
  .ev b {
    display: block;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ev span {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ev.free {
    background: color-mix(in srgb, var(--c) 12%, var(--paper));
  }
  .ev.sel,
  .chip-ev.sel,
  .ev:focus-visible,
  .chip-ev:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 1px;
  }
  .nowline {
    position: absolute;
    left: 0;
    right: 0;
    height: 0;
    border-top: 2px solid var(--bad);
    pointer-events: none;
  }
</style>
