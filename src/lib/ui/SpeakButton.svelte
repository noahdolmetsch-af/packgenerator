<script>
  /**
   * FE10 «Sprechen statt tippen» (Noah 13.10.2026 23:52): a small microphone next to a note field. Only
   * where the browser can turn speech into text (or Whisper on this device is chosen) and while «Speak
   * instead of type» is on (Ich › Darstellung › Bedienung). onsaid(words) gets the recognised words; the
   * field appends them (speak.js appendSpoken).
   *
   * «Diktat» (Noah 19.10.2026 «1a 2a 3a 4 a oder b beides wählbar 5a»): it listens until you tap stop
   * (dictate.js starts the browser again after a pause), shows a red dot, the time and the words while you
   * speak, turns «Punkt», «neue Zeile» … into signs. With `answer` (note fields) a question in what you
   * said gets the app's answer from your data below the field: after stop or right away (setting), read
   * aloud on a tap or at once. `icon`: only the microphone (Notes tool row); `bar`: an element where the
   * live line and the answer go instead of next to the button (Notes: under the whole write row);
   * `wrap`: all of it in one row of its own (under a field).
   * «Tagebuch» (Noah 20.10.2026 «diktierfunktion integrieren. wichtig»): `always` shows it even when «Speak
   * instead of type» is off (where the browser can listen); `autostart` starts listening when it appears.
   */
  import { Mic, Square } from '@lucide/svelte';
  import { t, lang } from '../i18n.svelte.js';
  import { ops } from '../bedienung.svelte.js';
  import { dict } from '../dictation.svelte.js';
  import { speechApi, speechLang, withCommands, lastQuestion, isQuestion, sentences, clock } from '../speak.js';
  import { createDictation } from '../dictate.js';
  import AskAnswer from '../assistent/AskAnswer.svelte';
  import AskElsewhere from '../assistent/AskElsewhere.svelte';

  let { onsaid = () => {}, answer = false, icon = false, bar = null, wrap = false, always = false, autostart = false } = $props();
  /** Show this part inside `bar` when one is given (it stays where it is otherwise). */
  function moveTo(node, target) {
    const go = (t) => t && t !== node.parentNode && t.appendChild(node);
    go(target);
    return { update: go };
  }
  const Speech = speechApi();
  const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const engine = $derived(dict.engine === 'whisper' && canRecord ? 'whisper' : 'browser');
  const shown = $derived((always || ops.speak) && (engine === 'whisper' || !!Speech));

  let st = $state({ state: 'idle', error: '', startedAt: 0, progress: 0 });
  let interim = $state('');
  let elapsed = $state(0);
  let asked = $state('');
  let said = []; // the pieces of this recording, for the question after stop
  let ctl = null;
  let tick = null;

  const ERR = {
    denied: 'The microphone is not allowed. Allow it in the browser (the lock left of the address).',
    network: 'Dictation needs internet. Without it choose «On this device (Whisper)» in Me › Appearance › Handling.',
    nomic: 'No microphone found.',
    failed: 'Dictation did not work. Type instead.',
  };

  const cap = (q) => q.replace(/^\p{Ll}/u, (c) => c.toUpperCase());
  function words(w) {
    const s = dict.commands ? withCommands(w) : w;
    if (!s.trim()) return;
    said.push(s);
    onsaid(s);
    if (answer && dict.answer === 'live') {
      const q = sentences(s).filter(isQuestion).pop();
      if (q) asked = cap(q);
    }
  }

  async function whisper() {
    return import('../whisper.js');
  }

  function toggle() {
    if (st.state === 'listening') return ctl?.stop();
    if (st.state !== 'idle') return;
    said = [];
    asked = '';
    ctl = createDictation({
      engine,
      lang: speechLang(lang.v),
      Speech,
      record: async () => (await whisper()).recordMic(),
      transcribe: async (audio, o) => (await whisper()).transcribe(audio, o),
      onwords: words,
      oninterim: (s) => (interim = s),
      onstate: (s) => {
        const was = st.state;
        st = s;
        if (s.state === 'listening' && !tick) tick = setInterval(() => (elapsed = Date.now() - st.startedAt), 500);
        if (s.state !== 'listening') clearInterval(tick), (tick = null);
        if (s.state === 'listening' && was === 'idle') elapsed = 0;
        if (s.state === 'idle' && was !== 'idle' && answer && dict.answer === 'after') asked = cap(lastQuestion(said.join('. ')));
      },
    });
    ctl.start();
  }
  function reading(on) {
    if (on) ctl?.hold();
    else ctl?.release();
  }
  let autoDone = false;
  $effect(() => {
    if (autostart && shown && !autoDone) {
      autoDone = true;
      queueMicrotask(toggle);
    }
  });
  $effect(() => () => {
    clearInterval(tick);
    ctl?.cancel();
  });
  const busy = $derived(st.state === 'working' || st.state === 'loading');
  const label = $derived(st.state === 'listening' ? t('Stop|speak') : t('Speak'));
