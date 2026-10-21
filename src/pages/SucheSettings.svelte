<script>
  /**
   * «Suche mit Sprache und Antworten» (Noah 21.10.2026 «5b»): Ich › Suche (#/me/suche). What the top
   * search does with the microphone and which ones answer there: the app from your data, Gemini (free),
   * «Ask further at» (Claude, ChatGPT … in a new tab), Chrome's AI, the AI on this device. Every source
   * can be switched off; everything is kept only on this device. The speech model is the one of the
   * dictation (Ich › Darstellung › Bedienung), shown here too.
   */
  import { t } from '../lib/i18n.svelte.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { suche, setSuche } from '../lib/suche/suche.svelte.js';
  import { READ_MODES } from '../lib/suche/logic.js';
  import { dict, setDict } from '../lib/dictation.svelte.js';
  import { ENGINES, speechApi, voiceApi } from '../lib/speak.js';
  import { SERVICES, SERVICE_KEYS, shownServices } from '../lib/assistent/elsewhere.js';
  import { helper, isOn } from '../lib/helper/client.svelte.js';
  import { aiStatus } from '../lib/kisuche/chromeAi.js';

  const hasBrowser = !!speechApi();
  const canRead = !!voiceApi();
  const shown = $derived(shownServices(dict.others));
  const readText = $derived(READ_MODES.find((m) => m.key === suche.read)?.text ?? '');
  const engineText = $derived(ENGINES.find((e) => e.key === dict.engine)?.text ?? '');
  let chromeAi = $state('none');
  aiStatus().then((s) => (chromeAi = s));
  function toggleService(key, on) {
    setDict('others', SERVICE_KEYS.filter((k) => (k === key ? on : shown.includes(k))).join(','));
  }
  const SOURCES = [
    { key: 'app', name: 'The app, from your data', text: 'Free, on this device. Answers questions like «How many km this week?» or «When is the next service?».' },
    { key: 'gemini', name: 'Gemini (free)', text: 'A free AI from Google answers right in the search when the app knows nothing. Needs the helper code (Me › AI helper); Google may use the questions to learn.' },
    { key: 'geminiAuto', name: 'Gemini answers a spoken question by itself', text: 'Only when the app has no answer. Typed questions get a button «Ask Gemini here».', sub: true },
    { key: 'links', name: 'Ask further at …', text: 'Buttons that open Claude, ChatGPT and others in a new tab with your question. Free with your normal account.' },
    { key: 'chrome', name: 'Chrome AI', text: 'The AI built into Chrome on a computer answers on the device. Only where Chrome offers it.' },
    { key: 'local', name: 'AI on this device', text: 'The AI you loaded onto this device answers without internet.' },
  ];
</script>

<div class="su ich-page" data-suche-settings>
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('Search|page')} sub={t('Speak into the search and get answers right there')} />

  <section class="card su-card" aria-labelledby="su-mic">
    <h2 id="su-mic">{t('Speaking')}</h2>
    <p class="note">{t('Tap the microphone in the search and say what you want: «chain lubed Gravel», «note brake squeaks», «How many km this week?». The search writes it into the field and answers.')}</p>
    <ul class="su-sw">
      <li><label><span><b>{t('Microphone in the search')}</b><small>{hasBrowser ? t('Always next to the magnifier.') : t('This browser cannot listen by itself: choose «On this device» below.')}</small></span><input type="checkbox" role="switch" checked={suche.mic} onchange={(e) => setSuche('mic', e.currentTarget.checked)} data-suche="mic" /></label></li>
      <li><label><span><b>{t('Run spoken commands at once')}</b><small>{t('When exactly one command fits, it runs right away; «Undo» takes it back. A spoken note goes straight into the Inbox.')}</small></span><input type="checkbox" role="switch" checked={suche.run} onchange={(e) => setSuche('run', e.currentTarget.checked)} data-suche="run" /></label></li>
    </ul>
    {#if canRead}
      <p class="su-l" id="su-read">{t('Read answers aloud')}</p>
      <Seg labelledby="su-read" value={suche.read} options={READ_MODES.map((m) => ({ key: m.key, name: t(m.name) }))} onchange={(k) => setSuche('read', k)} />
      <p class="note">{t(readText)}</p>
    {/if}
    <p class="su-l" id="su-engine">{t('Speech model')}</p>
    <Seg labelledby="su-engine" value={dict.engine} options={ENGINES.map((e) => ({ key: e.key, name: t(e.name) }))} onchange={(k) => setDict('engine', k)} />
    <p class="note">{t(engineText)} {t('The same as for dictation in notes.')}</p>
  </section>

  <section class="card su-card" aria-labelledby="su-src">
    <h2 id="su-src">{t('Who answers in the search')}</h2>
    <p class="note">{t('Switch off what you do not want. The order in the search: first what the app does, then its answer, then the AIs.')}</p>
    <ul class="su-sw">
      {#each SOURCES as s (s.key)}
        {#if !s.sub || suche.gemini}
          <li class:sub={s.sub}>
            <label><span><b>{t(s.name)}</b><small>{t(s.text)}</small>
              {#if s.key === 'gemini' && !helper.code}<small class="warn">{t('Not ready yet: the helper code is missing.')} <a href="#/helper">{t('Me › AI helper')}</a></small>{/if}
              {#if s.key === 'chrome' && chromeAi === 'none'}<small>{t('Not on this device.')}</small>{/if}
            </span><input type="checkbox" role="switch" checked={suche[s.key]} onchange={(e) => setSuche(s.key, e.currentTarget.checked)} data-suche={s.key} /></label>
          </li>
        {/if}
      {/each}
    </ul>
    {#if suche.links}
      <p class="su-l">{t('Ask further at')}</p>
      <ul class="sv">
        {#each SERVICES as s (s.key)}
          <li><label><input type="checkbox" checked={shown.includes(s.key)} onchange={(e) => toggleService(s.key, e.currentTarget.checked)} data-suche-service={s.key} /><span><b>{s.key === 'google' ? t(s.name) : s.name}</b> <small>{t(s.what)}</small></span></label></li>
        {/each}
      </ul>
    {/if}
    <p class="note"><b>{t('AI helper (Claude)')}</b> · {isOn() ? t('on: answers questions in the search on Enter, within your monthly cap.') : t('off. It costs money and has its own switch.')} <a href="#/helper">{t('Me › AI helper')}</a></p>
  </section>
</div>

<style>
  .su {
    display: grid;
    gap: 12px;
    max-width: 760px;
  }
  .su-card {
    display: grid;
    gap: 8px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .su-l {
    margin: 8px 0 0;
    font-weight: 600;
  }
  .note {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .su-sw,
  .sv {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .su-sw label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .su-sw span {
    display: grid;
    gap: 2px;
  }
  .su-sw li.sub {
    padding-left: 16px;
    border-left: 2px solid var(--line);
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  small.warn {
    color: var(--warn);
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
