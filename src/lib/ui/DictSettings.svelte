<script>
  /**
   * «Diktat und Fragen» (Noah 19.10.2026 «1a 2a 3a 4 a oder b beides wählbar 5a», KI «a und b»): the
   * settings of the microphone in Ich › Darstellung › Bedienung, only while «Speak instead of type» is on.
   * Which speech model, when the app answers a question it heard, reading aloud, spoken commands,
   * Gemini in the app and which services «Ask further at» shows. Everything only on this device.
   */
  import { t, lang } from '../i18n.svelte.js';
  import { dict, setDict } from '../dictation.svelte.js';
  import { ENGINES, ANSWERS, COMMANDS, speechApi, voiceApi } from '../speak.js';
  import { SERVICES, SERVICE_KEYS, shownServices } from '../assistent/elsewhere.js';
  import Seg from './Seg.svelte';

  const hasBrowser = !!speechApi();
  const canRead = !!voiceApi();
  const shown = $derived(shownServices(dict.others));
  const engineText = $derived(ENGINES.find((e) => e.key === dict.engine)?.text ?? '');
  const answerText = $derived(ANSWERS.find((a) => a.key === dict.answer)?.text ?? '');
  function toggleService(key, on) {
    const next = SERVICE_KEYS.filter((k) => (k === key ? on : shown.includes(k)));
    setDict('others', next.join(','));
  }
</script>

<section class="ds" aria-labelledby="ds-h" data-dict-settings>
  <h3 id="ds-h">{t('Dictation and questions')}</h3>
  <p class="note">{t('Dictation runs until you tap stop. A question in a note gets the app\'s answer from your data.')}</p>

  <p class="ds-l" id="ds-engine">{t('Speech model')}</p>
  <Seg labelledby="ds-engine" value={dict.engine} options={ENGINES.map((e) => ({ key: e.key, name: t(e.name) }))} onchange={(k) => setDict('engine', k)} />
  <p class="note">{t(engineText)}{#if dict.engine === 'browser' && !hasBrowser} {t('This browser has no speech recognition of its own: choose «On this device».')}{/if}</p>

  <p class="ds-l" id="ds-answer">{t('The app answers a question in a note')}</p>
  <Seg labelledby="ds-answer" value={dict.answer} options={ANSWERS.map((a) => ({ key: a.key, name: t(a.name) }))} onchange={(k) => setDict('answer', k)} />
  <p class="note">{t(answerText)}</p>

  <ul class="ds-sw">
    {#if canRead}
      <li><label><span><b>{t('Read answers aloud at once')}</b><small>{t('With the browser\'s own voice, free. While it reads, dictation pauses.')}</small></span><input type="checkbox" role="switch" checked={dict.read} onchange={(e) => setDict('read', e.currentTarget.checked)} data-dict="read" /></label></li>
    {/if}
    <li>
      <label><span><b>{t('Spoken commands')}</b><small>{COMMANDS.map((c) => `«${lang.v === 'de' ? c.say[0] : c.say[1]}» ${c.put === '\n' ? '↵' : c.put === '\n\n' ? '¶' : c.put}`).join(' · ')}</small></span><input type="checkbox" role="switch" checked={dict.commands} onchange={(e) => setDict('commands', e.currentTarget.checked)} data-dict="commands" /></label>
    </li>
    <li><label><span><b>{t('Gemini in the app')}</b><small>{t('A free AI from Google answers inside the app. Needs the helper code (Me › AI helper); Google may use the questions to learn.')}</small></span><input type="checkbox" role="switch" checked={dict.gemini} onchange={(e) => setDict('gemini', e.currentTarget.checked)} data-dict="gemini" /></label></li>
  </ul>

  <p class="ds-l">{t('Ask further at')}</p>
  <p class="note">{t('One tap opens the service with your question; the answer comes there. Free with your normal account.')}</p>
  <ul class="sv">
    {#each SERVICES as s (s.key)}
      <li><label><input type="checkbox" checked={shown.includes(s.key)} onchange={(e) => toggleService(s.key, e.currentTarget.checked)} data-dict-service={s.key} /><span><b>{s.key === 'google' ? t(s.name) : s.name}</b> <small>{t(s.what)}</small></span></label></li>
    {/each}
  </ul>
  <p class="note"><a href="#/me/ki-projekte">{t('My AI projects')}</a> · {t('your own links to projects and chats')}</p>
</section>

<style>
  .ds {
    display: grid;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  h3 {
    margin: 0;
    font-size: var(--fs-body);
  }
  .ds-l {
    margin: 8px 0 0;
    font-weight: 600;
  }
  .note {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .ds-sw,
  .sv {
    display: grid;
    gap: 8px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  .ds-sw label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .ds-sw span,
  .sv span {
    display: grid;
    gap: 2px;
  }
  .sv span {
    display: inline;
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sv label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
  }
  input[type='checkbox'] {
    width: 20px;
    height: 20px;
    flex: none;
  }
</style>
