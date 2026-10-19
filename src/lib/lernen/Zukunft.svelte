<script>
  /**
   * Paket M #258 «Nachricht ans zukünftige Ich»: one or two sentences in the debrief for the next trip
   * (d.future = { text, at }). It shows before the next trip until it is put away (ZukunftHinweis.svelte).
   */
  import { t } from '../i18n.svelte.js';
  import { Send } from '@lucide/svelte';

  let { d, persist } = $props();
  function edit(e) {
    const text = e.currentTarget.value;
    d.future = text.trim() ? { text, at: d.future?.at ?? new Date().toISOString() } : null;
    persist();
  }
</script>

<section class="rv-sec zk" aria-labelledby="zk-h" data-zukunft>
  <div class="rv-h"><div><h2 id="zk-h"><Send size={18} aria-hidden="true" /> {t('A message to your future self')}</h2><p class="rv-sub">{t('waits as a letter on the way of your next trip · optional')}</p></div></div>
  <div class="rv-box pad">
    <textarea class="inp" rows="2" value={d.future?.text ?? ''} oninput={edit} placeholder={t('e.g. Take the warm gloves, the mornings were cold')} aria-label={t('A message to your future self')}></textarea>
  </div>
</section>

<style>
  .zk h2 {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .zk textarea {
    width: 100%;
    box-sizing: border-box;
    font: inherit;
  }
</style>
