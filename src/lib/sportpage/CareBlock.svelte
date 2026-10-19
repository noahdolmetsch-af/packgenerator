<script>
  /**
   * Paket O, basic block «Pflege»: care steps after a number of uses (#197 Eishockey: air the bag after every
   * use, sharpen the skates every 10), the age of material (#200 Klettern: rope and harness), the care of the
   * main equipment that is due (Ausrüstung, maingear.js) and, for the bike sports, the way to bike care.
   */
  import { Plus, Check, Pencil, Trash2, ChevronRight, Bike } from '@lucide/svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { putItem, patchItem, dropItems, restoreItems } from '../sportsdb.js';
  import { STEP_PRESETS, AGE_PRESETS, stepState, ageState } from '../sportshelp.js';
  import { t, tn, num, locale, nameOf } from '../i18n.svelte.js';

  let { sport, items = [], uses = 0, gearRows = [], today } = $props();

  const steps = $derived(items.filter((x) => x.kind === 'step'));
  const ages = $derived(items.filter((x) => x.kind === 'age'));
  const due = $derived(gearRows.flatMap((r) => r.care.filter((c) => c.state !== 'ok').map((c) => ({ row: r, c }))));
  const fmt = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });

  let form = $state(null); // { kind, id?, name, every?, since?, years? }
  async function save(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const rec = form.kind === 'step' ? { name, every: Math.max(1, Math.round(Number(form.every) || 1)) } : { name, since: form.since || null, years: Math.max(1, Number(form.years) || 10) };
    if (form.id) await patchItem(form.id, rec);
    else await putItem({ sport: sport.id, kind: form.kind, ...rec, ...(form.kind === 'step' ? { last: { uses, day: today } } : {}) });
    form = null;
  }
  async function del(x) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: x.name }), text: t('Only this line goes.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => dropItems([x.id]), undo: restoreItems, text: t('"{name}" deleted.', { name: x.name }), name: x.name });
  }
  const doneStep = (x) => patchItem(x.id, { last: { uses, day: today } });
  async function takeSteps() {
    for (const p of STEP_PRESETS[sport.id] ?? []) await putItem({ sport: sport.id, kind: 'step', name: t(p.name), every: p.every, last: { uses, day: today } });
  }
  async function takeAges() {
    for (const p of AGE_PRESETS[sport.id] ?? []) await putItem({ sport: sport.id, kind: 'age', name: t(p.name), since: null, years: p.years });
  }
</script>

{#if sport.bike}
  <a class="srow" href="#/bikes?tab=care" data-bike-care><Bike size={18} aria-hidden="true" /><span class="t"><b>{t('Bike care')}</b><small>{t('Parts, service by km, hours or date, the workshop')}</small></span><ChevronRight size={18} aria-hidden="true" /></a>
{/if}

{#if due.length}
  <h3>{t('Equipment care due')}</h3>
  <ul class="ilist">
    {#each due as d (d.row.item.id + d.c.care.id)}
      <li><a class="ent" href="#/equipment?item={encodeURIComponent(d.row.item.id)}"><b>{nameOf(d.row.item)}: {t(d.c.care.name)}</b><span class="pill {d.c.state === 'due' ? 'due' : ''}">{d.c.state === 'due' ? t('due') : t('soon')}</span></a></li>
    {/each}
  </ul>
{/if}

<h3>{t('After uses')}</h3>
<p class="small">{tn(uses, 'So far {n} use counts (ticks, trips, values).', 'So far {n} uses count (ticks, trips, values).')}</p>
{#if steps.length}
  <ul class="ilist">
    {#each steps as x (x.id)}
      {@const s = stepState(x, uses)}
      <li data-step={x.name}>
        <span class="ent"><b>{x.name}</b><span class="pill {s.due ? 'due' : 'ok'}">{s.due ? t('due') : tn(s.left, 'in {n} use', 'in {n} uses')}</span></span>
        <button type="button" class="btn" onclick={() => doneStep(x)} data-step-done><Check size={16} aria-hidden="true" />{t('Done|care')}</button>
        <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: x.name })} onclick={() => (form = { kind: 'step', id: x.id, name: x.name, every: x.every })}><Pencil size={16} aria-hidden="true" /></button>
        <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: x.name })} onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{:else if STEP_PRESETS[sport.id]}
  <button type="button" class="btn" onclick={takeSteps} data-take-steps><Plus size={16} aria-hidden="true" />{t('Take the suggestion')}</button>
  <p class="small">{STEP_PRESETS[sport.id].map((p) => `${t(p.name)} (${tn(p.every, 'every use', 'every {n} uses')})`).join(' · ')}</p>
{:else}
  <p class="none">{t('No care step yet.')}</p>
{/if}

<h3>{t('Age of material')}</h3>
{#if ages.length}
  <ul class="ilist">
    {#each ages as x (x.id)}
      {@const a = ageState(x, today)}
      <li data-age={x.name}>
        <span class="ent"><b>{x.name}</b>{#if a}<span class="pill {a.state === 'old' ? 'old' : a.state === 'soon' ? 'due' : 'ok'}">{a.state === 'old' ? t('replace: older than {n} years', { n: num(x.years) }) : t('{n} years old, until {date}', { n: num(a.years), date: fmt(a.until) })}</span>{:else}<span class="small">{t('Enter the purchase date')}</span>{/if}</span>
        <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: x.name })} onclick={() => (form = { kind: 'age', id: x.id, name: x.name, since: x.since ?? '', years: x.years })}><Pencil size={16} aria-hidden="true" /></button>
        <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: x.name })} onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{:else if AGE_PRESETS[sport.id]}
  <button type="button" class="btn" onclick={takeAges} data-take-ages><Plus size={16} aria-hidden="true" />{t('Take the suggestion')}</button>
  <p class="small">{AGE_PRESETS[sport.id].map((p) => t('{name} (at most {n} years)', { name: t(p.name), n: p.years })).join(' · ')}</p>
{:else}
  <p class="none">{t('Nothing with an age limit yet.')}</p>
{/if}

{#if form}
  <form class="form" onsubmit={save} data-care-form>
    <label>{t('Name')}<input bind:value={form.name} /></label>
    {#if form.kind === 'step'}
      <label>{t('After how many uses?')}<input type="number" min="1" bind:value={form.every} /></label>
    {:else}
      <label>{t('Bought or made on')}<input type="date" bind:value={form.since} max={today} /></label>
      <label>{t('At most years')}<input type="number" min="1" step="0.5" bind:value={form.years} /></label>
    {/if}
    <button type="submit" class="btn hi" disabled={!form.name.trim()}>{t('Save')}</button>
    <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
  </form>
{:else}
  <div class="row">
    <button type="button" class="chip dash" onclick={() => (form = { kind: 'step', name: '', every: 10 })} data-add-step><Plus size={14} aria-hidden="true" />{t('Care step')}</button>
    <button type="button" class="chip dash" onclick={() => (form = { kind: 'age', name: '', since: '', years: 10 })} data-add-age><Plus size={14} aria-hidden="true" />{t('Material with an age')}</button>
  </div>
{/if}
