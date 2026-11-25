<script>
  /**
   * «Mein Tag» day templates (Noah 25.11.2026 «1-3», idea 3): keep the own entries of this day as a template, put a template on this day
   * or on several days. Everything is an ordinary own entry afterwards; the page saves and offers Undo (rules: src/lib/tag/vorlage.js).
   * day, today; pattern: the own entries of this day [{ title, time }]; templates: [{ id, name, items }]; days: the days that can be picked.
   * onsave(name), onput(tpl, days), ondelete(tpl).
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, tn } from '../i18n.svelte.js';
  import { dayName } from '../woche/words.js';
  import '../ui/daumen.css';

  let { day, pattern = [], templates = [], days = [], onsave, onput, ondelete, onclose } = $props();

  /* svelte-ignore state_referenced_locally */
  let name = $state(dayName(day, true).split(' ')[0]);
  let more = $state(null); // id of the template whose day picker is open
  let picked = $state([]);
  let dialog;
  $effect(() => {
    dialog.showModal();
  });
  const toggle = (d) => (picked = picked.includes(d) ? picked.filter((x) => x !== d) : [...picked, d]);
  async function save(e) {
    e?.preventDefault();
    if (!name.trim() || !pattern.length) return;
    await onsave?.(name.trim());
  }
  async function putOn(tpl, list) {
    if (!list.length) return;
    await onput?.(tpl, list);
    dialog?.close();
  }
</script>

<dialog class="sheet from-below vorlage" bind:this={dialog} use:backClose={() => dialog?.close()} onclose={() => onclose?.()} aria-labelledby="vl-h" data-vorlage-sheet>
  <div class="head">
    <h2 id="vl-h">{t('Day templates')}</h2>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <form class="keep" onsubmit={save} novalidate>
    <label class="flbl" for="vl-name">{t('Keep this day as a template')}</label>
    {#if pattern.length}
      <p class="hint">{tn(pattern.length, 'The {n} own entry of this day is kept.', 'The {n} own entries of this day are kept.')}</p>
      <div class="inline">
        <input id="vl-name" class="inp" bind:value={name} maxlength="40" autocomplete="off" enterkeyhint="done" data-vorlage-name />
        <button type="submit" class="btn hi" data-vorlage-save>{t('Keep|template')}</button>
      </div>
    {:else}
      <p class="hint" data-vorlage-none>{t('This day has no own entries yet. Add some, then keep the day as a template.')}</p>
    {/if}
  </form>

  <h3>{t('Your templates')}</h3>
  {#if templates.length}
    <ul class="tpls">
      {#each templates as tpl (tpl.id)}
        <li data-vorlage={tpl.id}>
          <div class="top">
            <span class="what"><b>{tpl.name}</b><small>{tn(tpl.items.length, '{n} entry', '{n} entries')}: {tpl.items.slice(0, 3).map((i) => i.title).join(', ')}{tpl.items.length > 3 ? ' …' : ''}</small></span>
          </div>
          <div class="acts">
            <button type="button" class="btn" data-vorlage-here onclick={() => putOn(tpl, [day])}>{t('Put on this day')}</button>
            <button type="button" class="btn" data-vorlage-more aria-expanded={more === tpl.id} onclick={() => ((more = more === tpl.id ? null : tpl.id), (picked = []))}>{t('On several days …')}</button>
            <button type="button" class="btn del" data-vorlage-delete aria-label={t('Delete template «{name}»', { name: tpl.name })} onclick={() => ondelete?.(tpl)}>{t('Delete')}</button>
          </div>
          {#if more === tpl.id}
            <div class="picker" role="group" aria-label={t('Days')}>
              {#each days as d (d)}
                <label class:on={picked.includes(d)}><input type="checkbox" checked={picked.includes(d)} onchange={() => toggle(d)} data-vorlage-day={d} /> {dayName(d).split(' ').slice(0, 2).join(' ')}</label>
              {/each}
            </div>
            <button type="button" class="btn hi go" disabled={!picked.length} data-vorlage-apply onclick={() => putOn(tpl, picked)}>{tn(picked.length, 'Put on {n} day', 'Put on {n} days')}</button>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="hint" data-vorlage-empty>{t('No template yet. Keep a day that went well, then put it on other days.')}</p>
  {/if}
</dialog>

<style>
  .vorlage {
    width: min(480px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
  }
  h3 {
    margin: 16px 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: var(--r-2);
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .flbl {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .hint {
    margin: 4px 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .inline {
    display: flex;
    gap: 8px;
  }
  .inline .inp {
    flex: 1;
    min-width: 0;
  }
  .tpls {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .tpls li {
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-3);
    background: var(--card);
  }
  .what {
    display: grid;
    min-width: 0;
  }
  .what small {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .picker {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0 8px;
  }
  .picker label {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .picker label.on {
    background: var(--hi);
    color: var(--hi-ink);
    border-color: var(--hi);
  }
  .picker input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .go {
    width: 100%;
  }
</style>
