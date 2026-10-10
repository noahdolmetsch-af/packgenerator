<script>
  /**
   * v0.77.0 (answer 1a): «Frag den Helfer» at the top of New trip. The proposal is a card above the
   * form: the understood conditions as chips (a tap changes one or leaves it out), the blocks it would
   * switch on (a tap switches one off), 4–6 extra items from the person's own gear, each with its
   * reason and ×. «Übernehmen» puts what is left into the form, «Verwerfen» closes the card.
   * Everything is a suggestion: the form below stays as it is until «Übernehmen».
   */
  import { Sparkles, Pencil, Check, X } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, tn, nameOf, isDe } from '../i18n.svelte.js';
  import { WX_PRESETS } from '../trips.js';
  import { localDay } from '../localday.js';
  import { ask, errorText, helper, isPaused } from './client.svelte.js';
  import { tripPayload } from './payload.js';
  import { conditionChips } from './logic.js';
  import './helper.css';

  /** areas: [{ key, name }] (names already in words); sets: blocks with label; nightKeys: blocks that come with the night. */
  let { items = [], bikes = [], sets = [], areas = [], prefill = '', onapply } = $props();

  const learnQ = liveQuery(() => db.learnings.toArray());
  // svelte-ignore state_referenced_locally
  let q = $state(prefill);
  let busy = $state(false);
  let msg = $state('');
  let prop = $state(null); // the checked answer
  let cond = $state({});
  let dropped = $state(new Set());
  let blocksOff = $state(new Set());
  let itemsOff = $state(new Set());
  let editing = $state(null);

  const byId = $derived(new Map(items.map((i) => [i.id, i])));
  const chips = $derived(prop ? conditionChips(cond, { dropped }) : []);
  const blockRows = $derived(prop ? prop.blocks.map((k) => sets.find((s) => s.key === k)).filter(Boolean) : []);
  const itemRows = $derived(prop ? prop.items.filter((r) => byId.has(r.id) && !itemsOff.has(r.id)) : []);

  async function get() {
    const question = q.trim();
    if (question.length < 3 || busy) return;
    busy = true;
    msg = '';
    const input = tripPayload(question, { items, bikes, sets, areas, learnings: $learnQ ?? (await db.learnings.toArray()), today: localDay(), lang: isDe() ? 'de' : 'en' });
    const r = await ask('trip', input);
    busy = false;
    if (!r.ok) return (msg = errorText(r.error, { capChf: helper.capChf }));
    prop = r.result;
    cond = { ...r.result.conditions };
    dropped = new Set();
    blocksOff = new Set();
    itemsOff = new Set();
    editing = null;
  }
  // From the search («Als Packliste vorschlagen»): the question is there, the proposal comes at once.
  let asked = false;
  $effect(() => {
    if (prefill && !asked) (asked = true), get();
  });

  const NIGHT = { none: 'None|overnight', lodging: 'Lodging', outdoor: 'Outdoor (tent, bivvy)' };
  const preset = (lo, hi) => WX_PRESETS.find((p) => p.min <= lo && hi <= p.max + 2) ?? null;
  function label(c) {
    if (c.key === 'area') return { text: areas.find((a) => a.key === c.value)?.name ?? c.value };
    if (c.key === 'days') return { text: tn(c.value, '{n} day', '{n} days') };
    if (c.key === 'overnight') return { text: t(NIGHT[c.value]) };
    if (c.key === 'temp') {
      const [lo, hi] = c.value;
      const p = preset(lo, hi);
      return { text: p ? t(p.name) : t('Weather'), sub: lo === hi ? `${lo} °C` : `${lo}–${hi} °C` };
    }
    if (c.key === 'rain') return { text: c.value === 'rain' ? t('Rain') : t('Dry|weather') };
    if (c.key === 'bike') return { text: bikes.find((b) => b.id === c.value)?.name ?? '' };
    return { text: '' };
  }
  const flip = (setState, key) => {
    const s = new Set(setState);
    s.has(key) ? s.delete(key) : s.add(key);
    return s;
  };
  function drop(key) {
    dropped = new Set([...dropped, key]);
    editing = null;
  }
  function apply() {
    const out = {};
    for (const c of chips) {
      if (c.key === 'area') out.area = cond.area;
      if (c.key === 'days') out.days = cond.days;
      if (c.key === 'overnight') (out.overnight = cond.overnight), (out.cook = cond.cook);
      if (c.key === 'temp') (out.tempMin = cond.tempMin ?? cond.tempMax), (out.tempMax = cond.tempMax ?? cond.tempMin);
      if (c.key === 'rain') out.rain = cond.rain;
      if (c.key === 'bike') out.bikeId = cond.bikeId;
    }
    onapply?.({ conditions: out, blocks: blockRows.map((b) => b.key).filter((k) => !blocksOff.has(k)), items: itemRows.map((r) => ({ ...r })) });
    prop = null;
    msg = t('Taken over. Change anything below.');
  }
  function discard() {
    prop = null;
    msg = '';
  }
  const key = (e) => e.key === 'Enter' && (e.preventDefault(), get());
</script>

