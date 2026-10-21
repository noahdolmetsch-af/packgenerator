<script>
  /**
   * Paket Y «Lernen» (Noah 20.10.2026 «2a»): «Wie war es draussen?» on the weather page. After a ride (today
   * or yesterday) two taps: too cold / just right / too warm, where (hands, feet, body, head), and what you
   * wore if you like. The weather of that day comes from the core. Your notes are listed with their weather;
   * each can be deleted (the app's question, Undo). The planning card shows them for a ride at a similar
   * temperature (gefuehl.js feelHints).
   */
  import { liveQuery } from 'dexie';
  import { Trash2, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { FEEL_KEY, FEELS, PARTS, FEEL_TEXT, PART_TEXT, feelsOf, addFeel, removeFeel } from './gefuehl.js';
  import { dayLine, hoursBetween, atLocal, localDate } from './kern.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { core = null } = $props();
  const q = liveQuery(() => db.settings.get(FEEL_KEY));
  const list = $derived(feelsOf($q?.value));
  const save = (l) => db.settings.put({ key: FEEL_KEY, value: l });

  const off = $derived(core?.offset ?? 0);
  const today = $derived(core ? localDate(Date.now(), off) : '');
  const yesterday = $derived(today ? localDate(Date.parse(`${today}T12:00:00Z`) - 864e5, 0) : '');
  let which = $state('today');
  const day = $derived(which === 'today' ? today : yesterday);
  const line = $derived(core && day ? dayLine(hoursBetween(core, atLocal(day, 7, off), atLocal(day, 19, off))) : null);
  let feel = $state('');
  let parts = $state([]);
  let wore = $state('');
  let saved = $state(false);
  const flip = (p) => (parts = parts.includes(p) ? parts.filter((x) => x !== p) : [...parts, p]);

  async function keep() {
    await save(addFeel(list, { day, line, feel, parts, wore }));
    feel = '';
    parts = [];
    wore = '';
    saved = true;
    setTimeout(() => (saved = false), 3000);
  }
  async function del(x) {
    const name = wd(x.day);
    if ((await askDelete({ title: t('Delete the note of {day}?', { day: name }) })) !== 'delete') return;
    const before = list;
    await deleteWithUndo({ run: () => save(removeFeel(list, x.id)), undo: () => save(before), text: t('Note of {day} deleted.', { day: name }), name });
  }
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });
</script>

<p class="rc-note">{t('Note after a ride how it felt. Next time at a similar temperature the app reminds you.')}</p>
{#if core}
  <div class="fc-row" role="group" aria-label={t('Which ride')}>
    <button type="button" class="fc-chip" aria-pressed={which === 'today'} onclick={() => (which = 'today')}>{t('Today')}</button>
    <button type="button" class="fc-chip" aria-pressed={which === 'yesterday'} onclick={() => (which = 'yesterday')}>{t('Yesterday')}</button>
    {#if line}<small>{num(line.feelsMin ?? line.tmin)}–{num(line.tmax)} °C{line.windMax ? ` · ${num(line.windMax)} km/h` : ''}{line.rainFrom ? ` · ${t('rain')}` : ''}</small>{/if}
  </div>
  <div class="fc-row" role="group" aria-label={t('How it felt')}>
    {#each FEELS as f (f)}<button type="button" class="fc-chip" aria-pressed={feel === f} onclick={() => (feel = f)} data-feel={f}>{t(FEEL_TEXT[f])}</button>{/each}
  </div>
  {#if feel && feel !== 'ok'}
    <div class="fc-row" role="group" aria-label={t('Where')}>
      {#each PARTS as p (p)}<button type="button" class="fc-chip" aria-pressed={parts.includes(p)} onclick={() => flip(p)} data-feel-part={p}>{t(PART_TEXT[p])}</button>{/each}
    </div>
  {/if}
  {#if feel}
    <input class="inp" type="text" bind:value={wore} maxlength="200" placeholder={t('What you wore (optional), e.g. thin gloves')} aria-label={t('What you wore')} data-feel-wore />
    <button type="button" class="btn" onclick={keep} disabled={!line} data-feel-save><Check size={18} aria-hidden="true" />{t('Keep the note')}</button>
  {/if}
  {#if saved}<p class="rc-note" role="status">{t('Kept. The app reminds you at a similar temperature.')}</p>{/if}
{/if}
{#if list.length}
  <ul class="fc-list" data-feel-list>
    {#each [...list].reverse().slice(0, 8) as x (x.id)}
      <li>
        <span><b>{wd(x.day)}</b> · {num(x.tmin)} °C · {t(FEEL_TEXT[x.feel])}{x.parts.length ? ` (${x.parts.map((p) => t(PART_TEXT[p])).join(', ')})` : ''}{x.wore ? ` · ${x.wore}` : ''}</span>
        <button type="button" class="fc-x" aria-label={t('Delete the note of {day}?', { day: wd(x.day) })} onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .fc-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .fc-row small {
    color: var(--ink-2);
  }
  .fc-chip {
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .fc-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .fc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .fc-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-wrap: break-word;
  }
  .fc-list span {
    flex: 1;
    min-width: 0;
  }
  .fc-x {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
