<script>
  /**
   * Paket C › Bedeutung neben Leistung (#/me/ruhig/bedeutung; 996 Ideen UC-140-I1, UC-220-I3, UC-157-I3,
   * UC-229-I2): «Touren nach Bedeutung», «Gute Entscheidungen», «Eigenes Entdeckerbingo», «Belohnung ohne
   * Kauf». No ranking, no points anywhere. Logic: bedeutung.js; editable kinds: KindsEdit.svelte.
   */
  import { liveQuery } from 'dexie';
  import { Tags, ThumbsUp, Grid3x3, Gift, Plus, Trash2, Settings2 } from '@lucide/svelte';
  import Card from './Card.svelte';
  import KindsEdit from './KindsEdit.svelte';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { settingQ, saveSetting } from './store.js';
  import { openFromHash } from './open.js';
  import { dmy, realTrips, tripEnd } from './base.js';
  import { kindName } from './kinds.js';
  import { MEANING_KEY, DECISIONS_KEY, DECISION_STARTS, BINGO_KEY, REWARDS_KEY, meaningsOf, flipMeaning, meaningCount, dropMeaning, tripsWith, meaningStore, decisionsOf, newDecision, decisionList, bingoOf, addFind, dropFind, dropBingoKind, bingoCard, rewardsOf, takeReward, dropTaken, dropRewardKind } from './bedeutung.js';

  const today = localDay();
  const year = today.slice(0, 4);
  const first = openFromHash();
  let open = $state({ meaning: first === 'meaning', decisions: first === 'decisions', bingo: first === 'bingo', rewards: first === 'rewards' });
  const nm = (k) => kindName(k, t);

  const tripsQ = liveQuery(() => db.trips.toArray());
  const replanQ = liveQuery(() => db.abAnswers.where('qid').equals('ziele.umplanen').toArray().catch(() => []));
  const mQ = settingQ(MEANING_KEY);
  const dQ = settingQ(DECISIONS_KEY);
  const bQ = settingQ(BINGO_KEY);
  const rQ = settingQ(REWARDS_KEY);

  /* Touren nach Bedeutung */
  const m = $derived(meaningsOf($mQ));
  const saveM = (x) => saveSetting(MEANING_KEY, meaningStore(x));
  const trips = $derived(realTrips($tripsQ ?? []).sort((a, b) => b.startDate.localeCompare(a.startDate)));
  let filter = $state('');
  let editKinds = $state(false);
  let showAll = $state(false);
  const shownTrips = $derived(filter ? tripsWith(m, trips, filter) : showAll ? trips : trips.slice(0, 8));
  const tripHref = (x) => (tripEnd(x) < today ? `#/tour/${encodeURIComponent(`t:${x.id}`)}` : '');

  /* Gute Entscheidungen */
  const own = $derived(decisionsOf($dQ));
  const replans = $derived(($replanQ ?? []).map((r) => ({ day: r.day, good: [].concat(r.value)[0] === 'good' })));
  const decisions = $derived(decisionList(own, replans));
  let dText = $state('');
  let dDay = $state(today);
  let dTrip = $state('');
  function addDecision(e) {
    e.preventDefault();
    const x = newDecision({ text: dText, day: dDay, tripId: dTrip });
    if (!x) return;
    saveSetting(DECISIONS_KEY, [x, ...own]);
    dText = '';
  }
  async function removeDecision(x) {
    const ok = await askDelete({ title: t('Delete «{name}»?', { name: x.text }) });
    if (ok !== 'delete') return;
    const before = own;
    await deleteWithUndo({ run: () => saveSetting(DECISIONS_KEY, own.filter((y) => y.id !== x.id)).then(() => before), undo: (s) => saveSetting(DECISIONS_KEY, s), text: t('«{name}» deleted.', { name: x.text }), name: x.text });
  }
  const tripName = (id) => trips.find((x) => x.id === id)?.title ?? '';

  /* Entdeckerbingo */
  const b = $derived(bingoOf($bQ));
  const card = $derived(bingoCard(b, year));
  const saveB = (x) => saveSetting(BINGO_KEY, x);
  let cell = $state('');
  let fText = $state('');
  let editFields = $state(false);

  /* Belohnung ohne Kauf */
  const r = $derived(rewardsOf($rQ));
  const saveR = (x) => saveSetting(REWARDS_KEY, x);
  let rFor = $state('');
  let editRewards = $state(false);
</script>

