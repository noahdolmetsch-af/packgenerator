<script>
  /**
   * Paket H «Packen leichter», answer 4 «4a und b möglich» (Noah 19.10.2026 12:09): «Read aloud» in
   * Packen. The app reads the next item that is not packed yet (the browser's own voice, on the device).
   * - «Say ok» (4a): after each item the app listens; «ok», «ja» or «eingepackt» ticks it off, «weiter»
   *   skips, «zurück» goes back, «nochmal» repeats, «stopp» ends. In Chrome the listening runs over
   *   Google, so it needs the internet; without it the big button stays.
   * - «Button only» (4b): it only reads; the big «Packed» button ticks off.
   * The choice is remembered on this device. Loaded only when opened (Pack.svelte).
   */
  import { onDestroy } from 'svelte';
  import { backClose } from '../ui/backclose.js';
  import Seg from '../ui/Seg.svelte';
  import { t, tn, nameOf, lang } from '../i18n.svelte.js';
  import { speechApi, speechLang, heard } from '../speak.js';
  import { voiceApi, commandOf, readQueue, sayLine, nextIndex, prevIndex, savedMode, saveMode } from '../readaloud.js';
  import { Check, SkipForward, SkipBack, RotateCcw, Mic, MicOff, Volume2 } from '@lucide/svelte';

  let { groups = [], itemsById = {}, ontick, onclose } = $props();

  // the order is fixed when the window opens; what is ticked here leaves the round
  // svelte-ignore state_referenced_locally
  const queue = readQueue(groups);
  let i = $state(queue.length ? 0 : -1);
  let done = $state(new Set());
  let mode = $state(savedMode());
  let listening = $state(false);
  let heardText = $state('');
  let note = $state('');
  let el;
  let rec = null;
  let closed = false;

  const voice = voiceApi();
  const Rec = speechApi();
  const canListen = !!Rec;
  const row = $derived(i >= 0 ? queue[i] : null);
  const left = $derived(queue.filter((r) => !done.has(r.itemId)).length);
  const nameAt = (r) => (r ? nameOf(itemsById[r.itemId]) || r.itemId : '');
  const texts = () => ({ many: t('{qty} times {name}'), bag: t('Into {bag}') });

  $effect(() => {
    el.showModal();
    readNow();
  });

  function stopListening() {
    try {
      rec?.abort();
    } catch {
      /* already ended */
    }
    rec = null;
    listening = false;
  }

  function speak(text, then) {
    if (!voice) return then?.();
    voice.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang(lang.v);
    u.rate = 0.95;
    u.onend = () => then?.();
    u.onerror = () => then?.();
    voice.speak(u);
  }

  function readNow() {
    stopListening();
    if (closed) return;
    if (!row) return speak(t('Everything read. {n} still open.', { n: left }));
    const prev = i > 0 ? queue[i - 1] : null;
    speak(sayLine(row, prev, nameAt(row), texts()), () => mode === 'voice' && canListen && !closed && listen());
  }

  function listen() {
    stopListening();
    if (!canListen || closed || !row) return;
    rec = new Rec();
    rec.lang = speechLang(lang.v);
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let acted = false;
    rec.onresult = (e) => {
      const said = heard(e.results);
      heardText = said;
      const cmd = commandOf(said);
      if (cmd) {
        acted = true;
        act(cmd);
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        acted = true;
        note = t('The microphone is not allowed. Allow it in the browser, or use the big button.');
        setMode('button');
      } else if (e.error === 'network') {
        acted = true;
        note = t('Listening needs the internet. The big button works without.');
        setMode('button');
      }
    };
    rec.onend = () => {
      listening = false;
      // nothing understood: listen again while this item is still the one
      if (!acted && !closed && mode === 'voice' && row) setTimeout(() => !closed && mode === 'voice' && !listening && listen(), 300);
    };
    try {
      rec.start();
      listening = true;
    } catch {
      listening = false;
    }
  }

  function act(cmd) {
    if (cmd === 'tick') return tickNow();
    if (cmd === 'skip') return go(nextIndex(queue, i, done));
    if (cmd === 'back') return go(prevIndex(queue, i, done));
    if (cmd === 'again') return readNow();
    if (cmd === 'stop') return el.close();
  }
  function go(n) {
    i = n;
    readNow();
  }
  async function tickNow() {
    if (!row) return;
    const r = row;
    const next = new Set(done);
    next.add(r.itemId);
    done = next;
    await ontick?.(r.itemId);
    note = t('"{name}" packed.', { name: nameAt(r) });
    go(nextIndex(queue, i, done));
  }
  function setMode(m) {
    mode = m;
    saveMode(m);
    if (m === 'button') stopListening();
    else if (row) listen();
  }
  function end() {
    closed = true;
    stopListening();
    voice?.cancel();
    onclose?.();
  }
  onDestroy(() => {
    closed = true;
    stopListening();
    voice?.cancel();
  });
