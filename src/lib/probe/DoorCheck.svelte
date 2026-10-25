<script>
  /**
   * Paket B part 3, UC-038-I1 «Türschwellen-Check»: on Unterwegs, only on the start morning, a closed
   * link «Last look at the door». Open, it lists only what is still in use until you leave: phone, keys,
   * glasses, wallet, cold food (and filled bottles with a bike). Ticks and own steps stay on the trip
   * (trip.door). Voluntary: nothing nags when it stays closed.
   */
  import { DoorOpen, Check, Plus, Trash2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { DOOR_STEPS, stepsFor, answer, addOwn, removeOwn } from './probe.js';
  import '../trip/trip.css';

  let { trip } = $props();
  const today = localDay();
  const show = $derived(!!trip?.startDate && trip.startDate === today && !trip.finished);
  let open = $state(false);
  const rec = $derived(trip?.door ?? null);
  const rows = $derived(stepsFor(DOOR_STEPS, trip, rec).map((s) => ({ ...s, done: rec?.steps?.[s.key]?.r === 'ok' })));
  const left = $derived(rows.filter((r) => !r.done).length);
  const snap = () => JSON.parse(JSON.stringify(rec ?? {}));
  const save = (next) => db.trips.update(trip.id, touched({ door: next }));

  let newName = $state('');
  async function add(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await save(addOwn(snap(), newName));
    newName = '';
  }
  async function drop(s) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: s.name }), text: t('Only this step goes.') })) !== 'delete') return;
    const before = snap();
    await deleteWithUndo({ run: () => save(removeOwn(before, s.key)).then(() => before), undo: (saved) => save(saved), text: t('«{name}» deleted.', { name: s.name }), name: s.name });
  }
</script>

{#if show}
  <section class="card door" aria-label={t('Last look at the door')} data-door-check>
    <button type="button" class="tp-link" aria-expanded={open} onclick={() => (open = !open)} data-door-open><DoorOpen size={16} aria-hidden="true" />{t('Last look at the door')}{open ? '' : ` · ${left ? t('{n} left', { n: left }) : t('All with you')}`}</button>
    {#if open}
      <p class="tp-small tp-muted">{t('Only what is still in use until you leave. Tick it when it is with you.')}</p>
      <ul>
        {#each rows as s (s.key)}
          <li data-door-step={s.key}>
            <button type="button" class="tick" class:done={s.done} aria-pressed={s.done} onclick={() => save(answer(snap(), s.key, 'ok'))}>
              <span class="box" aria-hidden="true">{#if s.done}<Check size={16} />{/if}</span>
              <span class="txt"><b>{s.own ? s.name : t(s.name)}</b>{#if s.sub}<small>{t(s.sub)}</small>{/if}</span>
            </button>
            {#if s.own}<button type="button" class="ib" aria-label={t('Delete «{name}»', { name: s.name })} onclick={() => drop(s)}><Trash2 size={16} /></button>{/if}
          </li>
        {/each}
      </ul>
      <form class="add" onsubmit={add}>
        <input class="inp" type="text" bind:value={newName} maxlength="60" placeholder={t('Own thing, e.g. «Hearing aid»')} aria-label={t('Add own thing')} />
        <button type="submit" class="btn sm" disabled={!newName.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
      </form>
    {/if}
  </section>
{/if}

<style>
  .door {
    padding: 4px 14px;
    margin: 0 0 12px;
  }
  ul {
    list-style: none;
    margin: 4px 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .tick {
    display: flex;
    flex: 1 1 auto;
    gap: 10px;
    align-items: flex-start;
    min-width: 0;
    min-height: 44px;
    padding: 8px 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .box {
    display: grid;
    flex: none;
    place-items: center;
    width: 22px;
    height: 22px;
    margin-top: 1px;
    border: 1.5px solid var(--ink-3);
    border-radius: 6px;
  }
  .done .box {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .txt {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .txt small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ib {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 4px 0 10px;
  }
  .add .inp {
    flex: 1 1 160px;
    min-width: 0;
  }
</style>
