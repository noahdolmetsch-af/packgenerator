<script>
  /**
   * AB2 «Eigene Frage anlegen» (from below on a phone): name, area, answer (scale 1–10, yes / no, number
   * with unit, text), unit with the quick choice kg, min, h, km, «Wie oft fragen?» with its times, a
   * preview «So fragt Heute» and «In Rückblick und Balance zeigen». An own question can only be answered
   * by hand («nur von Hand möglich»). An existing one can be changed or removed (its answers stay).
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { X, Gauge, CircleCheck, Hash, Type, Hand, Check, Trash2 } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { AREAS, OWN_AREA, ownOf, everyOf } from '../abfragen.js';
  import IntervalPick from './IntervalPick.svelte';
  import AnswerInput from './AnswerInput.svelte';
  import { areaName, qText, kindLabel } from './words.js';
  import '../bikes/velo-dlg.css';
  import './ab.css';

  // Noah 20.10.2026 «editieren und löschen …, neue pro Gruppe»: also a question of the list can be changed here
  // (its text, group and interval; its answer kind stays, the history reads it). area: the group of a new one;
  // every: the interval as set now; areas: the groups as the person has them [{ key, name }].
  let { question = null, area: areaIn = OWN_AREA, every: everyIn = undefined, areas = null, onsave, ondelete, onclose } = $props();
  let dialog;
  // svelte-ignore state_referenced_locally
  const builtin = !!question && !question.own;
  // svelte-ignore state_referenced_locally
  const start = question ?? { text: '', area: areaIn, form: { kind: 'scale' }, every: { kind: 'daily', time: '20:00' }, show: true };
  // svelte-ignore state_referenced_locally
  const startText = question ? qText(question) : '';
  // svelte-ignore state_referenced_locally
  const groups = areas ?? [...AREAS.map((a) => ({ key: a.key, name: areaName(a.key) })), { key: OWN_AREA, name: areaName(OWN_AREA) }];
  let name = $state(startText);
  let area = $state(start.area);
  let kind = $state(start.form.kind);
  let unit = $state(start.form.unit ?? '');
  // svelte-ignore state_referenced_locally
  let every = $state(everyOf(everyIn ?? start.every));
  let show = $state(start.show !== false);
  let preview = $state(null);
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const KINDS = [
    { key: 'scale', name: 'Scale 1–10', icon: Gauge },
    { key: 'yesno', name: 'Yes / No', icon: CircleCheck },
    { key: 'number', name: 'Number with unit', icon: Hash },
    { key: 'text', name: 'Text', icon: Type },
  ];
  const draftQ = $derived(builtin ? { ...question, text: name.trim() || startText, edited: true } : ownOf({ id: question?.id ?? 'own-new', text: name || t('Your question'), area, form: { kind, unit }, every, show }));
  // a question of the list may be emptied: then it goes back to the app's text
  const canSave = $derived(builtin || !!name.trim());
  function save() {
    if (!canSave) return;
    onsave?.({ id: question?.id ?? null, text: name.trim(), textChanged: builtin && name.trim() !== startText, area, form: { kind, unit }, every: everyOf(every), show });
    dialog.close();
  }
  function remove() {
    ondelete?.(question.id);
    dialog.close();
  }
</script>

<dialog use:keepTyped={'abfrage:' + (question?.id ?? 'new')} class="sheet vdlg from-below" bind:this={dialog} use:backClose {onclose} aria-labelledby="own-h">
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="own-h">{builtin ? t('Change question') : question ? t('Change your own question') : t('Create your own question')}</h2>
      <p class="vd-sub">{t('Goes into «Your questions» and into the history under Data.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <label class="fld"><span class="lbl">{builtin ? t('Question|text') : t('Name|question')}</span><input class="inp" type="text" maxlength="120" bind:value={name} placeholder={builtin ? t(question.text) : t('e.g. Coffee')} data-own-name /></label>
  {#if builtin}<p class="srcl"><small>{t('Empty brings back the app’s wording. The answers so far stay with the question.')}</small></p>{:else}
  <p class="srcl"><span class="ab-src only"><Hand size={13} aria-hidden="true" />{t('only by hand possible')}</span><small>{t('no known source, the app asks you')}</small></p>{/if}

  <label class="fld"><span class="lbl">{t('Area|question')}</span>
    <select class="sel" bind:value={area}>
      {#each groups as a (a.key)}<option value={a.key}>{a.name}</option>{/each}
    </select>
  </label>

  {#if builtin}
    <p class="fld"><span class="lbl">{t('Answer')}</span><span><span class="ab-kind">{kindLabel(question.form)}</span> <small class="srcl">{t('the answer kind of this question stays, so the history keeps fitting')}</small></span></p>
  {:else}
  <span class="lbl" id="own-kind">{t('Answer')}</span>
  <div class="kinds" role="group" aria-labelledby="own-kind">
    {#each KINDS as k (k.key)}
      <button type="button" class="kb" aria-pressed={kind === k.key} onclick={() => (kind = k.key)} data-own-kind={k.key}>
        {#if kind === k.key}<Check size={18} aria-hidden="true" />{:else}<k.icon size={18} aria-hidden="true" />{/if}<span>{t(k.name)}</span>
      </button>
    {/each}
  </div>

  {#if kind === 'number'}
    <div class="fld">
      <label class="lbl" for="own-unit">{t('Unit|answer')}</label>
      <div class="unitr">
        <input class="inp" id="own-unit" type="text" maxlength="20" bind:value={unit} placeholder={t('e.g. cups')} data-own-unit />
        {#each ['kg', 'min', 'h', 'km'] as u (u)}<button type="button" class="ab-opt" aria-pressed={unit === u} onclick={() => (unit = u)}>{u}</button>{/each}
      </div>
    </div>
  {/if}

  {/if}
  <span class="lbl">{t('How often to ask?')}</span>
  <IntervalPick bind:every allowOff idp="own" />

  {#if draftQ}
    <div class="prev">
      <small>{t('How Today asks')}</small>
      <b>{draftQ.text}</b>
      <AnswerInput q={draftQ} bind:value={preview} id="own-prev" label={draftQ.text} />
    </div>
  {/if}

  {#if !builtin}
  <label class="optrow">
    <span class="m"><b>{t('Show in Rückblick and Balance')}</b><small>{t('only to look at, without judgement')}</small></span>
    <span class="ab-sw"><input type="checkbox" role="switch" bind:checked={show} /></span>
  </label>
  {/if}

  <div class="vd-foot">
    {#if question}<button type="button" class="btn del" onclick={remove} data-own-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={save} disabled={!canSave} data-own-save>{t('Save')}</button>
  </div>
</dialog>

<style>
  .fld {
    display: grid;
    gap: 4px;
    margin: 0 0 14px;
  }
  .fld .inp,
  .fld .sel {
    min-height: 44px;
    box-sizing: border-box;
  }
  .srcl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: -6px 0 14px;
  }
  .srcl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .kinds {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin: 4px 0 14px;
  }
  .kb {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 48px;
    padding: 6px 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .kb[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .unitr {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .unitr .inp {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 44px;
  }
  .prev {
    display: grid;
    gap: 6px;
    margin: 14px 0 12px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .prev small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .prev b {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .optrow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    cursor: pointer;
  }
  .optrow .m {
    flex: 1;
    min-width: 0;
    display: grid;
  }
  .optrow b {
    font-weight: 500;
  }
  .optrow small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .del {
    margin-right: auto;
  }
  @media (max-width: 719px) {
    .kinds {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
