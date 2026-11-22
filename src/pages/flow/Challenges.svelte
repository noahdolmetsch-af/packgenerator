<script>
  /**
   * «Challenges» (Noah 21.11.2026 «4a», Entwurf freigegeben 22.11.2026): #/flow/challenges, in Meilensteine. One page for
   * every challenge with a daily goal:
   *   «Running now»  Draussen (90 minutes outdoors, counts Strava by itself) and your own daily goals, each as a card with
   *                  «Tick off» (the goal of today is reached) and, under «More», smaller or larger amounts;
   *   «New challenge»  name, unit (minutes, a count, steps), goal per day, first and last day;
   *   «Ideas»        a few to take over, only ideas, nothing starts by itself;
   *   «Over»         ended ones with their days reached, to start again or delete (with Undo).
   * The older «do X n times until a day» challenges (src/lib/challenge.js) keep living on Meilensteine.
   */
  import { Plus, Lightbulb } from '@lucide/svelte';
  import PageHead from '../../lib/ui/PageHead.svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import OutdoorCard from '../../lib/home/OutdoorCard.svelte';
  import ZielCard from '../../lib/challenges/ZielCard.svelte';
  import ZielSheet from '../../lib/challenges/ZielSheet.svelte';
  import { zieleQuery, saveOne, stopOne, removeWithUndo } from '../../lib/challenges/zieldb.js';
  import { running, standing, SUGGESTIONS } from '../../lib/tagesziel.js';
  import { localDay } from '../../lib/localday.js';
  import { t, tn } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const q = zieleQuery();
  const list = $derived($q ?? []);
  const now = $derived(running(list, today));
  const over = $derived(list.filter((c) => !now.includes(c)));
  const ideas = $derived(SUGGESTIONS.filter((s) => !list.some((c) => c.name === t(s.name))));

  let open = $state(false);
  let edit = $state(null);
  let preset = $state(null);
  const start = (c = null, p = null) => ((edit = c), (preset = p), (open = true));
  const again = (c) => start(null, { name: c.name, unit: c.unit, word: c.word, goal: c.goal, days: standing(c, today)?.total });
  const reached = (c) => {
    const s = standing(c, today);
    return t('{n} of {total} days reached', { n: s.doneN, total: s.total });
  };
</script>

<div class="ch" data-challenges-page>
  <header class="ph">
    <Crumb path={[{ href: '#/flow/milestones', label: t('Milestones') }]} here={t('Challenges|page')} />
    <PageHead title={t('Challenges|page')} text={t('Goals per day that you set yourself: minutes, a count or steps. Every day that reaches the goal counts. All of it is changeable.')} />
  </header>

  <section class="blk" aria-labelledby="ch-now">
    <h2 id="ch-now" class="sh">{t('Running now')}</h2>
    <OutdoorCard {today} />
    {#each now as c (c.id)}<ZielCard {c} {today} onput={saveOne} onedit={() => start(c)} />{/each}
    {#if !now.length}<p class="quiet" data-challenges-empty>{t('No own challenge is running. Start one below, for example 10 minutes of stretching every day.')}</p>{/if}
  </section>

  <section class="blk" aria-labelledby="ch-new">
    <h2 id="ch-new" class="sh">{t('New challenge')}</h2>
    <div class="cc newc">
      <p>{t('For example stretching for 10 minutes, 8000 steps or 8 glasses of water.')}</p>
      <button type="button" class="btn hi" onclick={() => start()} data-ziel-new><Plus size={16} aria-hidden="true" />{t('New challenge')}</button>
    </div>
  </section>

  {#if ideas.length}
    <section class="blk" aria-labelledby="ch-ideas">
      <h2 id="ch-ideas" class="sh"><Lightbulb size={16} aria-hidden="true" />{t('Ideas')}</h2>
      <p class="quiet">{t('Only ideas. You see the window first and can change everything.')}</p>
      {#each ideas as s (s.name)}
        <div class="cc row" data-ziel-idea>
          <span class="nm">{t(s.name)}</span>
          <button type="button" class="btn sm" onclick={() => start(null, s)}>{t('Take over')}</button>
        </div>
      {/each}
    </section>
  {/if}

  {#if over.length}
    <section class="blk" aria-labelledby="ch-over">
      <h2 id="ch-over" class="sh">{t('Over')}</h2>
      {#each over as c (c.id)}
        <div class="cc row" data-ziel-over={c.id}>
          <span class="nm">{c.name}<small>{reached(c)}</small></span>
          <button type="button" class="btn sm" onclick={() => again(c)}>{t('Start again')}</button>
          <button type="button" class="btn sm" onclick={() => removeWithUndo(c)}>{t('Delete')}</button>
        </div>
      {/each}
    </section>
  {/if}

  <p class="next"><a href="#/flow/milestones">{t('Back to Milestones')}</a></p>
</div>

<ZielSheet bind:open c={edit} {preset} {today} onsave={saveOne} onstop={stopOne} onremove={removeWithUndo} />

<style>
  .ch {
    display: grid;
    gap: 16px;
    max-width: 720px;
  }
  .blk {
    display: grid;
    gap: 10px;
  }
  .sh {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
    color: var(--ink-2);
  }
  .cc {
    padding: 12px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .newc {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
  .newc p {
    flex: 1 1 16rem;
    margin: 0;
    color: var(--ink-2);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .nm {
    flex: 1 1 10rem;
    display: grid;
    font-weight: 650;
  }
  .nm small {
    color: var(--ink-3);
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .quiet {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .next {
    margin: 0;
  }
</style>
