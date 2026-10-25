<script>
  /**
   * Paket C › Können statt nur Besitz (#/me/ruhig/koennen; 996 Ideen UC-210-I3, UC-138-I2):
   * «Fähigkeitskarte» and «Fehlte Wissen statt Material?». Logic: koennen.js. A «to learn» card can
   * also become a to-do in Merken (addTodo, with Undo).
   */
  import { liveQuery } from 'dexie';
  import { Award, Lightbulb, Plus, Trash2, Pencil, ListTodo } from '@lucide/svelte';
  import Card from './Card.svelte';
  import { db } from '../db.js';
  import { addTodo } from '../merkendb.js';
  import { t, tn } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { SPORTS } from '../sportlist.js';
  import { settingQ, saveSetting } from './store.js';
  import { openFromHash } from './open.js';
  import { dmy, realTrips, tripEnd, addDays } from './base.js';
  import { SKILLS_KEY, LEVELS, MISSING, skillsOf, newSkill, changeSkill, setLevel, addExample, dropExample, skillMap, learnedFrom } from './koennen.js';

  const today = localDay();
  const first = openFromHash();
  let open = $state({ map: first === 'map' || !first, knowhow: first === 'knowhow' });
  const q = settingQ(SKILLS_KEY);
  const tripsQ = liveQuery(() => db.trips.toArray());
  const skills = $derived(skillsOf($q));
  const save = (list) => saveSetting(SKILLS_KEY, list);
  const sports = SPORTS.map((s) => ({ key: s.key, name: t(s.name) }));
  const map = $derived(skillMap(skills, sports));
  const LV = Object.fromEntries(LEVELS.map((l) => [l.key, l.label]));

  let nName = $state('');
  let nSport = $state('');
  function add(e) {
    e.preventDefault();
    const s = newSkill({ name: nName, sport: nSport, level: 'tried' });
    if (!s) return;
    save([...skills, s]);
    nName = '';
  }
  let ex = $state({});
  let editing = $state('');
  let en = $state('');
  async function remove(s) {
    const ok = await askDelete({ title: t('Delete «{name}»?', { name: s.name }), text: t('The skill and its examples go.') });
    if (ok !== 'delete') return;
    const before = skills;
    await deleteWithUndo({ run: () => save(skills.filter((x) => x.id !== s.id)).then(() => before), undo: (x) => save(x), text: t('«{name}» deleted.', { name: s.name }), name: s.name });
  }

  /* Fehlte Wissen statt Material? */
  const ended = $derived(realTrips($tripsQ ?? []).filter((x) => tripEnd(x) < today).sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 10));
  let kTrip = $state('');
  $effect(() => {
    if (!kTrip && ended.length) kTrip = ended[0].id;
  });
  let kMiss = $state('skill');
  let kText = $state('');
  function learn(e) {
    e.preventDefault();
    const trip = ended.find((x) => x.id === kTrip);
    const sport = SPORTS.some((s) => s.key === trip?.sport) ? trip.sport : '';
    const s = newSkill({ name: kText, sport, level: 'learn', tripId: kTrip, missing: kMiss });
    if (!s) return;
    save([...skills, s]);
    kText = '';
    offerDone(t('«{name}» is on your skill map, to learn.', { name: s.name }));
  }
  async function todo(s) {
    const res = await addTodo(db, { text: t('Learn: {name}', { name: s.name }), due: addDays(today, 7), src: `skill:${s.id}` });
    if (res) offerDone(t('In Merken, due {day}.', { day: dmy(res.todo.due) }), () => res.undo());
  }
  const tripName = (id) => ($tripsQ ?? []).find((x) => x.id === id)?.title ?? '';
</script>

