<script>
  /**
   * «Packliste aufräumen» (Noah 21.10.2026 «5a»): Bausteine › Packliste aufräumen (#/blocks/aufraeumen).
   * One page, a suggestion on top of what you have, everything changeable, one «Apply» with Undo:
   *   1 «Always with you» (Standard of the bike area) in your order (arrows and drag);
   *   2 Repair / Charging only as a button on a day ride;
   *   3 Light early and late, always with a night or a race, the head torch only then;
   *   4 Kälte in three steps (cold, very cold, icy) with their limit and their things.
   * Nothing is deleted. The rules live in the settings «pack-rules» (packrules.svelte.js) and «sets».
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import { SETS_KEY } from '../lib/sets.js';
  import { PACK_RULES_KEY, DAY_OFF_BLOCKS } from '../lib/packrules.svelte.js';
  import { suggestPlan, applyPlan, ownItems, standardNow, COLD_STEPS } from '../lib/packcleanup.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { saveFailed, once } from '../lib/ui/ask.js';
  import { sortable } from '../lib/ui/sortable.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import SortArrows from '../lib/ui/SortArrows.svelte';
  import SortGrip from '../lib/ui/SortGrip.svelte';
  import { Check, Plus, X, Search, Undo2 } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  // a missing setting reads as null (undefined: not read yet)
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY).then((v) => v ?? null));
  const rulesQ = liveQuery(() => db.settings.get(PACK_RULES_KEY).then((v) => v ?? null));
  const items = $derived($itemsQ ?? []);
  const byId = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const own = $derived(ownItems(items));

  let plan = $state(null);
  $effect(() => {
    if (plan || $itemsQ === undefined || $setsQ === undefined || $rulesQ === undefined) return;
    plan = suggestPlan($itemsQ, $setsQ?.value ?? [], $rulesQ?.value ?? null);
  });
  const restart = () => (plan = suggestPlan(items, $setsQ?.value ?? [], $rulesQ?.value ?? null));

  const name = (id) => (byId[id] ? nameOf(byId[id]) : id);
  const left = $derived(plan ? standardNow(items).filter((i) => !plan.std.includes(i.id)) : []);

  // the search under each list: what you type finds your own things
  let q = $state({ std: '', light: '', cold: '', coldHands: '', coldLayers: '' });
  const found = (key, chosen) => {
    const s = q[key].trim().toLowerCase();
    if (!s) return [];
    return own.filter((i) => !chosen.includes(i.id) && nameOf(i).toLowerCase().includes(s)).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'de')).slice(0, 8);
  };
  const add = (list, id, key) => ((q[key] = ''), [...list, id]);
  const move = (list, from, to) => {
    const next = [...list];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    return next;
  };
  const step = (i, dir) => (plan.std = move(plan.std, i, Math.max(0, Math.min(plan.std.length - 1, i + dir))));
  const flipOff = (k) => (plan.dayOff = plan.dayOff.includes(k) ? plan.dayOff.filter((x) => x !== k) : [...plan.dayOff, k]);
  const BLOCK = { repair: 'Repair|block', charge: 'Charging|block' };

  let problem = $state('');
  const apply = once(async () => {
    problem = '';
    const setsBefore = $setsQ ?? null;
    const rulesBefore = $rulesQ ?? null;
    const r = applyPlan($state.snapshot(plan), items, setsBefore?.value ?? [], rulesBefore?.value ?? null);
    const before = r.items.map((i) => byId[i.id]).filter(Boolean);
    try {
      await db.transaction('rw', db.items, db.settings, async () => {
        if (r.items.length) await db.items.bulkPut(r.items);
        await db.settings.put({ key: SETS_KEY, value: r.sets });
        await db.settings.put({ key: PACK_RULES_KEY, value: r.rules });
      });
      offerDone(t('Packing list tidied up: {n} things always with you. New trips start like this.', { n: plan.std.length }), async () => {
        await db.transaction('rw', db.items, db.settings, async () => {
          if (before.length) await db.items.bulkPut(before);
          if (setsBefore) await db.settings.put(setsBefore);
          else await db.settings.delete(SETS_KEY);
          if (rulesBefore) await db.settings.put(rulesBefore);
          else await db.settings.delete(PACK_RULES_KEY);
        });
        restart();
      });
    } catch (err) {
      problem = saveFailed(err);
    }
  });
</script>

{#snippet picker(key, chosen, onadd)}
  <label class="s"><Search size={16} aria-hidden="true" /><input type="search" bind:value={q[key]} aria-label={t('Add a thing: search in your gear')} placeholder={t('Add a thing: search in your gear')} /></label>
  {#if found(key, chosen).length}
    <ul class="hits">
      {#each found(key, chosen) as i (i.id)}
        <li><button type="button" class="btn sm" onclick={() => onadd(i.id)}><Plus size={16} aria-hidden="true" /> {nameOf(i)}</button></li>
      {/each}
    </ul>
  {:else if q[key].trim()}
    <p class="small">{t('Nothing found in your gear.')}</p>
  {/if}
{/snippet}

{#snippet chips(list, onremove)}
  {#if list.length}
    <ul class="chips">
      {#each list as id (id)}
        <li><span>{name(id)}</span><button type="button" class="x" aria-label={t('Remove {name}', { name: name(id) })} onclick={() => onremove(id)}><X size={16} aria-hidden="true" /></button></li>
      {/each}
    </ul>
  {:else}
    <p class="small">{t('Nothing here yet.')}</p>
  {/if}
{/snippet}

<div class="page tidy">
  <PathHead crumbs={[{ label: t('Building blocks'), href: '#/blocks' }]} title={t('Tidy up the packing list')} sub={plan ? tn(plan.std.length, '{n} thing always with you', '{n} things always with you') : ''} />
  <p class="intro">{t('Fewer things that come along by themselves. The app has made a suggestion from your gear; change anything, then tap «Apply». Nothing is deleted: what leaves a list stays in Gear.')}</p>
  {#if problem}<p class="err" role="alert">{problem}</p>{/if}

  {#if plan}
    <section class="box" aria-labelledby="t-std" data-tidy="std">
      <h2 id="t-std" class="title">{t('Always with you')}</h2>
      <p class="small">{t('Comes on every bike trip, in this order. Drag a row or use the arrows to change the order.')}</p>
      <ol class="order" use:sortable={{ onmove: (from, to) => (plan.std = move(plan.std, from, to)) }}>
        {#each plan.std as id, i (id)}
          <li data-sort-id={id}>
            <SortGrip name={name(id)} onstep={(dir) => step(i, dir)} />
            <span class="nm"><b class="num">{i + 1}</b> {name(id)}</span>
            <SortArrows name={name(id)} {i} n={plan.std.length} onstep={(dir) => step(i, dir)} />
            <button type="button" class="x" aria-label={t('Remove {name}', { name: name(id) })} onclick={() => (plan.std = plan.std.filter((x) => x !== id))}><X size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ol>
      {@render picker('std', plan.std, (id) => (plan.std = add(plan.std, id, 'std')))}
      {#if left.length}
        <details class="fold" data-tidy="left">
          <summary>{tn(left.length, 'No longer always with you: {n} thing', 'No longer always with you: {n} things')}</summary>
          <p class="small">{t('They stay in Gear and in their other building blocks. Tap one to keep it always with you.')}</p>
          <ul class="hits">
            {#each left as i (i.id)}
              <li><button type="button" class="btn sm" onclick={() => (plan.std = [...plan.std, i.id])}><Undo2 size={16} aria-hidden="true" /> {nameOf(i)}</button></li>
            {/each}
          </ul>
        </details>
      {/if}
    </section>

    <section class="box" aria-labelledby="t-day" data-tidy="day">
      <h2 id="t-day" class="title">{t('On a day ride only as a button')}</h2>
      <p class="small">{t('On a day ride without a night these blocks do not come by themselves. In Packen they stay a button: one tap brings them.')}</p>
      {#each DAY_OFF_BLOCKS as k (k)}
        <label class="chk"><input type="checkbox" checked={plan.dayOff.includes(k)} onchange={() => flipOff(k)} /> {t(BLOCK[k])}</label>
      {/each}
    </section>

    <section class="box" aria-labelledby="t-light" data-tidy="light">
      <h2 id="t-light" class="title">{t('Light|block')}</h2>
      <p class="small">{t('Light comes when the ride goes into the dark. Early in the morning and in the evening count too.')}</p>
      <label class="f"><span>{t('Counts as dark from this many minutes before sunset to after sunrise')}</span><input type="number" min="0" max="180" step="5" inputmode="numeric" bind:value={plan.darkBuffer} /></label>
      <label class="chk"><input type="checkbox" bind:checked={plan.lightAlways} /> {t('Always on a trip with a night and on a race')}</label>
      <h3 class="sub">{t('Only with a night or a race')}</h3>
      <p class="small">{t('These things of Light stay at home on a day ride, e.g. the head torch.')}</p>
      {@render chips(plan.lightExtra, (id) => (plan.lightExtra = plan.lightExtra.filter((x) => x !== id)))}
      {@render picker('light', plan.lightExtra, (id) => (plan.lightExtra = add(plan.lightExtra, id, 'light')))}
    </section>

    <section class="box" aria-labelledby="t-cold" data-tidy="cold">
      <h2 id="t-cold" class="title">{t('When it is cold')}</h2>
      <p class="small">{t('Three steps. Each comes as a suggestion in Packen when the forecast is below its limit.')}</p>
      {#each COLD_STEPS as s (s.key)}
        <div class="step" data-step={s.key}>
          <label class="lim"><b>{t(s.name)}</b> <span>{t('below|temperature')}</span> <input type="number" min="-30" max="30" step="1" inputmode="numeric" bind:value={plan.cold[s.key].limit} aria-label={t('{step}: below how many °C', { step: t(s.name) })} /> <span>°C</span></label>
          {@render chips(plan.cold[s.key].ids, (id) => (plan.cold[s.key].ids = plan.cold[s.key].ids.filter((x) => x !== id)))}
          {@render picker(s.key, plan.cold[s.key].ids, (id) => (plan.cold[s.key].ids = add(plan.cold[s.key].ids, id, s.key)))}
        </div>
      {/each}
    </section>

    <div class="foot">
      <Btn label={t('Suggestion|tidy')} explain={t('Back to the suggestion of the app')} onclick={restart} />
      <Btn kind="hi" icon={Check} label={t('Apply')} explain={t('Writes everything at once; Undo comes right after')} onclick={apply} />
    </div>
    <p class="small">{t('Trips you already planned keep their list. A new trip starts with the tidy list.')}</p>
  {:else}
    <p class="small" aria-busy="true">{t('Loading …')}</p>
  {/if}
</div>

<style>
  .tidy {
    display: grid;
    gap: 16px;
    max-width: 760px;
  }
  .intro {
    margin: 0;
    color: var(--ink-2);
    max-width: 70ch;
  }
  .box {
    display: grid;
    gap: 10px;
    align-content: start;
    padding: 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .box h2 {
    margin: 0;
    font-size: var(--fs-sub);
  }
  .sub {
    margin: 6px 0 0;
    font-size: var(--fs-body);
  }
  .small {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .order,
  .hits,
  .chips {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .order li {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .nm {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nm .num {
    display: inline-block;
    min-width: 1.6em;
    color: var(--ink-2);
  }
  .hits {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chips li {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding-left: 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper-2);
  }
  .x {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .s {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-2);
  }
  .s input,
  .f input,
  .lim input {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink);
    font: inherit;
    padding: 0 10px;
  }
  .s input {
    flex: 1;
    min-width: 0;
  }
  .f {
    display: grid;
    gap: 4px;
  }
  .f input {
    max-width: 120px;
  }
  .lim {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lim input {
    width: 84px;
  }
  .chk {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
  }
  .chk input {
    width: 22px;
    height: 22px;
  }
  .step {
    display: grid;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .fold summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink-2);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