</script>

{#snippet all()}
  <button type="button" class={icon ? 'tb speak' : 'btn sm speak'} aria-pressed={st.state === 'listening'} aria-label={icon ? (st.state === 'listening' ? t('Stop dictation') : t('Dictate')) : undefined} title={icon ? label : undefined} disabled={busy} onclick={toggle} data-speak-field data-speak>
    {#if st.state === 'listening'}<Square size={icon ? 16 : 14} aria-hidden="true" />{:else}<Mic size={icon ? 18 : 16} aria-hidden="true" />{/if}{#if !icon}{label}{/if}
  </button>
  {#if st.state !== 'idle' || st.error || (answer && asked)}
  <div class="sp-out" use:moveTo={bar}>
  {#if st.state !== 'idle'}
    <span class="sp-live" role="status" data-speak-live={st.state}>
      {#if st.state === 'listening'}
        <span class="dot" aria-hidden="true"></span><b class="num">{clock(elapsed)}</b>
        <span class="sp-hint">{engine === 'whisper' ? t('Recording on this device. Tap stop when you are done.') : t('Listening. Tap stop when you are done.')}</span>
        {#if interim}<span class="sp-int" data-speak-interim>{interim}</span>{/if}
      {:else if st.state === 'loading'}
        <span class="sp-hint">{t('Loading the speech model on this device, {n} % (only the first time)', { n: st.progress })}</span>
      {:else}
        <span class="sp-hint">{t('Writing it out on this device …')}</span>
      {/if}
    </span>
  {/if}
  {#if st.error}<span class="sp-err" role="status" data-speak-error={st.error}>{t(ERR[st.error] ?? ERR.failed)}</span>{/if}
  {#if answer && asked}
    <div class="sp-ans" data-speak-answer>
      <AskAnswer q={asked} tools fallback autoread={dict.read} onreading={reading} onadopt={(s) => onsaid(`\n${t('Answer')}: ${s}`)} onclose={() => (asked = '')} />
      <AskElsewhere q={asked} />
    </div>
  {/if}
  </div>
  {/if}
{/snippet}

{#if shown}
  {#if wrap}<div class="sp-wrap">{@render all()}</div>{:else}{@render all()}{/if}
{/if}

<style>
  .sp-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 6px 0 0;
  }
  .sp-out {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
    width: 100%;
  }
  .tb {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .speak {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .speak[aria-pressed='true'] {
    border-color: var(--bad);
    color: var(--bad);
  }
  .sp-live {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--bad);
    animation: blink 1.2s ease-in-out infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.3;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
    }
  }
  .sp-int {
    flex: 1 1 100%;
    color: var(--ink-3);
    font-style: italic;
    overflow-wrap: break-word;
  }
  .sp-err {
    flex: 1 1 100%;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .sp-ans {
    flex: 1 1 100%;
    width: 100%;
  }
</style>