<ul class="rh-cards">
  <Card id="meaning" icon={Tags} title={t('Trips by meaning')} lead={t('Your own marks like «With friends» or «First night outside»; find trips by them')} bind:open={open.meaning}>
    <div class="rh-chips" aria-label={t('Show trips with')}>
      <button type="button" class="rh-chip" aria-pressed={!filter} onclick={() => (filter = '')}>{t('All trips')}</button>
      {#each m.kinds as k (k.id)}<button type="button" class="rh-chip" aria-pressed={filter === k.id} onclick={() => (filter = filter === k.id ? '' : k.id)}>{nm(k)} · {meaningCount(m, k.id)}</button>{/each}
    </div>
    {#if shownTrips.length}
      <ul class="rh-list" data-meaning-trips>
        {#each shownTrips as x (x.id)}
          <li class="rh-trip">
            <span class="rh-grow">
              {#if tripHref(x)}<a href={tripHref(x)}><b>{x.title || t('Trip')}</b></a>{:else}<b>{x.title || t('Trip')}</b>{/if}
              <small>{dmy(x.startDate)}</small>
              <span class="rh-chips">{#each m.kinds as k (k.id)}<button type="button" class="rh-chip sm" aria-pressed={(m.trips[x.id] ?? []).includes(k.id)} onclick={() => saveM(flipMeaning(m, x.id, k.id))}>{nm(k)}</button>{/each}</span>
            </span>
          </li>
        {/each}
      </ul>
      {#if !filter && !showAll && trips.length > 8}<button type="button" class="btn sm btn-link" onclick={() => (showAll = true)}>{tn(trips.length, 'Show all {n} trips', 'Show all {n} trips')}</button>{/if}
    {:else}<p class="rh-empty">{filter ? t('No trip with this mark yet.') : t('No trip yet.')}</p>{/if}
    <button type="button" class="btn sm" onclick={() => (editKinds = !editKinds)} aria-expanded={editKinds}><Settings2 size={14} aria-hidden="true" />{t('Change the marks')}</button>
    {#if editKinds}
      <KindsEdit kinds={m.kinds} count={(id) => meaningCount(m, id)} what={(n) => tn(n, '{n} trip', '{n} trips')} none={t('Without this mark')} noneHint={t('The trips stay, only the mark goes.')} label={t('New mark, e.g. With my brother')}
        onsave={(kinds) => saveM({ ...m, kinds })} ondelete={async (id, to) => { const snap = meaningStore(m); await saveM(dropMeaning(m, id, to)); if (filter === id) filter = ''; return snap; }} onundo={(snap) => saveSetting(MEANING_KEY, snap)} />
    {/if}
  </Card>

  <Card id="decisions" icon={ThumbsUp} title={t('Good decisions')} lead={t('Turned back on purpose, accepted help, took a day off: worth keeping')} bind:open={open.decisions}>
    <form class="rh-new" onsubmit={addDecision}>
      <div class="rh-chips">{#each DECISION_STARTS as s (s)}<button type="button" class="rh-chip" onclick={() => (dText = `${t(s)}: `)}>{t(s)}</button>{/each}</div>
      <input class="inp" bind:value={dText} placeholder={t('e.g. Turned back below the pass, the storm came an hour later')} aria-label={t('Your decision')} data-decision-text />
      <div class="rh-row">
        <input class="inp" type="date" max={today} bind:value={dDay} aria-label={t('Day')} />
        {#if trips.length}<select class="inp" bind:value={dTrip} aria-label={t('Trip (optional)')}><option value="">{t('Without a trip')}</option>{#each trips.slice(0, 30) as x (x.id)}<option value={x.id}>{x.title} · {dmy(x.startDate)}</option>{/each}</select>{/if}
        <button type="submit" class="btn hi" disabled={!dText.trim()}><Plus size={16} aria-hidden="true" />{t('Keep it')}</button>
      </div>
    </form>
    {#if decisions.length}
      <ul class="rh-list" data-decisions>
        {#each decisions as x (x.id)}
          <li>
            <ThumbsUp size={16} aria-hidden="true" />
            <span class="rh-grow">{x.from === 'evening' ? t('Replanned on purpose, and it was good') : x.text}<small>{[dmy(x.day), x.tripId ? tripName(x.tripId) : '', x.from === 'evening' ? t('from the evening check') : ''].filter(Boolean).join(' · ')}</small></span>
            {#if x.from !== 'evening'}<button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => removeDecision(x)}><Trash2 size={16} /></button>{/if}
          </li>
        {/each}
      </ul>
    {:else}<p class="rh-empty">{t('Nothing kept yet. A good decision is often the quiet one.')}</p>{/if}
  </Card>

  <Card id="bingo" icon={Grid3x3} title={t('Your own discovery bingo')} lead={t('Your own fields like a good fountain or a place with history; no ranking')} bind:open={open.bingo}>
    <p class="rh-help">{tn(card.marked, '{n} of 9 fields in {year}', '{n} of 9 fields in {year}', { year })}{#if card.lines.length} · <b>{tn(card.lines.length, '{n} Bingo!', '{n} Bingos!')}</b>{/if}</p>
    <ol class="rh-bingo" aria-label={t('Your own discovery bingo')}>
      {#each card.cells as c (c.kind.id)}
        <li><button type="button" class="rh-cell" class:on={c.finds.length} aria-pressed={cell === c.kind.id} onclick={() => (cell = cell === c.kind.id ? '' : c.kind.id)}><span>{nm(c.kind)}</span>{#if c.finds.length}<small>{c.finds.length}×</small>{/if}</button></li>
      {/each}
    </ol>
    {#if cell}
      {@const c = card.cells.find((x) => x.kind.id === cell)}
      <form class="rh-row" onsubmit={(e) => (e.preventDefault(), saveB(addFind(b, cell, today, fText)), (fText = ''))}>
        <input class="inp" bind:value={fText} placeholder={t('Where? e.g. fountain in Twann')} aria-label={t('Where did you find it?')} data-find-text />
        <button type="submit" class="btn sm hi"><Plus size={14} aria-hidden="true" />{t('Found today')}</button>
      </form>
      {#if c?.finds.length}<ul class="rh-list">{#each c.finds as f (f.id)}<li><span class="rh-grow">{f.text || nm(c.kind)}<small>{dmy(f.day)}</small></span><button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => saveB(dropFind(b, f.id))}><Trash2 size={16} /></button></li>{/each}</ul>{/if}
    {/if}
    <button type="button" class="btn sm" onclick={() => (editFields = !editFields)} aria-expanded={editFields}><Settings2 size={14} aria-hidden="true" />{t('Change the fields')}</button>
    {#if editFields}
      <p class="rh-help">{t('The first 9 fields make the card.')}</p>
      <KindsEdit kinds={b.kinds} count={(id) => b.finds.filter((f) => f.kind === id).length} what={(n) => tn(n, '{n} find', '{n} finds')} none={t('Without a field')} noneHint={t('The finds stay in your backup, out of sight.')} label={t('New field, e.g. A tree house')}
        onsave={(kinds) => saveB({ ...b, kinds })} ondelete={async (id, to) => { const snap = b; await saveB(dropBingoKind(b, id, to)); return snap; }} onundo={(snap) => saveB(snap)} />
    {/if}
  </Card>

  <Card id="rewards" icon={Gift} title={t('Rewards without buying')} lead={t('Free time, something together, a day of doing nothing: all of the same worth')} bind:open={open.rewards}>
    <input class="inp" bind:value={rFor} placeholder={t('For what? e.g. first 100 km ride (optional)')} aria-label={t('For what')} />
    <div class="rh-chips" data-rewards>{#each r.kinds as k (k.id)}<button type="button" class="rh-chip" onclick={() => (saveR(takeReward(r, k.id, today, rFor)), (rFor = ''))}><Gift size={14} aria-hidden="true" /> {nm(k)}</button>{/each}</div>
    <p class="rh-help">{t('Tap one when you take it. It is kept with the day.')}</p>
    {#if r.taken.length}
      <ul class="rh-list">{#each r.taken.slice(0, 12) as x (x.id)}{@const k = r.kinds.find((y) => y.id === x.kind)}<li><span class="rh-grow">{k ? nm(k) : t('Reward')}<small>{[dmy(x.day), x.for].filter(Boolean).join(' · ')}</small></span><button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => saveR(dropTaken(r, x.id))}><Trash2 size={16} /></button></li>{/each}</ul>
    {/if}
    <button type="button" class="btn sm" onclick={() => (editRewards = !editRewards)} aria-expanded={editRewards}><Settings2 size={14} aria-hidden="true" />{t('Change the rewards')}</button>
    {#if editRewards}
      <KindsEdit kinds={r.kinds} count={(id) => r.taken.filter((x) => x.kind === id).length} what={(n) => tn(n, '{n} time taken', '{n} times taken')} none={t('Without a reward')} noneHint={t('The days stay, without a name.')} label={t('New reward, e.g. A film evening')}
        onsave={(kinds) => saveR({ ...r, kinds })} ondelete={async (id, to) => { const snap = r; await saveR(dropRewardKind(r, id, to)); return snap; }} onundo={(snap) => saveR(snap)} />
    {/if}
  </Card>
</ul>

<style>
  .rh-new {
    display: grid;
    gap: var(--sp-2);
  }
  .rh-trip .rh-grow {
    display: grid;
    gap: 4px;
  }
  .rh-chip.sm {
    min-height: 32px;
    padding: 2px 10px;
  }
  .rh-bingo {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .rh-cell {
    width: 100%;
    min-height: 72px;
    padding: 6px;
    display: grid;
    place-items: center;
    gap: 2px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: center;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  .rh-cell.on {
    border-style: solid;
    border-color: var(--accent);
    background: var(--accent-soft);
    font-weight: 600;
  }
  .rh-cell[aria-pressed='true'] {
    outline: 2px solid var(--focus);
  }
  .rh-cell small {
    color: var(--ink-2);
  }
</style>
