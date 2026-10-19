<script>
  /**
   * Paket O, extra block «Trainingspläne» (Gym, Noah «2a und b»): a plan is a list of measures (exercises) to
   * tick off. «Heute trainieren» opens the plan with each exercise, its last value pre-filled; ticking an
   * exercise with a value saves it to the progress. «Fertig» keeps the day (planrun).
   */
  import { Plus, Check, Play, Pencil, Trash2 } from '@lucide/svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { putItem, patchItem, dropItems, restoreItems } from '../sportsdb.js';
  import { valuesOf, lastOf, parseValue, valueText, newValue } from '../sportsprogress.js';
  import { withUnit } from './words.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { sport, items = [], today } = $props();

  const measures = $derived(items.filter((x) => x.kind === 'measure'));
  const plans = $derived(items.filter((x) => x.kind === 'plan').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  const runs = $derived(items.filter((x) => x.kind === 'planrun'));
  const lastRun = (p) => runs.filter((r) => r.planId === p.id).sort((a, b) => b.day.localeCompare(a.day))[0] ?? null;
  const fmt = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

  let form = $state(null); // { id?, name, mids }
  let run = $state(null); // { plan, done: { mid: true }, vals: { mid: text } }

  async function save(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    if (form.id) await patchItem(form.id, { name, mids: form.mids });
    else await putItem({ sport: sport.id, kind: 'plan', name, mids: form.mids, order: (plans.at(-1)?.order ?? 0) + 1 });
    form = null;
  }
  async function del(p) {
    const old = runs.filter((r) => r.planId === p.id).map((r) => r.id);
    if ((await askDelete({ title: t('Delete plan «{name}»?', { name: p.name }), text: t('The exercises and their values stay.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => dropItems([p.id, ...old]), undo: restoreItems, text: t('"{name}" deleted.', { name: p.name }), name: p.name });
  }
  function start(p) {
    const vals = {};
    for (const mid of p.mids ?? []) {
      const m = measures.find((x) => x.id === mid);
      const l = m ? lastOf(valuesOf(items, mid)) : null;
      vals[mid] = l ? valueText(l.v, m.unit) : '';
    }
    run = { plan: p, done: {}, vals };
  }
  async function tickEx(m) {
    const was = !!run.done[m.id];
    run.done = { ...run.done, [m.id]: !was };
    const v = parseValue(run.vals[m.id], m.unit);
    if (!was && v != null) await putItem(newValue(m, { day: today, v }));
  }
  async function finish() {
    await putItem({ sport: sport.id, kind: 'planrun', planId: run.plan.id, day: today, done: Object.keys(run.done).filter((k) => run.done[k]) });
    run = null;
  }
  const toggleMid = (mid) => (form.mids = form.mids.includes(mid) ? form.mids.filter((x) => x !== mid) : [...form.mids, mid]);
</script>

{#if run}
  <div class="meas" data-plan-run>
    <h3>{run.plan.name} · {t('today')}</h3>
    <ul class="ilist">
      {#each (run.plan.mids ?? []).map((mid) => measures.find((m) => m.id === mid)).filter(Boolean) as m (m.id)}
        <li>
          <button type="button" class="ent" role="checkbox" aria-checked={!!run.done[m.id]} class:done={run.done[m.id]} onclick={() => tickEx(m)} data-plan-ex={m.name}>
            <span class="bx" class:y={run.done[m.id]}>{#if run.done[m.id]}<Check size={16} aria-hidden="true" />{/if}</span><b>{m.name}</b>
          </button>
          <label class="vh" for="pv-{m.id}">{t('Value of {name}', { name: m.name })}</label>
          <input id="pv-{m.id}" class="num" style="width:96px" bind:value={run.vals[m.id]} disabled={run.done[m.id]} />
        </li>
      {/each}
    </ul>
    <p class="small">{t('Tick an exercise when it is done: its value goes into your progress.')}</p>
    <div class="row">
      <button type="button" class="btn hi" onclick={finish} data-plan-finish><Check size={16} aria-hidden="true" />{t('Finished')}</button>
      <button type="button" class="btn" onclick={() => (run = null)}>{t('Cancel')}</button>
    </div>
  </div>
{:else if plans.length}
  <ul class="ilist">
    {#each plans as p (p.id)}
      {@const l = lastRun(p)}
      <li data-plan={p.name}>
        <span class="ent"><b>{p.name}</b><small>{tn((p.mids ?? []).length, '{n} exercise', '{n} exercises')}{#if l}{' · '}{t('last {date}', { date: fmt(l.day) })}{/if}</small></span>
        <button type="button" class="btn hi" onclick={() => start(p)} data-plan-start><Play size={16} aria-hidden="true" />{t('Train today')}</button>
        <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: p.name })} onclick={() => (form = { id: p.id, name: p.name, mids: [...(p.mids ?? [])] })}><Pencil size={16} aria-hidden="true" /></button>
        <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: p.name })} onclick={() => del(p)}><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{:else}
  <p class="none">{t('No plan yet. A plan is a list of your exercises to tick off in the gym.')}</p>
{/if}

{#if form}
  <form class="form" onsubmit={save} data-plan-form>
    <label class="wide">{t('Name of the plan')}<input bind:value={form.name} placeholder={t('e.g. Legs and back')} /></label>
    {#if measures.length}
      <fieldset class="wide" style="border:0;padding:0;margin:0">
        <legend class="small">{t('Exercises (from «History and progress»)')}</legend>
        <div class="row">
          {#each measures as m (m.id)}
            <button type="button" class="chip" aria-pressed={form.mids.includes(m.id)} onclick={() => toggleMid(m.id)}>{#if form.mids.includes(m.id)}<Check size={14} aria-hidden="true" />{/if}{m.name}</button>
          {/each}
        </div>
      </fieldset>
    {:else}
      <p class="small wide">{t('First add your exercises as own measures in «History and progress».')}</p>
    {/if}
    <button type="submit" class="btn hi" disabled={!form.name.trim()}>{t('Save')}</button>
    <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
  </form>
{:else if !run}
  <button type="button" class="chip dash" onclick={() => (form = { name: '', mids: measures.map((m) => m.id) })} data-add-plan><Plus size={14} aria-hidden="true" />{t('New plan')}</button>
{/if}
