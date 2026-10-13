<script>
  /**
   * v0.124.0 «Neue Tour Teil 2», B5 «Reparatur unterwegs» (mockup B5, Noah 12.10.2026 «b2 b4 b5 ok», answer 6a):
   * the block Repair holds the whole workshop; for the ride the app suggests at most 8 light parts as option
   * buttons (the same as the blocks in Packen, not a checklist). A tap moves a part between «Für unterwegs»
   * and «Bleibt in der Werkstatt». «Später» closes without a change; «8 Teile übernehmen» keeps them in the
   * block, the rest leaves it and stays in Gear (Gear › Building blocks › Repair puts them back).
   *
   * items: all items. onapply(keepIds): save. onclose(): the window is gone.
   */
  import { Wrench } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import OptionButton from '../ui/OptionButton.svelte';
  import Btn from '../ui/Btn.svelte';
  import { explain } from '../ui/explain.js';
  import { catIcon } from '../gear/caticon.js';
  import { t, tn, nameOf } from '../i18n.svelte.js';
  import { formatWeight, itemWeight, sumKnown, knownWeight } from '../gear.js';
  import { slimSuggest, SLIM_MAX } from '../repairslim.js';

  let { items, onapply, onclose } = $props();
  /** Workshop parts shown before «Show all». */
  const SHOWN = 6;

  // svelte-ignore state_referenced_locally
  const plan = slimSuggest(items);
  let keep = $state(new Set(plan.picked));
  let all = $state(false);
  let full = $state(false); // a ninth part was tapped
  let busy = $state(false);
  let dlg = $state();
  let head = $state();
  // the title takes the focus (not the first part: its explain bubble would cover the list at once)
  $effect(() => {
    if (dlg && !dlg.open) {
      dlg.showModal();
      head?.focus();
    }
  });

  const road = $derived(plan.rows.filter((i) => keep.has(i.id)));
  const shop = $derived(plan.rows.filter((i) => !keep.has(i.id)));
  const shownShop = $derived(all ? shop : shop.slice(0, SHOWN));
  const sumOf = (list) => sumKnown(list.map((i) => itemWeight(i)));
  const total = sumOf(plan.rows);
  const kept = $derived(sumOf(road));
  const sub = (i) => (itemWeight(i) == null ? t('not weighed') : formatWeight(itemWeight(i)));

  function flip(i) {
    const next = new Set(keep);
    if (next.has(i.id)) next.delete(i.id);
    else if (next.size >= SLIM_MAX) {
      full = true;
      return;
    } else next.add(i.id);
    full = false;
    keep = next;
  }
  async function take() {
    if (busy || !keep.size) return;
    busy = true;
    try {
      await onapply([...keep]);
      dlg.close();
    } finally {
      busy = false;
    }
  }
</script>

<dialog class="sheet rslim" bind:this={dlg} use:backClose onclose={() => onclose?.()} aria-labelledby="rslim-h">
  <div class="body">
    <h2 id="rslim-h" tabindex="-1" bind:this={head}>{t('Repair on the way')}</h2>
    <p class="lead">{t('Your block «{block}» has {n} parts, almost the whole workshop. For the ride the app suggests {max}. Tap what comes along.', { block: t('Repair|block'), n: plan.rows.length, max: plan.picked.length })}</p>
    <div class="sum">
      <span class="sic" aria-hidden="true"><Wrench size={20} /></span>
      <span><b>{tn(road.length, '{n} part · {w} comes along', '{n} parts · {w} come along', { w: knownWeight(kept.g, kept.missing) })}</b>
        <small>{t('Before {n} parts · {w}. The rest stays at home and stays in your gear.', { n: plan.rows.length, w: knownWeight(total.g, total.missing) })}</small></span>
    </div>
    <p class="grp-l" id="rslim-road">{t('For the ride')}</p>
    <div class="ogrid" role="group" aria-labelledby="rslim-road">
      {#each road as i (i.id)}<OptionButton size="lg" pressed icon={catIcon(i.category)} label={nameOf(i)} sub={sub(i)} explain={t('Leaves it in the workshop')} onclick={() => flip(i)} />{/each}
    </div>
    {#if full}<p class="full" role="status">{t('At most {n} parts: take one out first.', { n: SLIM_MAX })}</p>{/if}
    {#if shop.length}
      <p class="grp-l" id="rslim-shop">{t('Stays in the workshop')}</p>
      <div class="ogrid" role="group" aria-labelledby="rslim-shop">
        {#each shownShop as i (i.id)}<OptionButton size="lg" pressed={false} icon={catIcon(i.category)} label={nameOf(i)} sub={sub(i)} explain={t('Takes it along on the ride')} onclick={() => flip(i)} />{/each}
      </div>
      <p class="more">{#if !all && shop.length > SHOWN}<button type="button" class="tp-link" onclick={() => (all = true)}>{tn(shop.length - SHOWN, '… and {n} more workshop part', '… and {n} more workshop parts')}</button>{' '}{/if}{t('Undo any time under Gear › Building blocks › Repair.')}</p>
    {/if}
  </div>
  <footer class="acts">
    <Btn label={t('Later')} explain={explain('Later')} onclick={() => dlg.close()} />
    <Btn kind="hi" label={tn(keep.size, 'Take {n} part', 'Take {n} parts')} explain={t('Keeps these parts in Repair; the rest stays in your gear')} disabled={!keep.size || busy} onclick={take} />
  </footer>
</dialog>

<style>
  dialog.rslim { width: min(780px, calc(100vw - 24px)); padding: 0; display: none; }
  dialog.rslim[open] { display: flex; flex-direction: column; }
  .body { padding: 28px 32px 16px; overflow: auto; min-height: 0; }
  h2 { margin: 0; outline: none; font: 700 var(--fs-title) / 1.2 var(--font-body); color: var(--ink); }
  .lead { margin: 6px 0 16px; color: var(--ink-2); font-size: var(--fs-small); overflow-wrap: break-word; }
  .sum { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; background: var(--paper-2); }
  .sic { display: grid; flex: none; place-items: center; width: 40px; height: 40px; border-radius: 8px; background: var(--paper); color: var(--ok); }
  .sum b { display: block; font-weight: 600; }
  .sum small { display: block; font-size: var(--fs-small); color: var(--ink-2); overflow-wrap: break-word; }
  .grp-l { margin: 18px 0 8px; font-size: var(--fs-tiny); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-2); }
  .ogrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr)); gap: 10px; }
  .full { margin: 8px 0 0; font-size: var(--fs-small); color: var(--warn); }
  .more { margin: 12px 0 0; font-size: var(--fs-small); color: var(--ink-2); }
  .more .tp-link { font-size: var(--fs-small); }
  .acts { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 32px 18px; border-top: 1px solid var(--line); background: var(--paper); }
  @media (max-width: 719px) {
    dialog.rslim { width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; margin: 0; border-radius: 0; border: 0; }
    .body { flex: 1; padding: 20px 16px 12px; }
    .acts { padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); }
    .acts :global(.btn) { flex: 1 1 0; justify-content: center; }
    .acts :global(.btn.hi) { flex-grow: 1.6; }
  }
</style>
