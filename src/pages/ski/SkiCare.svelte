<script>
  /**
   * v0.97.0 «Skitouren», mockup D «Saison-Pflege»: three phase cards (season start in November, during
   * the season by metres climbed, season end in May), a tick per task and «fällig» / «bald». A tick
   * is «Erledigt»: an entry with the day and the season's metres climbed so far, like bike care
   * (settings 'ski.care'); a short line offers «Rückgängig». Wax is due every 5,000 m climbed
   * («noch N Hm»). The list is yours: «+ eigene Aufgabe» per phase, your own ones can go again.
   */
  import { ChevronLeft, Check, Plus, X } from '@lucide/svelte';
  import { skiQuery, careDone, careDrop, careRestore, saveCareTasks } from '../../lib/ski/skidb.js';
  import { careTasks, careState, seasonHm, seasonId, CARE_PHASES } from '../../lib/ski.js';
  import { localDay } from '../../lib/localday.js';
  import { t, num, dateOf } from '../../lib/i18n.svelte.js';

  const today = localDay();
  const q = skiQuery();
  const data = $derived($q);
  const tasks = $derived(careTasks(data?.tasks));
  const hm = $derived(seasonHm(data?.trips ?? [], seasonId(today), today));
  const stateOf = (x) => careState(x, data?.care ?? [], today, hm);
  const phases = $derived(CARE_PHASES.map((p) => {
    const list = tasks.filter((x) => x.phase === p.key).map((x) => ({ x, s: stateOf(x) }));
    return { ...p, list, done: list.filter((r) => r.s.state === 'ok').length };
  }));
  const taskName = (x) => (x.own ? x.task : t(x.task));

  /* the line after a tick, with Undo (like bike care) */
  let notice = $state(null);
  let timer;
  function say(text, undo) {
    clearTimeout(timer);
    notice = { id: Date.now(), text, undo };
    timer = setTimeout(() => (notice = null), 8000);
  }
  async function tick(r) {
    if (r.s.done && r.s.state === 'ok') {
      const gone = await careDrop([r.s.done.id]);
      say(t('«{task}» not done', { task: taskName(r.x) }), () => careRestore(gone));
    } else {
      const entry = await careDone(r.x, today, hm);
      say(t('Done: «{task}» · {hm} m climbed', { task: taskName(r.x), hm: num(hm) }), () => careDrop([entry.id]));
    }
  }
  async function undo() {
    const u = notice?.undo;
    notice = null;
    clearTimeout(timer);
    if (u) await u();
  }

  /* your own tasks */
  let adding = $state(null); // the phase a new task goes to
  let text = $state('');
  const custom = $derived({ own: data?.tasks?.own ?? [], hidden: data?.tasks?.hidden ?? [] });
  async function addTask(phase) {
    const task = text.trim();
    if (!task) return (adding = null);
    await saveCareTasks({ ...custom, own: [...custom.own, { id: `own-${Date.now().toString(36)}`, phase, task }] });
    text = '';
    adding = null;
  }
  const dropTask = (x) => saveCareTasks({ ...custom, own: custom.own.filter((y) => y.id !== x.id) });
  const hint = (r) => {
    if (r.x.id === 'wax') return `${t(r.x.hint)} · ${t('{n} m to go', { n: num(r.s.left) })}`;
    return r.x.hint ? t(r.x.hint) : '';
  };
</script>

<div class="sk">
  <p class="sk-back"><a href="#/ski"><ChevronLeft size={16} aria-hidden="true" />{t('Ski tours')}</a></p>
  <div>
    <h1 class="sk-h1" tabindex="-1" data-page-title>{t('Season care')}</h1>
    <p class="sk-sub">{t('Like the bikes: done = an entry with the day and the metres climbed')} · <span class="num">{t('Season {id}', { id: seasonId(today) })} · {num(hm)} {t('m climbed|short')}</span></p>
  </div>
  {#if data}
    <div class="sk-cols three">
      {#each phases as p (p.key)}
        <div>
          <section class="surf sk-pad ph" aria-labelledby="ph-{p.key}" data-phase={p.key}>
            <div class="sk-gh"><h2 id="ph-{p.key}">{t(p.name)}</h2><span class="num">{t(p.sub)}{#if p.key !== 'during'}{" · "}{t('{n} of {m}', { n: p.done, m: p.list.length })}{/if}</span></div>
            <ul class="sk-list">
              {#each p.list as r (r.x.id)}
                <li class="tr" data-task={r.x.id}>
                  <button type="button" class="sk-tick" role="checkbox" aria-checked={r.s.state === 'ok'} onclick={() => tick(r)}>
                    <span class="sk-box" aria-hidden="true">{#if r.s.state === 'ok'}<Check size={18} strokeWidth={3} />{/if}</span>
                    <span class="sk-tt">
                      <b>{taskName(r.x)}</b>
                      {#if hint(r)}<small>{hint(r)}</small>{/if}
                      {#if r.s.done}<small class="num">{t('done {date} · {hm} m climbed', { date: dateOf(r.s.done.day), hm: num(r.s.done.hm) })}</small>{/if}
                    </span>
                    {#if r.s.state === 'due'}<span class="pill warn">{t('due|care')}</span>{:else if r.s.state === 'soon'}<span class="pill ok">{t('soon|care')}</span>{/if}
                  </button>
                  {#if r.x.own}<button type="button" class="ix" aria-label={t('Remove «{task}»', { task: r.x.task })} onclick={() => dropTask(r.x)}><X size={16} aria-hidden="true" /></button>{/if}
                </li>
              {/each}
            </ul>
            {#if adding === p.key}
              <form class="add" onsubmit={(e) => (e.preventDefault(), addTask(p.key))}>
                <!-- svelte-ignore a11y_autofocus -->
                <input class="inp" bind:value={text} placeholder={t('e.g. {x}', { x: t('Check the poles') })} aria-label={t('Own task')} autofocus />
                <button type="submit" class="btn">{t('Add')}</button>
              </form>
            {:else}
              <button type="button" class="btn addb" onclick={() => ((adding = p.key), (text = ''))}><Plus size={16} aria-hidden="true" />{t('Own task')}</button>
            {/if}
          </section>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if notice}
  {#key notice.id}<p class="sk-notice" role="status"><span>{notice.text}</span>{#if notice.undo}<button type="button" onclick={undo}>{t('Undo')}</button>{/if}</p>{/key}
{/if}

<style>
  .ph {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tr {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .tr .sk-tick {
    flex: 1;
    min-width: 0;
  }
  .ix {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .add {
    display: flex;
    gap: 8px;
    margin-top: 6px;
  }
  .add .btn {
    flex: none;
    min-height: 44px;
  }
  .addb {
    align-self: flex-start;
    margin-top: 6px;
    min-height: 44px;
    border-style: dashed;
    color: var(--ink-2);
  }
</style>
