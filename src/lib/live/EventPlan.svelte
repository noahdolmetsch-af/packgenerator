<script>
  /**
   * Gruppenfahrt für Events (Noah 26.10.2026 «2», «6 auch für Rennen», «2b»): what the maker of the group
   * sets for everyone. The night pause with own times (nobody's location is sent then, so nobody sees where
   * the others sleep), the start time, and the race mode with its checkpoints (name and km of the route;
   * the finish is the end of the route). Checkpoints are renamed and deleted (asked first, with Undo).
   * plan: readPlan() of event.js; onplan(plan).
   */
  import { Moon, Flag, Plus, Pencil, Trash2 } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { NIGHT_DEFAULT } from './event.js';
  import './event.css';

  let { plan = null, onplan = null } = $props();
  const p = $derived(plan ?? { night: null, race: false, cps: [], start: null });
  const put = (patch) => onplan?.({ ...p, ...patch });

  let cpName = $state('');
  let cpKm = $state('');
  let err = $state('');
  let editing = $state(-1);
  let editName = $state('');
  async function addCp() {
    const km = Number(String(cpKm).replace(',', '.'));
    if (!cpKm || !Number.isFinite(km) || km < 0) return (err = t('Write a km of the route.'));
    err = '';
    await put({ cps: [...p.cps, { name: cpName.trim() || t('CP {n}', { n: p.cps.length + 1 }), km }] });
    cpName = '';
    cpKm = '';
  }
  async function saveName(i) {
    const n = editName.trim();
    if (n) await put({ cps: p.cps.map((c, k) => (k === i ? { ...c, name: n } : c)) });
    editing = -1;
  }
  async function removeCp(i) {
    const c = p.cps[i];
    const a = await askDelete({ title: t('Delete «{name}»?', { name: c.name }), text: t('The checkpoint is gone for the whole group.') });
    if (a !== 'delete') return;
    await deleteWithUndo({
      name: c.name,
      text: t('«{name}» deleted.', { name: c.name }),
      run: async () => {
        const before = p.cps;
        await put({ cps: p.cps.filter((_, k) => k !== i) });
        return before;
      },
      undo: (before) => put({ cps: before }),
    });
  }
</script>

<section class="card ev-box" aria-labelledby="epl-h" data-event-plan>
  <h2 id="epl-h">{t('Settings for the group')}</h2>
  <p class="ev-muted">{t('Only you as the maker of the group change these; everyone sees them.')}</p>

  <label class="ev-sw"><input type="checkbox" checked={!!p.night} onchange={(e) => put({ night: e.currentTarget.checked ? (p.night ?? NIGHT_DEFAULT) : null })} data-event-night /> <Moon size={16} aria-hidden="true" /> {t('Do not share at night')}</label>
  {#if p.night}
    <div class="ev-row2">
      <label class="ev-fld"><span>{t('From')}</span><input type="time" value={p.night.from} onchange={(e) => e.currentTarget.value && put({ night: { ...p.night, from: e.currentTarget.value } })} data-event-night-from /></label>
      <label class="ev-fld"><span>{t('Until')}</span><input type="time" value={p.night.to} onchange={(e) => e.currentTarget.value && put({ night: { ...p.night, to: e.currentTarget.value } })} data-event-night-to /></label>
    </div>
    <p class="ev-muted">{t('From {from} to {to} nobody sees where you sleep. Ready, help and the lists still work.', { from: p.night.from, to: p.night.to })}</p>
  {/if}

  <label class="ev-fld"><span>{t('Start time (optional)')}</span><input type="time" value={p.start ?? ''} onchange={(e) => put({ start: e.currentTarget.value || null })} data-event-start /></label>

  <label class="ev-sw"><input type="checkbox" checked={p.race} onchange={(e) => put({ race: e.currentTarget.checked })} data-event-race /> <Flag size={16} aria-hidden="true" /> {t('Race with checkpoints')}</label>
  {#if p.race}
    {#if p.cps.length}
      <ul class="ev-list">
        {#each p.cps as c, i (`${i}-${c.km}`)}
          <li data-event-plan-cp>
            <span class="ev-ic" aria-hidden="true">🚩</span>
            <span class="ev-txt">
              {#if editing === i}
                <label class="ev-fld"><span>{t('New name')}</span><input type="text" bind:value={editName} maxlength="40" onkeydown={(e) => e.key === 'Enter' && saveName(i)} /></label>
              {:else}
                <b>{c.name}</b><small>{t('km {km}', { km: num(c.km) })}</small>
              {/if}
            </span>
            <span class="ev-acts">
              {#if editing === i}
                <button type="button" class="btn sm hi" onclick={() => saveName(i)}>{t('Save')}</button>
              {:else}
                <button type="button" class="btn sm" onclick={() => ((editing = i), (editName = c.name))} aria-label={t('Rename «{name}»', { name: c.name })}><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" class="btn sm" onclick={() => removeCp(i)} aria-label={t('Delete «{name}»', { name: c.name })}><Trash2 size={16} aria-hidden="true" /></button>
              {/if}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
    <p class="ev-muted">{t('The finish is the end of the route. The checkpoints are sorted by km.')}</p>
    <div class="ev-row2">
      <label class="ev-fld"><span>{t('Checkpoint name')}</span><input type="text" bind:value={cpName} maxlength="40" placeholder={t('e.g. Col')} data-event-cp-name /></label>
      <label class="ev-fld"><span>{t('km of the route')}</span><input type="text" inputmode="decimal" bind:value={cpKm} data-event-cp-km /></label>
    </div>
    {#if err}<p class="rc-warn" role="alert">{err}</p>{/if}
    <div><button type="button" class="btn" onclick={addCp} data-event-cp-add><Plus size={18} aria-hidden="true" />{t('Add checkpoint')}</button></div>
  {/if}
</section>
