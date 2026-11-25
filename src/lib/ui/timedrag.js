/**
 * «Termine ziehen» (Noah 24.11.2026 «wunsch hier und überall sonst wo sinnvoll: termine und trainings und
 * aktivitäten können einfach per drag and drop verschoben, editiert, gelöscht werden», «1a 2b 3a 4a»): ONE building
 * block to move an entry in time, used by the week grid of «Termine und Aufgaben», «Mein Tag», the Wochenplan and
 * «Woche planen», so every place feels the same.
 *
 * - Mouse and pen: a handle (`data-drag-grip`) moves the entry, the lower edge (`data-drag-size`) changes its length;
 *   with `whole: true` the entry itself can be pulled too (like in Google Calendar), a plain click still opens it.
 * - Finger: long press (about half a second) on the entry itself, then drag; before that the page scrolls as always.
 * - Keyboard: the arrow keys on the handle (up and down by a quarter hour, left and right by a day).
 * - Escape or a cancelled pointer puts everything back. Nothing is saved while dragging; `oncommit` is called once.
 * - The block does not know pixels per hour: it reports how far the pointer went (dx, dy) and over which day
 *   element (`data-day`) it is; the page turns that into minutes with its own scale (`minutesOf`), so a page whose
 *   hours are not the same height (Mein Tag) works too.
 * Every place that uses it also offers «Move …» in its menu (`MoveSheet.svelte`): drag is never the only way.
 */

/** The step of one move, in minutes. */
export const SNAP = 15;
export const DAY_MIN = 1440;
/** How long the finger must rest before an entry lifts (ms), and how far it may wander before it counts as scrolling (px). */
export const HOLD_MS = 450;
export const WANDER_PX = 8;

export const snapMin = (m, step = SNAP) => Math.round(m / step) * step;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Pixels → minutes on a page with a fixed height per hour (pages with their own scale pass their own converter). */
export const linearMinutes = (hh) => (dy) => (dy / hh) * 60;

/**
 * Where a block {start, end} (minutes since 00:00) stands when it is moved or stretched by `by` minutes.
 * Moving keeps the length and stays inside the day; stretching keeps the start (5 minutes up to `maxLen`).
 */
export function shapeSpan(span, mode, by, { step = SNAP, maxLen = 480 } = {}) {
  if (mode === 'size') return { start: span.start, end: clamp(snapMin(span.end + by, step), span.start + step, Math.min(span.start + maxLen, DAY_MIN)) };
  const len = Math.min(span.end - span.start, DAY_MIN);
  const start = clamp(snapMin(span.start + by, step), 0, DAY_MIN - len);
  return { start, end: start + len };
}