<section class="kh kh-ask" aria-labelledby="kh-ask-l">
  <label class="lbl" id="kh-ask-l" for="kh-q">{t('Ask the helper')}</label>
  {#if isPaused()}
    <p class="kh-msg" role="status">{errorText('paused', { capChf: helper.capChf })}</p>
  {:else}
    <div class="kh-row">
      <div class="kh-field"><span class="kh-ic"><Sparkles size={18} aria-hidden="true" /></span><input id="kh-q" class="inp" bind:value={q} onkeydown={key} placeholder={t('e.g. 3 days Jura, 5 °C, bivvy')} enterkeyhint="send" autocomplete="off" /></div>
      <button type="button" class="btn" disabled={busy || q.trim().length < 3} onclick={get}>{t('Get a suggestion')}</button>
    </div>
    {#if busy}<p class="kh-busy" role="status">{t('The helper is thinking …')}</p>{/if}
    {#if msg}<p class="kh-msg" role="status">{msg}</p>{/if}
  {/if}
  {#if prop}
    <div class="kh-card kh-prop" role="region" aria-label={t('Suggestion from the helper')}>
      <p class="kh-head"><span class="kh-ic"><Sparkles size={20} aria-hidden="true" /></span>{t('Suggestion from the helper')}</p>
      <p class="kh-sub">{t('This is how I understood you. Tap to change something.')}</p>
      {#if chips.length}
        <div class="kh-chips">
          {#each chips as c (c.key)}
            {@const l = label(c)}
            <button type="button" class="kh-chip" aria-expanded={editing === c.key} onclick={() => (editing = editing === c.key ? null : c.key)}>{l.text}{#if l.sub} <small>{l.sub}</small>{/if}<span class="kh-ic"><Pencil size={14} aria-hidden="true" /></span></button>
          {/each}
        </div>
        {#if editing}
          <div class="kh-edit">
            {#if editing === 'area'}
              <label>{t('Area')}<select class="sel" bind:value={cond.area}>{#each areas as a (a.key)}<option value={a.key}>{a.name}</option>{/each}</select></label>
            {:else if editing === 'days'}
              <label>{t('Days')}<input class="inp kh-num" type="number" min="1" max="60" bind:value={cond.days} /></label>
            {:else if editing === 'overnight'}
              <label>{t('Overnight')}<select class="sel" bind:value={cond.overnight}>{#each Object.entries(NIGHT) as [k, n] (k)}<option value={k}>{t(n)}</option>{/each}</select></label>
              {#if cond.overnight === 'outdoor'}<label><input type="checkbox" bind:checked={cond.cook} /> {t('Cooking')}</label>{/if}
            {:else if editing === 'temp'}
              <label>{t('from')}<input class="inp kh-num" type="number" min="-30" max="45" bind:value={cond.tempMin} aria-label={t('Lowest temperature °C')} /></label>
              <label>{t('to')}<input class="inp kh-num" type="number" min="-30" max="45" bind:value={cond.tempMax} aria-label={t('Highest temperature °C')} /> °C</label>
            {:else if editing === 'rain'}
              <label>{t('Rain')}<select class="sel" bind:value={cond.rain}><option value="none">{t('Dry|weather')}</option><option value="rain">{t('Rain')}</option></select></label>
            {:else if editing === 'bike'}
              <label>{t('Bike')}<select class="sel" bind:value={cond.bikeId}>{#each bikes as b (b.id)}<option value={b.id}>{b.name}</option>{/each}</select></label>
            {/if}
            <button type="button" class="btn sm" onclick={() => (editing = null)}><Check size={16} aria-hidden="true" />{t('Done|edit')}</button>
            <button type="button" class="btn sm" onclick={() => drop(editing)}>{t('Leave out')}</button>
          </div>
        {/if}
      {/if}
      {#if blockRows.length}
        <p class="kh-k">{t('These building blocks I switch on')}</p>
        <div class="kh-chips">
          {#each blockRows as b (b.key)}
            {@const on = !blocksOff.has(b.key)}
            <button type="button" class="kh-chip" class:on class:off={!on} aria-pressed={on} onclick={() => (blocksOff = flip(blocksOff, b.key))}>{#if on}<span class="kh-ic"><Check size={14} aria-hidden="true" /></span>{/if}{b.label}</button>
          {/each}
        </div>
      {/if}
      {#if itemRows.length}
        <p class="kh-k">{t('Also from your gear')}</p>
        <ul class="kh-list">
          {#each itemRows as r (r.id)}
            {@const it = byId.get(r.id)}
            <li><span class="kh-m"><b>{nameOf(it)}</b>{#if r.reason}<small>{r.reason}</small>{/if}</span><button type="button" class="kh-x" aria-label={t('Remove {name}', { name: nameOf(it) })} onclick={() => (itemsOff = flip(itemsOff, r.id))}><X size={18} aria-hidden="true" /></button></li>
          {/each}
        </ul>
      {/if}
      {#if prop.note}<p class="kh-quiet">{prop.note}</p>{/if}
      <div class="kh-acts">
        <button type="button" class="btn hi" onclick={apply}>{t('Take over')}</button>
        <button type="button" class="btn" onclick={discard}>{t('Discard')}</button>
        <p class="kh-quiet">{t('A suggestion, you can change everything.')}</p>
      </div>
    </div>
  {/if}
</section>

<style>
  .kh-ask {
    margin: 4px 0 16px;
  }
  .kh-prop {
    margin-top: 12px;
  }
</style>
