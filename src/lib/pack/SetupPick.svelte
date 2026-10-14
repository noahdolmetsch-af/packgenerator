<script>
  /**
   * Taschen-Setups TS5 (Noah 14.10.2026 «4a und kann setup kann geändert werden beim planen», «2a»):
   * the chip «Setup: …» under «Velo und Taschen» of a trip. A new trip starts with the setup last used
   * on its bike; here it can be changed: the list shows every setup of the bike with its bags, when it
   * was last used, its weight and how many things would move. Switching puts the packing list into
   * that setup's bags (only this trip, 4 s «Rückgängig»). «Taschen nur für diese Tour ändern» opens the
   * bags of the trip; when the trip differs from its setup, «Ins Setup übernehmen» saves it there; and
   * the trip's bags can become a new setup. A finished trip only shows its setup.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { setupsOf, setupOf, setupIdOf, setupCalc, usageOf, movesOf, tripDiffers, fromTrip, copySetup, freeName } from '../setups.js';
  import { useSetupInTrip, takeTripIntoSetup, writeSetup, newSetupId } from '../bikes/setupdb.js';
  import { Layers, ChevronDown, Pencil, Plus, Check } from '@lucide/svelte';
  import SetupDialog from '../bikes/SetupDialog.svelte';
  import { away } from '../ui/away.js';
  import { inView } from '../ui/inview.js';
  import { t, tn, num, dateOf } from '../i18n.svelte.js';

  let { trip, bike, trips = [], items = [], readonly = false, onbags = null } = $props();

  const bagsQ = liveQuery(() => db.containers.toArray());
  const containers = $derived($bagsQ ?? []);
  const others = $derived(trips.filter((x) => x.id !== trip.id));
  const setups = $derived(setupsOf(bike, others));
  const current = $derived(setupOf(bike, setupIdOf(trip), others));
  const used = $derived(usageOf(bike, others));
  const differs = $derived(current ? tripDiffers(trip, current) : false);
  const nm = (s) => (s.std ? t('Standard|setup') : s.name);
  const kg = (g) => `${num(Math.round(g / 100) / 10)} kg`;
  function line(s) {
    const n = Object.values(s.bags ?? {}).filter(Boolean).length;
    const u = used[s.id];
    const moves = s.id === current?.id ? 0 : movesOf(trip, s);
    return [tn(n, '{n} bag', '{n} bags'), u ? t('last {date}', { date: dateOf(u.last.startDate) }) : t('never used'), moves ? tn(moves, '{n} thing moves', '{n} things move') : ''].filter(Boolean).join(' · ');
  }
  let open = $state(false);
  let naming = $state(false);

  async function pick(s) {
    open = false;
    if (s.id === current?.id) return;
    await useSetupInTrip(trip.id, s, t('Setup «{name}» for this trip.', { name: nm(s) }));
  }
  async function takeOver() {
    await takeTripIntoSetup(bike.id, current, trip.id, t('Saved into setup «{name}».', { name: nm(current) }));
  }
  async function saveNew({ name }) {
    const made = copySetup(fromTrip(trip), { id: newSetupId(), name: freeName(name, setups, t('copy')) });
    await writeSetup(bike.id, made, t('Setup «{name}» created.', { name: made.name }));
    await db.trips.update(trip.id, { setupId: made.id });
  }
</script>

{#if current}
  <div class="spick" use:away={() => (open = false)}>
    {#if readonly}
      <span class="schip ro"><Layers size={16} aria-hidden="true" />{t('Setup: {name}', { name: nm(current) })}</span>
    {:else}
      <button type="button" class="schip" aria-expanded={open} aria-haspopup="true" onclick={() => (open = !open)}><Layers size={16} aria-hidden="true" />{t('Setup: {name}', { name: nm(current) })}<ChevronDown size={16} aria-hidden="true" /></button>
      {#if differs}
        <span class="diff">{t('This trip differs from its setup.')} <button type="button" class="lnk" onclick={takeOver}>{t('Save into setup')}</button></span>
      {/if}
      {#if open}
        <div class="sbox" role="group" aria-label={t('Setups of {bike}', { bike: bike.name })} use:inView>
          {#each setups as s (s.id)}
            {@const c = setupCalc(s, bike, items, containers)}
            <button type="button" class="opt" aria-pressed={s.id === current.id} onclick={() => pick(s)}>
              <span class="rd" aria-hidden="true">{#if s.id === current.id}<Check size={14} />{/if}</span>
              <span class="ot"><b>{nm(s)}</b><small>{line(s)}</small></span>
              <b class="num ok">{kg(c.totalG)}</b>
            </button>
          {/each}
          <div class="ex">
            {#if onbags}<button type="button" class="ln" onclick={() => ((open = false), onbags())}><Pencil size={16} aria-hidden="true" />{t('Change bags only for this trip')}</button>{/if}
            <button type="button" class="ln" onclick={() => ((open = false), (naming = true))}><Plus size={16} aria-hidden="true" />{t('Save these bags as a new setup')}</button>
          </div>
          <p class="hint">{t('Switching puts the packing list into the bags of that setup, only for this trip. Undo stays 4 seconds.')}</p>
        </div>
      {/if}
    {/if}
  </div>
{/if}
{#if naming}
  <SetupDialog kind="fromtrip" name={trip.title ?? ''} onsave={saveNew} onclose={() => (naming = false)} />
{/if}

<style>
  .spick {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 0 0 8px;
  }
  .schip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 14px;
    border: 0;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    cursor: pointer;
  }
  .schip.ro {
    background: var(--paper-2);
    color: var(--ink);
    cursor: default;
  }
  .diff {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .lnk {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 600 var(--fs-small) / 1 var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .sbox {
    position: absolute;
    left: 0;
    top: calc(100% + 6px);
    z-index: 20;
    width: min(380px, calc(100vw - 32px));
    padding: 8px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    box-shadow: 0 16px 40px var(--shadow);
  }
  .opt {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 8px 10px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .opt[aria-pressed='true'] {
    background: var(--ok-soft);
  }
  .rd {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    color: var(--ok);
  }
  .ot {
    min-width: 0;
  }
  .ot b {
    display: block;
    overflow-wrap: break-word;
  }
  .ot small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ex {
    display: flex;
    flex-direction: column;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--line);
  }
  .ln {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .hint {
    margin: 4px 10px 6px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
