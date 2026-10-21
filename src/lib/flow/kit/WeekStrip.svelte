<script>
  /**
   * v0.105.0 Design-Refresh P8 «Aktiv» (B18 «Wochen-Streifen», A7): Monday to Sunday, a dot per activity
   * done that day in its ring's colour and the first one by name (a ride with its km); today framed, the
   * days still to come dashed. days: home/bausteine.js weekDays(); acts: the activities.
   */
  import { tileName } from '../hobby/words.js';
  import { t, num, locale } from '../../i18n.svelte.js';

  let { days = [], acts = [], today, label = '' } = $props();
  const byId = $derived(new Map(acts.map((a) => [a.id, a])));
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
  const RINGS = [
    { key: 'move', name: 'Move|ring' },
    { key: 'mind', name: 'Mindful|ring' },
    { key: 'rest', name: 'Recovery|ring' },
  ];
  const first = (x) => {
    const a = byId.get(x.acts[0]);
    if (a) return x.acts.length > 1 ? `${tileName(a)} +${x.acts.length - 1}` : tileName(a);
    return x.ride ? `${num(x.km)} km` : '';
  };
</script>

<div class="ws" role="img" aria-label={label}>
  <ol class="days">
    {#each days as x (x.day)}
      <li class:now={x.day === today} class:future={x.future}>
        <b>{wd(x.day)}</b>
        <span class="dots">{#each x.acts.slice(0, 4) as id (id)}<i class={byId.get(id)?.ring ?? 'move'}></i>{/each}{#if x.ride && !x.acts.length}<i class="move"></i>{/if}</span>
        <small>{first(x)}</small>
      </li>
    {/each}
  </ol>
  <p class="lg">{#each RINGS as r (r.key)}<span><i class={r.key}></i>{t(r.name)}</span>{/each}</p>
</div>

<style>
  .days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 4px;
    min-width: 0;
    min-height: 76px;
    padding: 8px 2px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    text-align: center;
  }
  li.now {
    border: 2px solid var(--hi);
  }
  li.future {
    border-style: dashed;
  }
  b {
    font: 600 var(--fs-tiny) / 1.2 var(--font-body);
  }
  .dots {
    display: flex;
    gap: 3px;
    min-height: 10px;
  }
  i {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  i.move {
    background: var(--hi);
  }
  i.mind {
    background: var(--l4);
  }
  i.rest {
    background: var(--l3);
  }
  small {
    max-width: 100%;
    color: var(--ink-3);
    font: 400 var(--fs-tiny) / 1.25 var(--font-body);
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .lg {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 10px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .lg span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  /* a small phone: the names go, the dots stay */
  @media (max-width: 479px) {
    small {
      display: none;
    }
    li {
      min-height: 56px;
    }
  }
</style>
