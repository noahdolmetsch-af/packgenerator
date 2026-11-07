<script>
  /**
   * «Fragen aus deinen Daten», eigene Regeln (Noah 05.11.2026 «regeln im front end eingeben, ändern, löschen,
   * neue erstellen»): «If [value] is over / under [number] (and a second one), ask [my question]».
   * The values come from a list; the rule is saved as an own question with a `rule` (abfragen.js ownOf), so the
   * answers, the history and «Delete» with Undo work like for every own question.
   * question: null for a new rule, else the own question of the rule; areas: the groups [{ key, name }].
   */
  import { keepTyped } from '../ui/keeptyped.js';
  import { X, Check, CircleCheck, Gauge, Type, Plus, Trash2 } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t } from '../i18n.svelte.js';
  import { OWN_AREA } from '../abfragen.js';
  import { VALUES, MAX_CONDS, condOf, customRule } from '../datenfragen.js';
  import '../bikes/velo-dlg.css';
  import './ab.css';

  let { question = null, areas = [], onsave, ondelete, onclose } = $props();
  let dialog;
  const first = { v: 'sleep', op: 'under', n: 6 };
  // svelte-ignore state_referenced_locally
  let title = $state(question?.rule?.title ?? '');
  // svelte-ignore state_referenced_locally
  let conds = $state((question?.rule?.conds ?? [first]).map((c) => ({ ...c })));
  // svelte-ignore state_referenced_locally
  let text = $state(question?.text ?? '');
  // svelte-ignore state_referenced_locally
  let area = $state(question?.area ?? OWN_AREA);
  // svelte-ignore state_referenced_locally
  let kind = $state(question?.form?.kind ?? 'text');
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const KINDS = [
    { key: 'text', name: 'Text', icon: Type },
    { key: 'yesno', name: 'Yes / No', icon: CircleCheck },
    { key: 'scale', name: 'Scale 1–10', icon: Gauge },
  ];
  const specOf = (id) => VALUES.find((x) => x.id === id) ?? VALUES[0];
  // another value: its limits apply, a number outside them is moved inside, the default of the value is the start
  function pick(c, id) {
    c.v = id;
    c.n = specOf(id).def;
  }
  const canSave = $derived(!!text.trim() && !!customRule({ conds }));
  function add() {
    if (conds.length >= MAX_CONDS) return;
    const used = new Set(conds.map((c) => c.v));
    const v = VALUES.find((x) => !used.has(x.id)) ?? VALUES[0];
    conds.push({ v: v.id, op: 'over', n: v.def });
  }
  function save() {
    if (!canSave) return;
    onsave?.({ id: question?.id ?? null, text: text.trim(), area, form: { kind }, rule: { title: title.trim(), conds: conds.map(condOf).filter(Boolean) } });
    dialog.close();
  }
  function remove() {
    ondelete?.(question.id);
    dialog.close();
  }
</script>

<dialog use:keepTyped={'regel:' + (question?.id ?? 'new')} class="sheet vdlg from-below" bind:this={dialog} use:backClose {onclose} aria-labelledby="rule-h" data-rule-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="rule-h">{question ? t('Change your rule') : t('Create your own rule')}</h2>
      <p class="vd-sub">{t('If your data fits, the window asks your question and says why. All worked out on this device.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <label class="fld"><span class="lbl">{t('Name of the rule')}</span><input class="inp" type="text" maxlength="60" bind:value={title} placeholder={t('e.g. Short night, then tired')} data-rule-title /></label>

  <span class="lbl">{t('If|rule')}</span>
  <ul class="conds">
    {#each conds as c, i (i)}
      {@const spec = specOf(c.v)}
      <li data-cond={i}>
        {#if i > 0}<span class="and">{t('and')}</span>{/if}
        <select class="sel" aria-label={t('Value')} value={c.v} onchange={(e) => pick(c, e.currentTarget.value)} data-cond-value>
          {#each VALUES as v (v.id)}<option value={v.id}>{t(v.label)}</option>{/each}
        </select>
        <div class="line">
          <select class="sel" aria-label={t('Over or under')} bind:value={c.op} data-cond-op>
            <option value="over">{t('is over')}</option>
            <option value="under">{t('is under')}</option>
          </select>
          <input class="inp num" type="number" inputmode="decimal" aria-label={t('Number')} min={spec.min} max={spec.max} step={spec.step} bind:value={c.n} data-cond-n />
          {#if conds.length > 1}<button type="button" class="eb" aria-label={t('Remove this condition')} onclick={() => conds.splice(i, 1)} data-cond-remove><Trash2 size={16} aria-hidden="true" /></button>{/if}
        </div>
      </li>
    {/each}
  </ul>
  {#if conds.length < MAX_CONDS}<button type="button" class="ab-lnk addc" onclick={add} data-cond-add><Plus size={16} aria-hidden="true" />{t('and another condition')}</button>{/if}

  <label class="fld"><span class="lbl">{t('Then ask')}</span><input class="inp" type="text" maxlength="120" bind:value={text} placeholder={t('e.g. What would help you today?')} data-rule-question /></label>

  <span class="lbl" id="rule-kind">{t('Answer')}</span>
  <div class="kinds" role="group" aria-labelledby="rule-kind">
    {#each KINDS as k (k.key)}
      <button type="button" class="kb" aria-pressed={kind === k.key} onclick={() => (kind = k.key)} data-rule-kind={k.key}>
        {#if kind === k.key}<Check size={18} aria-hidden="true" />{:else}<k.icon size={18} aria-hidden="true" />{/if}<span>{t(k.name)}</span>
      </button>
    {/each}
  </div>

  <label class="fld"><span class="lbl">{t('Area|question')}</span>
    <select class="sel" bind:value={area}>
      {#each areas as a (a.key)}<option value={a.key}>{a.name}</option>{/each}
    </select>
  </label>
  <p class="srcl"><small>{t('A rule asks at most once every {n} days, and with the others at most three a day.', { n: 3 })}</small></p>

  <div class="vd-foot">
    {#if question}<button type="button" class="btn del" onclick={remove} data-rule-delete><Trash2 size={16} aria-hidden="true" />{t('Delete')}</button>{/if}
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" onclick={save} disabled={!canSave} data-rule-save>{t('Save')}</button>
  </div>
</dialog>

<style>
  .fld {
    display: grid;
    gap: 4px;
    margin: 0 0 14px;
  }
  .fld .inp,
  .fld .sel,
  .conds .sel,
  .conds .inp {
    min-height: 44px;
    box-sizing: border-box;
  }
  .conds {
    list-style: none;
    margin: 4px 0 8px;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .conds li {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .and {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .line .sel {
    flex: 1 1 auto;
    min-width: 0;
  }
  .line .num {
    width: 96px;
    flex: 0 0 auto;
  }
  .eb {
    min-width: 44px;
    min-height: 44px;
    display: inline-grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .addc {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin: 0 0 12px;
  }
  .srcl {
    margin: -6px 0 14px;
  }
  .srcl small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .kinds {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
  .del {
    margin-right: auto;
  }
</style>
