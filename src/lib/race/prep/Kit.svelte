<script>
  /** Vorbereiten › Mandatory kit (4), Stomach test (26), Rig comparison (11). */
  import { Plus, ExternalLink } from '@lucide/svelte';
  import RaceBox from '../RaceBox.svelte';
  import EditList from '../EditList.svelte';
  import { rulesFromText, checkRules, rigOf, RIG_PARTS, VERDICTS, stomachList, newId } from '../race.js';
  import { packedOf } from '../prep-lib.js';
  import { t, tn, num, nameOf } from '../../i18n.svelte.js';

  let { ctx } = $props();

  // 4 · Mandatory kit
  let paste = $state('');
  const packed = $derived(packedOf(ctx.trip, ctx.items, nameOf));
  const checked = $derived(Object.fromEntries(checkRules(ctx.race.rules, packed).map((r) => [r.id, r])));
  const found = $derived(Object.values(checked).filter((r) => r.item).length);
  const saveRules = (list) => ctx.save({ rules: list });
  function addPasted() {
    const lines = rulesFromText(paste);
    if (!lines.length) return;
    saveRules([...ctx.race.rules, ...lines.map((text) => ({ id: newId('rule'), text }))]);
    paste = '';
  }
  const url = $derived(/^https?:\/\//i.test(ctx.stored.rulesUrl ?? '') ? ctx.stored.rulesUrl : '');

  // 26 · Stomach test
  const tests = $derived(ctx.race.stomach.map((x) => ({ ...x, text: x.food ?? '' })));
  const saveTests = (list) => ctx.save({ stomach: list.map(({ text, ...x }) => ({ ...x, food: text })) });
  const setVerdict = (id, verdict) => saveTests(tests.map((x) => (x.id === id ? { ...x, verdict } : x)));
  const foods = $derived(stomachList(ctx.race.stomach));
  const verdictName = Object.fromEntries(VERDICTS.map((v) => [v.key, v.name]));

  // 11 · Rig comparison
  const others = $derived(ctx.trips.filter((x) => x.id !== ctx.trip.id && (x.entries?.length ?? 0) > 0).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')));
  let otherId = $state('');
  const other = $derived(others.find((x) => x.id === otherId) ?? others[0] ?? null);
  const rigA = $derived(rigOf(ctx.trip, ctx.items));
  const rigB = $derived(other ? rigOf(other, ctx.items) : null);
  const kg = (g) => num(Math.round(g / 100) / 10);
</script>

<RaceBox
  id="prep-rules"
  title={t('Mandatory kit')}
  what="Keeps the kit the race rules ask for and checks it against the packing list of this trip."
  why="At the start nobody is sent back for a missing whistle or rear light."
  from="The rules you paste from the race website, and the packing list of this trip."
>
  <label class="rc-lab">{t('Link to the rules')}<input class="inp" type="url" inputmode="url" placeholder="https://" value={ctx.stored.rulesUrl ?? ''} onchange={(e) => ctx.save({ rulesUrl: e.currentTarget.value.trim() })} data-race-rules-url /></label>
  {#if url}<a class="btn sm" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" />{t('Open the rules')}</a>{/if}
  <label class="rc-lab">{t('Paste the list of the rules (one thing per line)')}<textarea class="inp" rows="3" bind:value={paste} data-race-rules-paste></textarea></label>
  <button type="button" class="btn" disabled={!paste.trim()} onclick={addPasted} data-race-rules-add><Plus size={16} aria-hidden="true" />{t('Add these lines')}</button>
  {#if ctx.race.rules.length}<p class="rc-note">{t('{n} of {m} found in the packing list.', { n: found, m: ctx.race.rules.length })}</p>{/if}
  <EditList rows={ctx.race.rules} onchange={saveRules} label={t('Rule')} addLabel={t('Add')} placeholder={t('e.g. Rear light, whistle, survival blanket')} name={t('Rule')} testid="rules">
    {#snippet sub(r)}
      {@const c = checked[r.id]}
      {#if c?.item}<small class="rc-ok">{c.byHand ? t('Linked: {name}', { name: c.item.name }) : t('In the packing list: {name}', { name: c.item.name })}</small>
      {:else}<small class="rc-warn">{t('Missing in the packing list')}</small>{/if}
    {/snippet}
    {#snippet fields(edit)}
      <label class="rc-lab">{t('Thing in the packing list')}
        <select class="inp" bind:value={edit.itemId} data-race-rule-item>
          <option value="">{t('Find it by its name')}</option>
          {#each packed as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
        </select>
      </label>
    {/snippet}
  </EditList>
</RaceBox>

<RaceBox
  id="prep-stomach"
  title={t('Stomach test')}
  what="Notes what you ate on long rides and how it went."
  why="In the race you only take food your stomach knows after many hours."
  from="What you write down after your training rides."
>
  <EditList rows={tests} onchange={saveTests} label={t('Food')} addLabel={t('Add a test')} placeholder={t('e.g. Rice cakes, gel, salted nuts')} name={t('Test')} testid="stomach" blank={{ h: null, verdict: 'mid', day: ctx.today }}>
    {#snippet sub(r)}<small>{[r.day, r.h ? t('after {h} h', { h: num(r.h) }) : ''].filter(Boolean).join(' · ')}</small>{/snippet}
    {#snippet row(r)}
      <select class="inp" aria-label={t('How it went: {name}', { name: r.text })} value={r.verdict ?? 'mid'} onchange={(e) => setVerdict(r.id, e.currentTarget.value)} data-race-stomach-verdict>
        {#each VERDICTS as v (v.key)}<option value={v.key}>{t(v.name)}</option>{/each}
      </select>
    {/snippet}
    {#snippet fields(edit)}
      <label class="rc-lab">{t('After how many hours')}<input class="inp" type="number" min="0" max="200" step="0.5" bind:value={edit.h} /></label>
      <label class="rc-lab">{t('Day')}<input class="inp" type="date" bind:value={edit.day} /></label>
      <label class="rc-lab">{t('How it went')}
        <select class="inp" bind:value={edit.verdict}>{#each VERDICTS as v (v.key)}<option value={v.key}>{t(v.name)}</option>{/each}</select>
      </label>
    {/snippet}
  </EditList>
  {#if foods.length}
    <h3 class="rc-h2">{t('Only take what went well')}</h3>
    <ul class="rc-list" data-race-stomach-sum>
      {#each foods as f (f.food)}
        <li class="rc-row"><span class:rc-ok={f.verdict === 'good'} class:rc-warn={f.verdict === 'bad'}>{f.food}: {t(verdictName[f.verdict])} · {tn(f.n, '{n} test', '{n} tests')}{f.maxH ? ` · ${t('up to {h} h', { h: num(f.maxH) })}` : ''}</span></li>
      {/each}
    </ul>
  {/if}
</RaceBox>

<RaceBox
  id="prep-rig"
  title={t('Rig comparison')}
  what="Puts the packing of this race next to another trip: weight and volume, front, middle, rear, on you and mounted."
  why="You see where the extra kilos are compared to a trip you know."
  from="The packing lists of both trips and the weights of your things."
>
  {#if others.length}
    <label class="rc-lab">{t('Compare with')}
      <select class="inp" value={other?.id} onchange={(e) => (otherId = e.currentTarget.value)} data-race-rig-other>
        {#each others as o (o.id)}<option value={o.id}>{o.title}{o.startDate ? ` · ${o.startDate.slice(0, 4)}` : ''}</option>{/each}
      </select>
    </label>
    <div class="rc-scroll">
      <table class="rc-table" data-race-rig>
        <thead><tr><th></th><th class="num">{ctx.trip.title}</th><th class="num">{other.title}</th></tr></thead>
        <tbody>
          <tr><td><b>{t('Total')}</b></td><td class="num"><b>{kg(rigA.g)} kg</b></td><td class="num"><b>{kg(rigB.g)} kg</b></td></tr>
          {#each RIG_PARTS as p (p.key)}
            <tr><td>{t(p.name)}</td><td class="num">{kg(rigA.parts[p.key].g)} kg</td><td class="num">{kg(rigB.parts[p.key].g)} kg</td></tr>
          {/each}
          <tr><td>{t('Volume')}</td><td class="num">{num(rigA.l)} l</td><td class="num">{num(rigB.l)} l</td></tr>
          <tr><td>{t('Without weight')}</td><td class="num">{rigA.missing}</td><td class="num">{rigB.missing}</td></tr>
        </tbody>
      </table>
    </div>
    {#if rigA.missing || rigB.missing}<p class="rc-note">{t('Things without a weight count as 0 g: add their weights under Gear.')}</p>{/if}
  {:else}
    <p class="rc-empty">{t('No other trip with a packing list yet.')}</p>
  {/if}
</RaceBox>
