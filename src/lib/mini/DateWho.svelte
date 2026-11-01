<script>
  /**
   * Mini-Tools «Find a date», result page (Noah 1.11.2026 «1a»): who answered and who is still missing.
   * The maker types the names of the people asked; a name is «answered» when an answer has the same name.
   * invited: [name]; answers: [{ name, picks }]; onchange(list): the new list; link, title: for the reminder.
   */
  import { t } from '../i18n.svelte.js';
  import { Plus, X, MessageCircle } from '@lucide/svelte';
  import { whoAnswered, cleanInvited, cleanName, reminderText } from './termin.js';
  import { offerDone } from '../ui/rename.svelte.js';

  let { invited = [], answers = [], onchange, link = '', title = '', open = true } = $props();
  const who = $derived(whoAnswered(invited, answers));
  const total = $derived(who.answered.length + who.missing.length);
  let draft = $state('');

  function add(e) {
    e?.preventDefault?.();
    const next = cleanInvited([...invited, ...draft.split(/[,\n]/)]);
    draft = '';
    if (next.length !== invited.length) onchange(next);
  }
  function drop(name) {
    const before = invited;
    onchange(invited.filter((n) => n !== name));
    offerDone(t('«{name}» removed from the list.', { name }), () => onchange(before));
  }
  const waLink = $derived(`https://wa.me/?text=${encodeURIComponent(reminderText(title, who.missing, link, t))}`);
</script>

<section class="card dw-box" aria-labelledby="dw-h" data-dw>
  <h2 id="dw-h">{total ? t('{n} of {m} have answered', { n: who.answered.length, m: total }) : t('Who did you ask?')}</h2>
  {#if total}
    <div class="dw-prog" aria-hidden="true"><b style={`width:${Math.round((who.answered.length / total) * 100)}%`}></b></div>
  {:else}
    <p class="dw-help">{t('Type the names of the people you asked. Then you see here who has answered and who is still missing.')}</p>
  {/if}
  {#if total || who.others.length}
    <ul class="dw-chips" data-dw-list>
      {#each who.answered as n (n)}<li class="y" data-dw-name={n} data-dw-state="yes"><span>{n}</span> <small>{t('has answered')}</small><button type="button" class="dw-x" aria-label={t('Remove {name}', { name: n })} onclick={() => drop(n)}><X size={14} aria-hidden="true" /></button></li>{/each}
      {#each who.missing as n (n)}<li class="w" data-dw-name={n} data-dw-state="missing"><span>{n}</span> <small>{t('still missing')}</small><button type="button" class="dw-x" aria-label={t('Remove {name}', { name: n })} onclick={() => drop(n)}><X size={14} aria-hidden="true" /></button></li>{/each}
      {#each who.others as n (n)}<li class="o" data-dw-name={n} data-dw-state="other"><span>{n}</span> <small>{t('not on your list')}</small></li>{/each}
    </ul>
  {/if}
  <form class="dw-add" onsubmit={add}>
    <input type="text" bind:value={draft} maxlength="120" placeholder={t('A name, or several with commas')} aria-label={t('Add a person')} data-dw-input />
    <button type="submit" class="btn sm" data-dw-add><Plus size={16} aria-hidden="true" />{t('Add')}</button>
  </form>
  {#if open && who.missing.length}
    <div><a class="btn" href={waLink} target="_blank" rel="noopener" data-dw-remind><MessageCircle size={16} aria-hidden="true" />{t('Remind {names}', { names: who.missing.join(', ') })}</a></div>
  {/if}
  {#if who.others.length}<p class="dw-help">{t('Names you did not list still count in the table below.')}</p>{/if}
</section>

<style>
  .dw-box { display: grid; gap: var(--sp-2); min-width: 0; }
  .dw-box h2 { margin: 0; font-size: var(--fs-sub); text-wrap: balance; }
  .dw-help { margin: 0; color: var(--ink-3); font-size: var(--fs-small); }
  .dw-prog { height: 10px; border-radius: 5px; background: var(--paper-2); overflow: hidden; }
  .dw-prog b { display: block; height: 100%; background: var(--accent); }
  .dw-chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .dw-chips li { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); border-radius: 999px; padding: 2px 4px 2px 10px; min-width: 0; overflow-wrap: break-word; }
  .dw-chips li.y { background: var(--paper-2); }
  .dw-chips li.w { border-style: dashed; }
  .dw-chips small { color: var(--ink-3); }
  .dw-x { display: inline-grid; place-items: center; min-width: 32px; min-height: 32px; border: 0; background: none; color: var(--ink-3); border-radius: 50%; cursor: pointer; }
  .dw-add { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
  .dw-add input { flex: 1 1 12rem; min-width: 0; }
</style>
