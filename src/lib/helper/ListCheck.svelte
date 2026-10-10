<script>
  /**
   * v0.77.0 (answer 4a): «Liste prüfen». From the Packliste ••• menu (first entry) and from the button
   * next to «Weiter: Packen». Three groups: «Fehlt vielleicht» (own items first, else a generic name)
   * with «Hinzufügen», «Doppelt» and «Schwer» with «Entfernen» (the reason names a lighter own
   * alternative). Every row has «Ignorieren». Every change goes through Pack's Undo.
   */
  import { Sparkles, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { db } from '../db.js';
  import { t, tn, nameOf, isDe, num } from '../i18n.svelte.js';
  import { unusedTimes } from '../debrief.js';
  import { ask, errorText, helper } from './client.svelte.js';
  import { checklistPayload } from './payload.js';
  import './helper.css';

  let { trip, items = [], onadd, onremove, onsearch, onclose } = $props();

  let busy = $state(true);
  let msg = $state('');
  let res = $state(null);
  let gone = $state(new Set()); // rows done or ignored
  let note = $state('');
  const byId = $derived(new Map(items.map((i) => [i.id, i])));
  const name = (id) => (byId.get(id) ? nameOf(byId.get(id)) : '');
  const weight = (id) => (byId.get(id)?.weightG != null ? ` ${num(byId.get(id).weightG)} g` : '');

  async function run() {
    busy = true;
    msg = '';
    res = null;
    gone = new Set();
    const [learnings, debriefs] = await Promise.all([db.learnings.toArray(), db.debriefs.toArray()]);
    const r = await ask('checklist', checklistPayload($state.snapshot(trip), { items, learnings, unusedBefore: unusedTimes(debriefs, trip.id), lang: isDe() ? 'de' : 'en' }));
    busy = false;
    if (!r.ok) return (msg = errorText(r.error, { capChf: helper.capChf }));
    res = r.result;
  }
  // Once when it opens (the list changes with every «Hinzufügen»; that asks nothing new).
  onMount(run);

  const onList = $derived(new Set((trip.entries ?? []).map((e) => e.itemId)));
  const groups = $derived.by(() => {
    if (!res) return [];
    const missing = res.missing.map((r, n) => ({ id: `m${n}`, title: r.itemId ? name(r.itemId) : r.name, reason: r.reason, act: 'add', r })).filter((x) => x.title && (!x.r.itemId || !onList.has(x.r.itemId)));
    const double = res.double.map((r, n) => ({ id: `d${n}`, title: r.itemIds.map(name).filter(Boolean).join(' + '), reason: r.reason, act: 'remove', target: r.removeId, r })).filter((x) => onList.has(x.target));
    const heavy = res.heavy.map((r, n) => ({ id: `h${n}`, title: `${name(r.itemId)}${weight(r.itemId)}`, reason: r.reason, act: 'remove', target: r.itemId, r })).filter((x) => onList.has(x.target));
    return [
      { key: 'missing', name: 'Maybe missing', rows: missing },
      { key: 'double', name: 'Double', rows: double },
      { key: 'heavy', name: 'Heavy', rows: heavy },
    ].map((g) => ({ ...g, rows: g.rows.filter((x) => !gone.has(x.id)) }));
  });
  const count = $derived(groups.reduce((s, g) => s + g.rows.length, 0));
  const ctxText = $derived([tn(Math.max(1, Number(trip.days) || 1), '{n} day', '{n} days'), trip.wx?.min != null && trip.wx?.max != null ? `${trip.wx.min}–${trip.wx.max} °C` : null].filter(Boolean).join(', '));

  const done = (x) => (gone = new Set([...gone, x.id]));
  async function act(x) {
    try {
      if (x.act === 'add' && x.r.itemId) {
        await onadd(x.r.itemId);
        note = t('Added: {name}', { name: x.title });
      } else if (x.act === 'add') {
        onsearch?.(x.title);
        note = '';
      } else {
        await onremove(x.target);
        note = t('Removed: {name}', { name: name(x.target) });
      }
      done(x);
    } catch {
      note = t('Could not save. Please try again.');
    }
  }
</script>

<section class="kh-card kh kh-check" aria-labelledby="kh-check-h">
  <h2 id="kh-check-h" class="kh-head"><span class="kh-ic"><Sparkles size={20} aria-hidden="true" /></span>{t('Check the list')}<button type="button" class="kh-x kh-close" aria-label={t('Close the check')} onclick={onclose}><X size={18} aria-hidden="true" /></button></h2>
  {#if busy}
    <p class="kh-busy" role="status">{t('The helper is checking {n} items …', { n: (trip.entries ?? []).length })}</p>
  {:else if msg}
    <p class="kh-msg" role="status">{msg}</p>
  {:else if res}
    <p class="kh-sub">{tn(count, '{n} hint on {total} items', '{n} hints on {total} items', { total: (trip.entries ?? []).length })} · {ctxText}</p>
    {#if !count}<p class="kh-msg" role="status">{t('Nothing to add: the list looks complete.')}</p>{/if}
    {#each groups as g (g.key)}
      {#if g.rows.length}
        <div class="kh-sec">
          <h3 class="kh-gh"><span class="udot warn"></span>{t(g.name)} <span class="kh-n num">{g.rows.length}</span></h3>
          <ul class="kh-list">
            {#each g.rows as x (x.id)}
              <li><span class="kh-m"><b>{x.title}</b>{#if x.reason}<small>{x.reason}</small>{/if}</span>
                <span class="kh-small-acts"><button type="button" class="btn sm" onclick={() => act(x)}>{x.act === 'add' ? t('Add') : t('Remove')}</button><button type="button" class="btn sm" onclick={() => done(x)}>{t('Ignore')}</button></span></li>
            {/each}
          </ul>
        </div>
      {/if}
    {/each}
    {#if note}<p class="kh-msg" role="status">{note}</p>{/if}
    <p class="kh-quiet">{t('A suggestion, you can change everything.')}</p>
  {/if}
</section>

<style>
  .kh-check {
    margin: 0 0 14px;
  }
  .kh-close {
    margin-left: auto;
  }
  .kh-gh {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px;
    font-weight: 600;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .kh-gh .kh-n {
    font-weight: 400;
    color: var(--ink-3);
  }
</style>
