<script>
  /**
   * Einzelideen 33 und 36 (996 Ideen, Noah 25.10.2026): Ich › Ruhig und persönlich › Ausgeblendet und aus.
   *   36 «Vorschläge nach Art»: a kind of suggestion (to buy, performance, free time, tools) off on every page.
   *   33 «Alles Ausgeblendete»: everything you hid or switched off in one list (lib/ichideen/hidden.js), each
   *      with what stays behind it and «Show again». Nothing is deleted by hiding.
   */
  import { liveQuery } from 'dexie';
  import { Eye, SlidersHorizontal } from '@lucide/svelte';
  import { db } from '../db.js';
  import { anp, change } from '../anpassen.svelte.js';
  import { setPlaceHidden, setTabHidden, setPartHidden } from '../anpassen.js';
  import { ALL_PLACES, PLACE_TABS } from '../nav.js';
  import { STANDARD_LISTS, OVERRIDES_KEY, listFor } from '../standard.js';
  import { saveList, toggleHidden } from '../lists.js';
  import { FEATURES } from '../features.js';
  import { SUGGEST_AREAS, SUGGEST_KINDS } from '../clear/suggest.js';
  import { suggest, setArea, watchSuggest } from '../clear/suggest.svelte.js';
  import { NOT_KEY, notForMeOf, unsetNotForMe } from './weniger.js';
  import { settingQ, saveSetting } from './store.js';
  import { hiddenGroups, hiddenCount } from '../ichideen/hidden.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn } from '../i18n.svelte.js';
  import { actName } from '../flow/ui.svelte.js';
  import Card from './Card.svelte';
  import { openFromHash } from './open.js';

  watchSuggest();
  const first = openFromHash();
  let open = $state({ kinds: first !== 'hidden', hidden: first !== 'kinds' });
  const listsQ = settingQ(OVERRIDES_KEY);
  const notQ = settingQ(NOT_KEY);
  const actsQ = liveQuery(async () => {
    const acts = (await db.flowActs.toArray()).filter((a) => a.paused);
    const logs = {};
    for (const a of acts) logs[a.id] = await db.flowLog.where('actId').equals(a.id).count();
    return { acts, logs };
  });

  const groups = $derived.by(() => {
    void anp.v;
    const all = $listsQ ?? {};
    return hiddenGroups({
      cfg: anp.cfg,
      places: ALL_PLACES,
      tabs: PLACE_TABS,
      lists: STANDARD_LISTS.map((l) => ({ key: l.key, name: l.name, entries: listFor(l.key, all) })),
      // paused activities in the language of the app (their German name when there is one)
      acts: ($actsQ?.acts ?? []).map((a) => ({ ...a, name: actName(a) })),
      logs: $actsQ?.logs ?? {},
      notFor: notForMeOf($notQ),
      features: FEATURES,
      suggestOff: suggest.value,
      areas: SUGGEST_AREAS,
    });
  });
  const n = $derived(hiddenCount(groups));
  const name = (r) => (r.tr ? t(r.name) : r.name);
  const dataLine = (r) => (r.data === 'ticks' ? tn(r.dataN, '{n} tick stays saved.', '{n} ticks stay saved.') : t(r.data));

  async function showAgain(r) {
    const nm = name(r);
    if (r.kind === 'menu') change((c) => setPlaceHidden(c, r.ref.place, false));
    else if (r.kind === 'tab') change((c) => setTabHidden(c, r.ref.place, r.ref.tab, false));
    else if (r.kind === 'part') change((c) => setPartHidden(c, r.ref.page, r.ref.key, false));
    else if (r.kind === 'list') {
      const all = (await db.settings.get(OVERRIDES_KEY))?.value ?? {};
      await saveList(db, r.ref.list, toggleHidden(all[r.ref.list], r.ref.id));
    } else if (r.kind === 'act') await db.flowActs.update(r.ref.id, { paused: false });
    else if (r.kind === 'notfor') await saveSetting(NOT_KEY, unsetNotForMe(notForMeOf($notQ), r.ref.id));
    else if (r.kind === 'suggest') await setArea(r.ref.key, true);
    offerDone(t('«{name}» shows again.', { name: nm }));
  }
</script>

<ul class="rh-cards">
  <Card id="kinds" icon={SlidersHorizontal} title={t('Suggestions by kind')} lead={t('A kind of suggestion off on every page at once')} bind:open={open.kinds}>
    <p class="rh-help">{t('Switch off a kind of suggestion, on every page at once. Your data stays; the app only stops suggesting.')}</p>
    <ul class="aus-sw" data-aus="kinds">
      {#each SUGGEST_KINDS as a (a.key)}
        <li>
          <label>
            <input type="checkbox" role="switch" checked={suggest.on[a.key]} onchange={(e) => setArea(a.key, e.currentTarget.checked)} data-suggest-kind={a.key} />
            <span><b>{t(a.label)}</b><small>{t(a.text)}</small></span>
          </label>
        </li>
      {/each}
    </ul>
    <p class="rh-help"><a href="#/me/look">{t('More switches by area under Me › Look')}</a></p>
  </Card>
  <Card id="hidden" icon={Eye} title={t('Everything hidden')} lead={n ? tn(n, '{n} thing hidden or switched off', '{n} things hidden or switched off') : t('Nothing hidden right now')} bind:open={open.hidden}>
    <div data-aus="all">
      {#if n}
        <p class="rh-help">{t('Hiding never deletes anything. Each row says what stays behind it.')}</p>
        {#each groups as g (g.key)}
          <h3 class="aus-gh">{t(g.title)}</h3>
          <ul class="aus-list" data-aus-group={g.key}>
            {#each g.rows as r (r.id)}
              <li data-aus-row={r.id}>
                <span class="aus-m"><b>{name(r)}</b>{#if r.where}<small>{r.whereTr ? t(r.where) : r.where}</small>{/if}<small>{dataLine(r)}</small></span>
                <button type="button" class="btn sm" onclick={() => showAgain(r)}>{t('Show again')}</button>
              </li>
            {/each}
          </ul>
        {/each}
      {:else}
        <p class="rh-help">{t('Nothing is hidden or switched off. When you hide a place, a tab, a part of a page, an entry of a list or an activity, it shows up here.')}</p>
      {/if}
    </div>
  </Card>
</ul>

<style>
  .aus-sw,
  .aus-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .aus-sw label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }
  .aus-sw input {
    margin-top: 3px;
  }
  .aus-sw small,
  .aus-m small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .aus-gh {
    margin: 10px 0 4px;
    font-size: var(--fs-body);
  }
  .aus-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .aus-m {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: break-word;
  }
</style>
