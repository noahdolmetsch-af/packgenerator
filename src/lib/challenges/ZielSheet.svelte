<script>
  /**
   * «Challenges» PR 3: the window to start or change an own daily goal (name, unit, goal per day, first and last day),
   * to end it by hand («End the challenge», the days stay saved) or delete it (asks first, with Undo).
   * `c` is the goal to change or null for a new one; `preset` an idea to take over (SUGGESTIONS of tagesziel.js).
   * onsave(goal) / onstop(goal) / onremove(goal) do the saving in the parent.
   */
  import DateInput from '../ui/DateInput.svelte';
  import { keepTyped } from '../ui/keeptyped.js';
  import { backClose } from '../ui/backclose.js';
  import { UNITS, UNIT_KEYS, newZiel, tageszieleOf, okTime } from '../tagesziel.js';
  import { ensureZielRemind } from '../zielpush.js';
  import { toast } from '../flow/ui.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { open = $bindable(false), c = null, preset = null, today, onsave, onstop, onremove } = $props();

  let dialog = $state();
  let nm = $state('');
  let unit = $state('min');
  let word = $state('');
  let goal = $state('');
  let from = $state('');
  let until = $state('');
  let remind = $state('');
  let bad = $state('');
  const WHY = {
    unsupported: 'This browser cannot get reminders. On the phone it works in Chrome.',
    denied: 'Your browser blocks notifications.',
    not_set_up: 'The server is not set up for this yet.',
    storage_not_set_up: 'The server is not set up for this yet.',
  };
  const UNIT_NAME = { min: 'Minutes', count: 'Count', steps: 'Steps' };

  $effect(() => {
    if (open && dialog && !dialog.open) {
      bad = '';
      if (c) {
        nm = c.name;
        unit = c.unit;
        word = c.word;
        goal = String(c.goal);
        from = c.from;
        until = c.until;
        remind = c.remindAt ?? '';
      } else {
        const p = preset ?? {};
        nm = p.name ? t(p.name) : '';
        unit = p.unit ?? 'min';
        word = p.word ? t(p.word) : '';
        goal = String(p.goal ?? UNITS[unit].goal);
        const n = newZiel({ today, name: 'x', unit, goal: Number(goal), days: p.days });
        from = n.from;
        until = n.until;
        remind = '';
      }
      dialog.showModal();
    }
    if (!open && dialog?.open) dialog.close();
  });
  const pickUnit = (u) => {
    if (!c && Number(goal) === UNITS[unit].goal) goal = String(UNITS[u].goal);
    unit = u;
  };
  async function submit(e) {
    e.preventDefault();
    const g = Math.round(Number(goal));
    if (!nm.trim()) return (bad = t('Give it a name.'));
    if (!(g >= 1 && g <= UNITS[unit].max)) return (bad = t('Whole number from 1 to {n}.', { n: UNITS[unit].max }));
    if (!from || !until || until < from) return (bad = t('The last day comes after the first day.'));
    if (remind && !okTime(remind)) return (bad = t('Enter the time like 16:00.'));
    const next = tageszieleOf([{ ...(c ?? { id: `tz-${today}-${Math.random().toString(36).slice(2, 7)}`, hand: {} }), name: nm, unit, word, goal: g, from, until, remindAt: remind, stopped: false, closed: false }])[0];
    if (!next) return (bad = t('Give it a name.'));
    // a time asks the browser for notifications once and switches the kind on; the challenge is saved either way
    let msg = '';
    if (next.remindAt) {
      const r = await ensureZielRemind();
      if (!r.ok) msg = t(WHY[r.code] ?? 'The server could not be reached. Try again later.');
    }
    open = false;
    await onsave?.(next);
    if (msg) toast(msg);
  }
</script>

<dialog use:keepTyped={'ziel'} class="sheet zs" bind:this={dialog} use:backClose onclose={() => (open = false)} aria-labelledby="zs-h" data-ziel-sheet>
  <form onsubmit={submit}>
    <h2 id="zs-h" class="title">{c ? t('Your challenge') : t('New challenge')}</h2>
    <p class="muted">{t('A goal per day, for example 10 minutes of stretching or 8000 steps. Every day that reaches it counts. Voluntary, changeable any time.')}</p>
    <label><span class="lbl">{t('Name')}</span><input class="inp" type="text" maxlength="40" bind:value={nm} data-ziel-name /></label>
    <div class="fld" role="group" aria-label={t('Unit|challenge')}>
      <span class="lbl">{t('Unit|challenge')}</span>
      <span class="seg">{#each UNIT_KEYS as u (u)}<button type="button" class="btn sm" class:hi={unit === u} aria-pressed={unit === u} onclick={() => pickUnit(u)} data-ziel-unit={u}>{t(UNIT_NAME[u])}</button>{/each}</span>
    </div>
    {#if unit === 'count'}<label><span class="lbl">{t('What do you count?')}</span><input class="inp" type="text" maxlength="20" placeholder={t('e.g. glasses')} bind:value={word} /></label>{/if}
    <label><span class="lbl">{t('Goal per day')}</span><input class="inp num" type="text" inputmode="numeric" bind:value={goal} data-ziel-goal /></label>
    <div class="two">
      <label><span class="lbl">{t('First day')}</span><DateInput bind:value={from} /></label>
      <label><span class="lbl">{t('Last day')}</span><DateInput bind:value={until} min={from} /></label>
    </div>
    <label><span class="lbl">{t('Reminder time on the phone')}</span><input class="inp" type="time" bind:value={remind} data-ziel-remind /><small class="muted">{t('Optional: a reminder every day at this time while the challenge runs. A day that reaches the goal sends none. Leave empty for no reminder.')}</small></label>
    {#if bad}<p class="bad" role="alert">{bad}</p>{/if}
    <div class="acts">
      <button type="submit" class="btn hi" data-ziel-save>{c ? t('Save') : t('Start')}</button>
      {#if c}<button type="button" class="btn" onclick={() => ((open = false), onstop?.(c))}>{t('End the challenge')}</button><button type="button" class="btn" onclick={() => ((open = false), onremove?.(c))}>{t('Delete')}</button>{/if}
      <button type="button" class="btn btn-link" onclick={() => (open = false)}>{t('Cancel')}</button>
    </div>
  </form>
</dialog>

<style>
  form {
    display: grid;
    gap: 12px;
  }
  h2,
  p {
    margin: 0;
  }
  label,
  .fld {
    display: grid;
    gap: 4px;
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .bad {
    color: var(--bad);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
