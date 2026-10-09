<script>
  /**
   * v0.25.1 (Noah 2b): "Was geil wäre", the bike's own list of ideas (not the Gear wishlist).
   * Stored on the bike record as bike.ideas = [{ id, text, at, done }]. Add one here or from
   * Today's Bikes tile ("Idea"); tick it done; delete it after a confirm().
   */
  import { tick } from 'svelte';
  import { db } from '../db.js';
  import { Sparkles } from '@lucide/svelte';
  import SetupFold from './SetupFold.svelte';
  import { addIdea, toggleIdea, removeIdea, sortIdeas, openIdeas, IDEAS_KEY } from '../hubs.js';
  import { t, tn, locale } from '../i18n.svelte.js';

  let { bike } = $props();

  const list = $derived(sortIdeas(bike.ideas));
  const open = $derived(openIdeas(bike.ideas));
  // Reached from Today ("Idea saved → Open", "Ideas: …"): open and show the section once.
  let shown = $state(false);
  let el = $state();
  try {
    if (localStorage.getItem(IDEAS_KEY)) {
      localStorage.removeItem(IDEAS_KEY);
      shown = true;
      tick().then(() => el?.scrollIntoView({ block: 'center' }));
    }
  } catch {
    /* private mode: the section stays closed */
  }
  let text = $state('');
  const write = (fn) => db.transaction('rw', db.bikes, async () => {
    const b = await db.bikes.get(bike.id);
    if (b) await db.bikes.update(bike.id, { ideas: fn(b.ideas ?? []) });
  });
  async function add(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const clean = text;
    text = '';
    await write((ideas) => addIdea(ideas, clean, { id: `idea-${Date.now().toString(36)}` }));
  }
  const toggle = (x) => write((ideas) => toggleIdea(ideas, x.id));
  function remove(x) {
    if (!confirm(t('Delete the idea "{text}"?', { text: x.text.slice(0, 60) }))) return;
    write((ideas) => removeIdea(ideas, x.id));
  }
  const day = (iso) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
</script>

<div class="ideas-wrap" bind:this={el}>
  <SetupFold icon={Sparkles} label={t('Ideas|bike')} summary={list.length ? `${tn(open, '{n} open idea', '{n} open ideas')}${list.length > open ? ` · ${t('{n} done', { n: list.length - open })}` : ''}` : t('none yet')} bind:open={shown}>
    <p class="hint">{t('What would be great: your own list of ideas for this bike, not the Gear wishlist.')}</p>
    {#if list.length}
      <ul class="ideas" aria-label={t('Ideas for the {bike}', { bike: bike.name })}>
        {#each list as x (x.id)}
          <li class:done={x.done}>
            <label class="tick">
              <input type="checkbox" checked={!!x.done} onchange={() => toggle(x)} />
              <span><span class="txt">{x.text}</span><small>{day(x.at)}{x.done ? ` · ${t('done|idea')}` : ''}</small></span>
            </label>
            <button type="button" class="link" aria-label={t('Delete the idea "{text}"', { text: x.text.slice(0, 60) })} onclick={() => remove(x)}>{t('Delete')}</button>
          </li>
        {/each}
      </ul>
    {/if}
    <form class="add" onsubmit={add}>
      <input class="inp" type="text" bind:value={text} placeholder={t('e.g. Dropper post, lighter wheels')} aria-label={t('New idea for the {bike}', { bike: bike.name })} />
      <button type="submit" class="btn sm" disabled={!text.trim()}>{t('Add idea')}</button>
    </form>
  </SetupFold>
</div>

<style>
  .hint {
    margin: 0 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ideas {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
  }
  .ideas li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    min-height: 44px;
    border-bottom: 1px solid var(--line);
  }
  .tick {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  .tick input {
    width: 22px;
    height: 22px;
    flex: none;
    accent-color: var(--ink);
  }
  .tick > span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .txt {
    overflow-wrap: break-word;
  }
  .done .txt {
    text-decoration: line-through;
    color: var(--ink-3);
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }
  .add .inp {
    flex: 1 1 200px;
    min-width: 0;
  }
  .link {
    flex: none;
    min-height: 44px;
    border: 0;
    background: none;
    padding: 0 4px;
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
</style>