</script>

<dialog use:backClose class="calm-sheet ra-sheet" bind:this={el} onclose={end} aria-labelledby="ra-h">
  <header><h2 id="ra-h"><Volume2 size={22} aria-hidden="true" /> {t('Read aloud')}</h2><button type="button" class="text-button" onclick={() => el.close()}>{t('End')}</button></header>
  <Seg label={t('How you tick off')} options={[{ key: 'voice', name: t('Say «ok»') }, { key: 'button', name: t('Button only') }]} value={mode} onchange={setMode} />
  <p class="how">{mode === 'voice' ? (canListen ? t('Say «ok» when it is packed, «weiter» to skip, «zurück» to go back, «stopp» to end. Listening runs over Google and needs the internet.') : t('This browser cannot listen. Use the big button.')) : t('The app only reads. Tap the big button when it is packed.')}</p>
  {#if !voice}<p class="how">{t('This browser has no voice: the item shows here in big letters.')}</p>{/if}

  {#if row}
    <div class="now" aria-live="polite">
      {#if row.bagName}<small>{t('Into {bag}', { bag: row.bagName })}</small>{/if}
      <b>{row.qty > 1 ? `${row.qty} × ` : ''}{nameAt(row)}</b>
      <span class="cnt num">{tn(left, '{n} still to pack', '{n} still to pack')}</span>
    </div>
    <button type="button" class="big" onclick={tickNow}><Check size={32} aria-hidden="true" /> {t('Packed')}</button>
    <div class="nav">
      <button type="button" class="btn" onclick={() => go(prevIndex(queue, i, done))}><SkipBack size={18} aria-hidden="true" /> {t('Back')}</button>
      <button type="button" class="btn" onclick={readNow}><RotateCcw size={18} aria-hidden="true" /> {t('Again')}</button>
      <button type="button" class="btn" onclick={() => go(nextIndex(queue, i, done))}><SkipForward size={18} aria-hidden="true" /> {t('Later|skip')}</button>
    </div>
    {#if mode === 'voice' && canListen}
      <p class="mic" class:on={listening}>{#if listening}<Mic size={18} aria-hidden="true" /> {t('Listening …')}{:else}<MicOff size={18} aria-hidden="true" /> {t('Not listening right now')}{/if}{#if heardText} · <i>«{heardText}»</i>{/if}</p>
    {/if}
  {:else}
    <div class="now"><b>{left ? tn(left, 'Read through. {n} item is still open.', 'Read through. {n} items are still open.') : t('Everything packed.')}</b></div>
  {/if}
  {#if note}<p class="note" role="status">{note}</p>{/if}
</dialog>

<style>
  .ra-sheet { max-width: 560px; }
  .ra-sheet h2 { display: flex; align-items: center; gap: 8px; }
  .how { margin: 8px 0; color: var(--ink-2); font-size: var(--fs-small); }
  .now { display: grid; gap: 4px; justify-items: center; text-align: center; margin: 16px 0; padding: 16px; border-radius: 12px; background: var(--paper-2); }
  .now b { font-size: var(--fs-page); line-height: 1.15; overflow-wrap: break-word; }
  .now small, .cnt { color: var(--ink-2); }
  .big { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; min-height: 96px; border: 0; border-radius: 16px; background: var(--ok); color: var(--hi-ink); font-family: var(--font-body); font-weight: 700; font-size: var(--fs-section); cursor: pointer; }
  .big:focus-visible { outline: var(--focus-ring); outline-offset: 3px; }
  .nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 12px; }
  .mic { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 12px 0 0; color: var(--ink-3); font-size: var(--fs-small); }
  .mic.on { color: var(--ok); font-weight: 600; }
  .note { text-align: center; color: var(--ink-2); font-size: var(--fs-small); }
</style>
