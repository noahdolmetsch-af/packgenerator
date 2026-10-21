<script>
  /**
   * #194 Downhill, Paket «Reste»: each bike park day as its own entry, with the park, the runs and whether the
   * protection check was done. On top: days, runs and the favourite parks this year. Everything can be changed
   * and deleted (with Undo); the block itself can be switched off under «Bausteine anpassen».
   */
  import { Plus, Pencil, Trash2, Minus, ShieldCheck, Mountain } from '@lucide/svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { putItem, patchItem, dropItems, restoreItems } from '../sportsdb.js';
  import { parkStats, protectState } from '../sportshelp.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { sport, items = [], today, hasProtect = false } = $props();

  const list = $derived(items.filter((x) => x.kind === 'parkday').sort((a, b) => String(b.day).localeCompare(String(a.day))));
  const stats = $derived(parkStats(list, today.slice(0, 4)));
  const parks = $derived(parkStats(list).parks.map((p) => p.name));
  const check = $derived(protectState(items));
  const fmt = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const title = (x) => String(x.park ?? '').trim() || t('Bike park day');

  let form = $state(null);
  const blank = () => ({ day: today, park: parks[0] ?? '', runs: 0, checked: check.total > 0 && check.done === check.total, note: '' });
  const runsOf = (v) => Math.max(0, Math.min(200, Math.round(Number(v) || 0)));
  async function save(e) {
    e.preventDefault();
    const { id, ...rec } = form;
    rec.park = String(rec.park ?? '').trim();
    rec.runs = runsOf(rec.runs);
    rec.note = String(rec.note ?? '').trim();
    if (id) await patchItem(id, rec);
    else await putItem({ sport: sport.id, kind: 'parkday', ...rec });
    form = null;
  }
  async function del(x) {
    const name = `${title(x)} (${fmt(x.day)})`;
    if ((await askDelete({ title: t('Delete «{name}»?', { name }), text: t('Only this entry goes.') })) !== 'delete') return;
    await deleteWithUndo({ run: () => dropItems([x.id]), undo: restoreItems, text: t('"{name}" deleted.', { name }), name });
  }
  const toCheck = () => document.querySelector('[data-block="protect"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
</script>

<p class="small">{t('Note each day in the bike park: where, how many runs, and whether the protection check was done.')}</p>

{#if stats.days}
  <p class="row" data-park-stats>
    <Mountain size={16} aria-hidden="true" /><b class="num">{tn(stats.days, '{n} day this year', '{n} days this year')}</b>
    <span class="small num">{tn(stats.runs, '{n} run', '{n} runs')}{#if stats.best}{' · '}{t('best day: {n} runs', { n: stats.best })}{/if}</span>
  </p>
  {#if stats.parks.length}<p class="small" data-park-list>{stats.parks.slice(0, 3).map((p) => `${p.name} (${p.days})`).join(' · ')}</p>{/if}
{/if}

{#if hasProtect}
  <p class="row small" data-park-check>
    <ShieldCheck size={16} aria-hidden="true" />
    {#if check.total}{t('Protection check: {n} of {m} ticked', { n: check.done, m: check.total })}{:else}{t('Protection check: no list yet')}{/if}
    <button type="button" class="lnk" onclick={toCheck}>{t('To the protection check')}</button>
  </p>
{/if}

{#if list.length}
  <ul class="ilist">
    {#each list.slice(0, 20) as x (x.id)}
      <li data-entry={title(x)}>
        <div class="ent" style="flex-direction:column;align-items:flex-start">
          <b>{title(x)}{#if x.runs}{' · '}<span class="num">{tn(x.runs, '{n} run', '{n} runs')}</span>{/if}</b>
          <small>{fmt(x.day)}{' · '}{x.checked ? t('protection checked') : t('protection not checked')}</small>
          {#if x.note}<small>{x.note}</small>{/if}
        </div>
        <button type="button" class="ibtn" aria-label={t('Change «{name}»', { name: title(x) })} onclick={() => (form = structuredClone($state.snapshot(x)))}><Pencil size={16} aria-hidden="true" /></button>
        <button type="button" class="ibtn" aria-label={t('Delete «{name}»', { name: title(x) })} onclick={() => del(x)}><Trash2 size={16} aria-hidden="true" /></button>
      </li>
    {/each}
  </ul>
{:else}
  <p class="none">{t('No bike park day yet.')}</p>
{/if}

{#if form}
  <form class="form" onsubmit={save} data-form="parkday">
    <label>{t('Day')}<input type="date" bind:value={form.day} required /></label>
    <label>{t('Bike park')}<input bind:value={form.park} list="park-names" placeholder={t('e.g. the park in the valley')} data-park-name /></label>
    <datalist id="park-names">{#each parks as p (p)}<option value={p}></option>{/each}</datalist>
    <div>
      <label for="park-runs">{t('Runs')}</label>
      <div class="row">
        <button type="button" class="ibtn" aria-label={t('One run less')} onclick={() => (form.runs = runsOf(form.runs - 1))}><Minus size={16} aria-hidden="true" /></button>
        <input id="park-runs" type="number" min="0" max="200" inputmode="numeric" bind:value={form.runs} style="width:5.5em" data-park-runs />
        <button type="button" class="ibtn" aria-label={t('One run more')} onclick={() => (form.runs = runsOf(form.runs + 1))} data-park-plus><Plus size={16} aria-hidden="true" /></button>
      </div>
    </div>
    <fieldset class="wide" style="border:0;padding:0;margin:0">
      <legend class="small">{t('Protection check')}</legend>
      <div class="row">
        <button type="button" class="chip" aria-pressed={!!form.checked} onclick={() => (form.checked = true)} data-park-checked>{t('done|check')}</button>
        <button type="button" class="chip" aria-pressed={!form.checked} onclick={() => (form.checked = false)}>{t('not done')}</button>
      </div>
    </fieldset>
    <label class="wide">{t('Note')}<input bind:value={form.note} placeholder={t('e.g. new line on the red trail')} /></label>
    <button type="submit" class="btn hi">{t('Save')}</button>
    <button type="button" class="btn" onclick={() => (form = null)}>{t('Cancel')}</button>
  </form>
{:else}
  <button type="button" class="chip dash" onclick={() => (form = blank())} data-add="parkday"><Plus size={14} aria-hidden="true" />{t('New bike park day')}</button>
{/if}