<ul class="rh-cards">
  <Card id="map" icon={Award} title={t('Skill map')} lead={t('What you can do, next to the numbers: skills per sport with examples')} bind:open={open.map}>
    <p class="rh-help">{t('You set the level yourself: to learn, tried, sure, understood. An example with a day shows how you got there.')}</p>
    {#if map.length}
      <div class="rh-map" data-skill-map>
        {#each map as col (col.key)}
          <section class="rh-col">
            <h3 class="rh-sub">{col.name}</h3>
            <p class="rh-help">{LEVELS.filter((l) => col.n[l.key]).map((l) => `${col.n[l.key]} ${t(l.label)}`).join(' · ')}</p>
            <ul class="rh-list">
              {#each col.rows as s (s.id)}
                <li class="rh-skill" data-skill={s.id}>
                  <span class="rh-grow">
                    {#if editing === s.id}
                      <form class="rh-row" onsubmit={(e) => (e.preventDefault(), en.trim() && save(changeSkill(skills, s.id, (x) => ({ ...x, name: en.trim() }))), (editing = ''))}><input class="inp" bind:value={en} aria-label={t('Name')} /><button class="btn sm" type="submit">{t('Save')}</button></form>
                    {:else}<b>{s.name}</b>{/if}
                    {#if s.tripId}<small>{t('missing on {trip}', { trip: tripName(s.tripId) || t('a trip') })}</small>{/if}
                    <span class="rh-chips">{#each LEVELS as l (l.key)}<button type="button" class="rh-chip sm" aria-pressed={s.level === l.key} onclick={() => save(changeSkill(skills, s.id, (x) => setLevel(x, l.key)))}>{t(l.label)}</button>{/each}</span>
                    {#each s.examples as e, i (i)}<small class="rh-ex">{dmy(e.day)} · {e.text} <button type="button" class="btn-link btn sm" aria-label={t('Delete')} onclick={() => save(changeSkill(skills, s.id, (x) => dropExample(x, i)))}>×</button></small>{/each}
                    <form class="rh-row" onsubmit={(e) => (e.preventDefault(), save(changeSkill(skills, s.id, (x) => addExample(x, today, ex[s.id]))), (ex[s.id] = ''))}>
                      <input class="inp" bind:value={ex[s.id]} placeholder={t('An example, e.g. first time on the road')} aria-label={t('An example for {name}', { name: s.name })} />
                      <button class="btn sm" type="submit" disabled={!(ex[s.id] ?? '').trim()}>{t('Add')}</button>
                    </form>
                    {#if s.level === 'learn'}<button type="button" class="btn sm btn-link" onclick={() => todo(s)}><ListTodo size={14} aria-hidden="true" />{t('Keep as to-do')}</button>{/if}
                  </span>
                  <button type="button" class="rh-x" aria-label={t('Rename')} onclick={() => ((editing = s.id), (en = s.name))}><Pencil size={16} /></button>
                  <button type="button" class="rh-x" aria-label={t('Delete')} onclick={() => remove(s)}><Trash2 size={16} /></button>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>
    {:else}<p class="rh-empty">{t('No skill yet. Start with one you are proud of.')}</p>{/if}
    <form class="rh-row" onsubmit={add}>
      <input class="inp" bind:value={nName} placeholder={t('A skill, e.g. change a tube in 10 minutes')} aria-label={t('New skill')} data-skill-new />
      <select class="inp" bind:value={nSport} aria-label={t('Sport')}><option value="">{t('Everyday|skills')}</option>{#each sports as s (s.key)}<option value={s.key}>{s.name}</option>{/each}</select>
      <button type="submit" class="btn hi" disabled={!nName.trim()}><Plus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </Card>

  <Card id="knowhow" icon={Lightbulb} title={t('Was it know-how, not gear?')} lead={t('After a trip: when a guide, the planning or a skill was missing, learn it instead of buying')} bind:open={open.knowhow}>
    {#if ended.length}
      <form class="rh-new" onsubmit={learn}>
        <label class="rh-field"><span>{t('Trip')}</span><select class="inp" bind:value={kTrip}>{#each ended as x (x.id)}<option value={x.id}>{x.title} · {dmy(x.startDate)}</option>{/each}</select></label>
        <div class="rh-chips" aria-label={t('What was missing?')}>{#each MISSING as mm (mm.key)}<button type="button" class="rh-chip" aria-pressed={kMiss === mm.key} onclick={() => (kMiss = mm.key)}>{t(mm.label)}</button>{/each}</div>
        <p class="rh-help">{t(MISSING.find((x) => x.key === kMiss).hint)}</p>
        <input class="inp" bind:value={kText} placeholder={t('What to learn, e.g. light the stove in the wind')} aria-label={t('What to learn')} data-knowhow-text />
        <button type="submit" class="btn hi" disabled={!kText.trim()}><Lightbulb size={16} aria-hidden="true" />{t('Put on the skill map')}</button>
      </form>
      {#if learnedFrom(skills, kTrip).length}
        <ul class="rh-list">{#each learnedFrom(skills, kTrip) as s (s.id)}<li><span class="rh-grow">{s.name}<small>{t(LV[s.level])}</small></span></li>{/each}</ul>
      {/if}
    {:else}<p class="rh-empty">{t('After your first trip you can note here what knowledge was missing.')}</p>{/if}
  </Card>
</ul>

<style>
  .rh-new {
    display: grid;
    gap: var(--sp-2);
  }
  .rh-map {
    display: grid;
    gap: var(--sp-3);
  }
  @media (min-width: 720px) {
    .rh-map {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .rh-col {
    display: grid;
    gap: 6px;
    align-content: start;
  }
  .rh-col .rh-sub {
    margin: 0;
  }
  .rh-skill {
    align-items: flex-start !important;
  }
  .rh-skill .rh-grow {
    display: grid;
    gap: 6px;
  }
  .rh-chip.sm {
    min-height: 32px;
    padding: 2px 10px;
  }
  .rh-ex {
    color: var(--ink) !important;
  }
</style>