const pad = (n) => String(n).padStart(2, '0');
export const clockOf = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const minutesOfClock = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** A day «YYYY-MM-DD» moved by n days (calendar arithmetic, no time zone involved). */
export function addDaysTo(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
/** Whole days from a to b («YYYY-MM-DD»). */
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/**
 * A wall-clock moment {day, time} moved by whole days and minutes (the clock of its own time zone stays: an
 * appointment in London is moved on London's clock). Minutes may carry over midnight.
 */
export function shiftClock({ day, time }, dDays = 0, dMin = 0) {
  const total = minutesOfClock(time) + dMin;
  const carry = Math.floor(total / DAY_MIN);
  const m = total - carry * DAY_MIN;
  return { day: addDaysTo(day, dDays + carry), time: clockOf(m) };
}

/** The day element («data-day») under a point of the screen, or null. */
export function dayAtPoint(x, y, doc = typeof document === 'undefined' ? null : document) {
  const el = doc?.elementFromPoint?.(x, y);
  return el?.closest?.('[data-day]')?.dataset.day ?? null;
}

/**
 * Svelte action for one movable entry: `<a use:timedrag={{ day, enabled, onpreview, oncommit, onstep, label }}>`.
 *   day:       the day the entry stands on now (to tell «over another day» from «over the same day»)
 *   enabled:   false = nothing moves (locked entry); the page shows why
 *   whole:     true = a mouse may pull the entry itself, not only its handle
 *   keys:      true = the arrow keys work on the entry itself when it has the focus (not only on a handle)
 *   onpreview({ mode, dx, dy, over }) | onpreview(null): while dragging (the page moves the block); null when it ends
 *   oncommit({ mode, dx, dy, over }): once, on letting go after a real move (more than 4 px or over another day)
 *   onstep({ mode, minutes, days }): keyboard on the handle
 * The handle is any child with `data-drag-grip`; the lower edge any child with `data-drag-size`.
 */
export function timedrag(node, opts = {}) {
  let o = opts;
  let st = null; // { id, mode, x0, y0, dx, dy, over, active, timer, touch }
  let swallow = false;

  const modeOf = (target) => (target.closest?.('[data-drag-size]') && node.contains(target.closest('[data-drag-size]')) ? 'size' : target.closest?.('[data-drag-grip]') && node.contains(target.closest('[data-drag-grip]')) ? 'move' : null);

  function begin(mode) {
    if (!st || st.active) return;
    st.active = true;
    st.mode = mode;
    clearTimeout(st.timer);
    node.setPointerCapture?.(st.id);
    document.documentElement.classList.add('td-dragging');
    window.getSelection?.()?.removeAllRanges(); // a mouse that pressed on text must not keep selecting it
    if (st.touch) navigator.vibrate?.(12);
    o.onpreview?.({ mode, dx: 0, dy: 0, over: null });
  }
  function end() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', end);
    if (!st) return;
    clearTimeout(st.timer);
    if (st.active) {
      document.documentElement.classList.remove('td-dragging');
      try {
        node.releasePointerCapture?.(st.id);
      } catch {
        /* the pointer is already gone */
      }
    }
    const was = st.active;
    st = null;
    if (was) o.onpreview?.(null);
  }
  function down(e) {
    if (o.enabled === false || st || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const handle = modeOf(e.target);
    const touch = e.pointerType === 'touch';
    if (!handle && !touch && !o.whole) return; // a mouse or pen needs the handle (or `whole`); a finger lifts the entry itself after the hold
    st = { id: e.pointerId, mode: handle ?? 'move', x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, over: null, active: false, timer: 0, touch, pull: !handle && !touch };
    // on the window, not on the entry: a fast pull leaves the entry before the first move arrives
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', end);
    if (handle) {
      e.preventDefault();
      begin(handle);
    } else {
      st.timer = setTimeout(() => begin('move'), HOLD_MS);
    }
  }
  function move(e) {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x0;
    const dy = e.clientY - st.y0;
    if (!st.active) {
      if (st.pull) {
        if (Math.hypot(dx, dy) <= 4) return; // still a click
        begin('move');
      } else {
        if (Math.hypot(dx, dy) > WANDER_PX) end(); // the finger moved before the hold: it was scrolling
        return;
      }
    }
    e.preventDefault();
    st.dx = dx;
    st.dy = dy;
    if (st.mode === 'move') {
      // the entry itself sits under the pointer (and inside its own day): look through it
      const pe = node.style.pointerEvents;
      node.style.pointerEvents = 'none';
      const over = dayAtPoint(e.clientX, e.clientY);
      node.style.pointerEvents = pe;
      st.over = over && over !== o.day ? over : null;
    }
    o.onpreview?.({ mode: st.mode, dx, dy, over: st.over });
  }
  function up(e) {
    if (!st || e.pointerId !== st.id) return;
    const g = st;
    const real = g.active && (Math.abs(g.dy) >= 4 || g.over);
    if (g.active) swallow = true; // the click that follows a drag must not open the entry
    end();
    if (real) o.oncommit?.({ mode: g.mode, dx: g.dx, dy: g.dy, over: g.over });
  }
  const click = (e) => {
    if (!swallow) return;
    swallow = false;
    e.preventDefault();
    e.stopPropagation();
  };
  // a finger that has lifted an entry must not scroll the page; the context menu of a long press must not open
  const touchmove = (e) => st?.active && e.cancelable && e.preventDefault();
  const menu = (e) => (st?.touch ? e.preventDefault() : undefined);
  // a link or an image inside the entry would start the browser's own drag and swallow the pointer: pulling is ours
  const native = (e) => o.enabled !== false && e.preventDefault();
  function key(e) {
    const onHandle = modeOf(e.target) === 'move' || (o.keys && e.target === node);
    if (o.enabled === false || !onHandle) return;
    const by = { ArrowUp: [0, -SNAP], ArrowDown: [0, SNAP], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (!by) return;
    e.preventDefault();
    o.onstep?.({ mode: e.shiftKey && by[1] ? 'size' : 'move', minutes: by[1], days: by[0] });
  }
  const esc = (e) => e.key === 'Escape' && st?.active && end();

  node.addEventListener('pointerdown', down);
  node.addEventListener('click', click, true);
  node.addEventListener('touchmove', touchmove, { passive: false });
  node.addEventListener('contextmenu', menu);
  node.addEventListener('dragstart', native);
  node.addEventListener('keydown', key);
  window.addEventListener('keydown', esc);
  return {
    update(next) {
      o = next ?? {};
    },
    destroy() {
      end();
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('click', click, true);
      node.removeEventListener('touchmove', touchmove);
      node.removeEventListener('contextmenu', menu);
      node.removeEventListener('dragstart', native);
      node.removeEventListener('keydown', key);
      window.removeEventListener('keydown', esc);
    },
  };
}

/** The look that comes with the block (one small style sheet, like sortable.js): the lifted entry and a calm page while dragging. */
const CSS = `.td-dragging,.td-dragging *{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.td-lift{position:relative;z-index:6;box-shadow:0 12px 28px var(--shadow),0 2px 6px var(--shadow);cursor:grabbing}
[data-td-body]{-webkit-touch-callout:none}`;
if (typeof document !== 'undefined' && !document.getElementById('td-css')) {
  const el = document.createElement('style');
  el.id = 'td-css';
  el.textContent = CSS;
  document.head.append(el);
}
