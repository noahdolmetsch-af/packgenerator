<script>
  /**
   * Templates (Noah, 4.10.2026, answer 9): all saved packing setups on their own page.
   * Rename, see what is in them, start a new trip from one, or delete one.
   * What is inside a template changes from a trip: open a trip made from it and press
   * "Save as template" → "Update" (answer 7a).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { TEMPLATES_KEY, saveTemplates } from '../lib/templates.js';
  import { NIGHT_SETS } from '../lib/trips.js';
  import { RIDES } from '../lib/layers.js';
  import TemplateEdit from './TemplateEdit.svelte';

  // #/pack/templates/<id> opens the editor for one template (answer 7b).
  let hash = $state(location.hash);
  $effect(() => {
    const update = () => (hash = location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  const editId = $derived(decodeURIComponent(hash.split('/')[3] ?? ''));

  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const bagsQ = liveQuery(() => db.containers.toArray());
  const templates = $derived([...($tplQ?.value ?? [])].sort((a, b) => a.name.localeCompare(b.name)));
  const bagName = $derived(Object.fromEntries(($bagsQ ?? []).map((b) => [b.id, b.name])));

  let error = $state('');
  async function rename(t, value) {
    const clean = value.trim();
    error = '';
    if (!clean || clean === t.name) return;
    if (templates.some((x) => x.id !== t.id && x.name.toLowerCase() === clean.toLowerCase())) return (error = `There is already a template "${clean}".`);
    await saveTemplates(db, templates.map((x) => (x.id === t.id ? { ...x, name: clean } : x)));
  }
  async function remove(t) {
    if (!confirm(`Delete the template "${t.name}"? Trips made from it stay. A backup file can bring it back.`)) return;
    await saveTemplates(db, templates.filter((x) => x.id !== t.id));
  }
  function start(t) {
    try {
      localStorage.setItem('pack.startFrom', t.id);
    } catch {
      /* private mode: the trip dialog opens without the template chosen */
    }
    location.hash = '#/pack';
  }
  const bags = (t) => Object.values(t.setup ?? {}).filter(Boolean).map((id) => bagName[id] ?? id);
  const nights = (t) => NIGHT_SETS.filter((n) => t.sets?.[n.key]).map((n) => n.name);
</script>

{#if editId}
  <TemplateEdit id={editId} />
{:else}
<div class="tpls">
  <p class="back"><a href="#/pack">← Pack</a></p>
  <h1 class="title big">Templates</h1>
  <p class="hint">A template is a packing setup you can start new trips from. Save one on the Pack page with "Save as template". Change what is inside with "Edit", or from a trip made from it with "Save as template" → "Update".</p>
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  <ul class="list">
    {#each templates as t (t.id)}
      <li class="card">
        <label class="nm"><span class="lbl">Name</span><input class="inp" value={t.name} onchange={(e) => rename(t, e.currentTarget.value)} /></label>
        <p class="facts">
          {t.entries.length} items · {t.ready.length} checks
          {#if t.ride}{' · '}{RIDES.find((r) => r.key === t.ride)?.name}{/if}{#if t.hours}{' · '}{t.hours} h{/if}
          {#if nights(t).length}{' · '}Night: {nights(t).join(', ')}{/if}
        </p>
        {#if bags(t).length}<p class="facts">Bags: {bags(t).join(', ')}</p>{/if}
        <p class="facts muted">Saved {t.updatedAt?.slice(0, 10)}</p>
        <div class="acts">
          <button type="button" class="btn hi" onclick={() => start(t)}>New trip from it</button>
          <a class="btn" href="#/pack/templates/{encodeURIComponent(t.id)}">Edit</a>
          <button type="button" class="btn del" onclick={() => remove(t)}>Delete</button>
        </div>
      </li>
    {:else}
      <li class="card">No templates yet. Open a trip on the <a href="#/pack">Pack</a> page and press "Save as template".</li>
    {/each}
  </ul>
</div>
{/if}

<style>
  .big {
    font-size: clamp(48px, 10vw, 88px);
    line-height: 0.9;
  }
  .back {
    margin: 0 0 6px;
  }
  .hint {
    color: var(--ink-3);
    max-width: 60ch;
  }
  .err {
    color: #b42318;
  }
  .list {
    list-style: none;
    margin: 16px 0 0;
    padding: 0;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  }
  .nm {
    display: grid;
    gap: 4px;
  }
  .facts {
    margin: 8px 0 0;
    font-size: 14px;
  }
  .muted {
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }
  .del {
    margin-left: auto;
    border-color: #b42318;
    color: #b42318;
  }
</style>
