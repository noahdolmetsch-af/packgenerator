<script>
  /*
   * KI-Helfer (answer 2a): «Frag den Helfer» in the search. Only a question gets an answer: the text ends
   * with «?» (a moment after the last key), or Enter on a text that starts like a question (the search
   * calls `onEnter`). Never on every key; the normal search below stays free and local. The answer sits
   * above the hits. Kept in its own file so Search.svelte only needs a small hook:
   *   <SearchAnswer bind:this={kh} {q} items={$all?.items ?? []} onpropose={() => { q = ''; open = false; }} />
   *   in the keydown handler: `if (e.key === 'Enter' && kh?.onEnter(q)) return e.preventDefault();`
   */
  import { Sparkles, ArrowRight } from '@lucide/svelte';
  import { ask, errorText, helper, isOn, isPaused } from './client.svelte.js';
  import { searchPayload } from './payload.js';
  import { endsAsQuestion, looksLikeQuestion } from './logic.js';
  import { proposeTrip } from './propose.js';
  import { t, isDe, num } from '../i18n.svelte.js';
  import './helper.css';

  let { q = '', items = [], onpropose = () => {} } = $props();
  let hq = $state(''); // the question the answer belongs to
  let hans = $state(null);
  let hbusy = $state(false);
  let hmsg = $state('');
  const hshow = $derived(isOn() && !!hq && q.trim() === hq);
  const itemById = $derived(new Map(items.map((i) => [i.id, i])));

  async function askHelper(question) {
    if (!isOn() || hbusy || (hq === question && (hans || hmsg))) return;
    hq = question;
    hans = null;
    hmsg = '';
    if (isPaused()) return (hmsg = errorText('paused', { capChf: helper.capChf }));
    hbusy = true;
    const r = await ask('search', searchPayload(question, { items, lang: isDe() ? 'de' : 'en' }));
    hbusy = false;
    if (q.trim() !== question) return;
    if (r.ok) hans = r.result;
    else hmsg = errorText(r.error, { capChf: helper.capChf });
  }

  /** Enter in the search field: true when the helper took it (then the search does nothing else). */
  export function onEnter(text) {
    if (!isOn() || !looksLikeQuestion(text)) return false;
    askHelper(text.trim());
    return true;
  }

  let qTimer;
  $effect(() => {
    const s = q.trim();
    clearTimeout(qTimer);
    if (isOn() && endsAsQuestion(s) && s !== hq) qTimer = setTimeout(() => askHelper(s), 900);
    return () => clearTimeout(qTimer);
  });

  function propose() {
    const question = hq;
    onpropose();
    proposeTrip(question);
  }
</script>

{#if hshow}
  <div class="kh">
    <p class="gh">{t('Ask the helper')}</p>
    <div class="kh-ans">
      {#if hbusy}<p role="status">{t('The helper is thinking …')}</p>
      {:else if hmsg}<p role="status">{hmsg}</p>
      {:else if hans}
        <p><span class="kh-ic"><Sparkles size={18} aria-hidden="true" /></span>{#each hans.answer as s, n (n)}{#if s.itemId && itemById.get(s.itemId)}{@const it = itemById.get(s.itemId)}<b>{s.text}</b>{#if it.weightG != null}{` (${num(it.weightG)} g)`}{/if}{:else}{s.text}{/if}{/each}</p>
        <button type="button" class="kh-link" onclick={propose}>{t('Suggest as a packing list')}<ArrowRight size={16} aria-hidden="true" /></button>
      {/if}
    </div>
  </div>
{/if}
