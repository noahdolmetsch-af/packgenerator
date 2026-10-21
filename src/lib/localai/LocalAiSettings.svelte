<script>
  /*
   * «KI im Gerät» settings (Noah 20.10.2026 «1a 2a 3 beide optionen … a weitere modelle»): Ich ›
   * Darstellung › Bedienung. Choose a model, load it once on a tap (2a), check how fast this device
   * answers, delete it again. Everything stays on this device.
   */
  import { Download, Gauge, Trash2, Cpu } from '@lucide/svelte';
  import { t, isDe, num } from '../i18n.svelte.js';
  import { askDelete } from '../ui/ask.js';
  import { LOCAL_MODELS, canRunLocal, chatFor, SPEED_QUESTION, speedWord } from './models.js';
  import { loadModel, askModel, removeModel, storedBytes, gpuInfo } from './engine.js';
  import { local, refreshLocal, chooseModel, saveSpeed } from './localai.svelte.js';

  const able = canRunLocal();
  let busy = $state(''); // 'load' | 'speed' | ''
  let pct = $state(0);
  let msg = $state('');
  let bytes = $state(0);
  let sample = $state('');
  let chip = $state(null);

  async function look() {
    await refreshLocal();
    bytes = local.ready ? await storedBytes(local.model) : 0;
  }
  if (able) {
    look();
    gpuInfo().then((g) => (chip = g));
  }

  async function pick(key) {
    if (busy) return;
    msg = '';
    sample = '';
    await chooseModel(key);
    await look();
  }
  async function download() {
    if (busy) return;
    busy = 'load';
    pct = 0;
    msg = '';
    try {
      await loadModel(local.model, { onprogress: (p) => (pct = p) });
      await look();
      msg = t('Loaded. It now works without internet on this device.');
    } catch {
      msg = t('Loading did not work. Check the internet and the free space, then try again or choose another model.');
    } finally {
      busy = '';
    }
  }
  async function speed() {
    if (busy) return;
    busy = 'speed';
    msg = '';
    sample = '';
    try {
      const r = await askModel(local.model, chatFor(isDe() ? SPEED_QUESTION.de : SPEED_QUESTION.en, [], { de: isDe() }), { max: 80, onText: (s) => (sample = s), onprogress: (p) => (pct = p) });
      sample = r.text;
      saveSpeed({ tps: r.tps, seconds: r.seconds, device: r.device });
      await look();
    } catch {
      msg = t('The check did not work on this device. Choose a smaller model or try again later.');
    } finally {
      busy = '';
    }
  }
  async function remove() {
    const m = LOCAL_MODELS.find((x) => x.key === local.model);
    const answer = await askDelete({ title: t('Delete «{name}» from this device?', { name: m.name }), text: t('Only the downloaded model goes; your data stays. You can load it again later.') });
    if (answer !== 'delete') return;
    await removeModel(local.model);
    saveSpeed(null);
    sample = '';
    await look();
    msg = t('Deleted from this device.');
  }
  const gb = (b) => (b >= 1e9 ? `${num(Math.round(b / 1e8) / 10)} GB` : `${num(Math.round(b / 1e6))} MB`);
  const speedHere = $derived(local.speed?.key === local.model ? local.speed : null);
  const SPEED_TEXT = { fast: 'fast', usable: 'usable', slow: 'slow' };
</script>

<section class="la" aria-labelledby="la-h" data-local-ai>
  <h3 id="la-h"><Cpu size={18} aria-hidden="true" />{t('AI on this device')}</h3>
  <p class="note">{t('A small AI that runs inside the app, also without internet. Free, and your questions never leave the device. With internet the AI helper answers (if it is set up); without internet this one.')}</p>
  {#if !able}
    <p class="note">{t('This browser cannot run it.')}</p>
  {:else}
    <p class="la-l" id="la-pick">{t('Model')}</p>
    <ul class="la-ms" role="radiogroup" aria-labelledby="la-pick">
      {#each LOCAL_MODELS as m (m.key)}
        <li>
          <label class:on={local.model === m.key}>
            <input type="radio" name="la-model" value={m.key} checked={local.model === m.key} disabled={!!busy} onchange={() => pick(m.key)} data-local-model={m.key} />
            <span><b>{m.name}</b> · {t(m.kind === 'small' ? 'small and fast' : 'a bit cleverer')} · {t(m.size)}<small>{t(m.text)}</small></span>
          </label>
        </li>
      {/each}
    </ul>
    <p class="note">{t('Loads once from Hugging Face (free). The browser keeps it on this device; it is not in your backup and not synced.')}{#if chip}{' '}{chip.gpu ? t('This device uses its graphics chip: quicker.') : t('This device has no graphics chip for it: it runs on the processor, slower.')}{/if}</p>

    <div class="la-acts">
      {#if !local.ready}
        <button type="button" class="btn sm primary" onclick={download} disabled={!!busy} data-local-load><Download size={16} aria-hidden="true" />{busy === 'load' ? t('Loading … {p} %', { p: pct }) : t('Load to this device')}</button>
      {:else}
        <span class="la-ok" data-local-ready>{t('On this device')}{bytes ? ` · ${gb(bytes)}` : ''}</span>
        <button type="button" class="btn sm" onclick={speed} disabled={!!busy} data-local-speed><Gauge size={16} aria-hidden="true" />{busy === 'speed' ? t('Checking …') : t('Check the speed')}</button>
        <button type="button" class="btn sm" onclick={remove} disabled={!!busy} data-local-remove><Trash2 size={16} aria-hidden="true" />{t('Delete from this device')}</button>
      {/if}
    </div>
    {#if busy === 'load'}<progress max="100" value={pct} aria-label={t('Loading')}></progress>{/if}
    {#if speedHere && !busy}
      <p class="la-sp" data-local-speedline>{t('Speed here: {w} ({n} words a second, answer in {s} s)', { w: t(SPEED_TEXT[speedWord(speedHere.tps)] ?? 'slow'), n: num(Math.round((speedHere.tps / 1.4) * 10) / 10), s: num(speedHere.seconds) })}</p>
    {/if}
    {#if sample}<p class="la-sample" role="status">{sample}</p>{/if}
    {#if msg}<p class="note" role="status">{msg}</p>{/if}
  {/if}
</section>

<style>
  .la {
    display: grid;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: var(--fs-body);
  }
  .la-l {
    margin: 8px 0 0;
    font-weight: 600;
  }
  .note {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .la-ms {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .la-ms label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    cursor: pointer;
  }
  .la-ms label.on {
    border-color: var(--accent);
  }
  .la-ms span {
    display: grid;
    gap: 2px;
  }
  .la-ms input {
    width: 20px;
    height: 20px;
    flex: none;
    margin-top: 2px;
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .la-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .la-acts .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .la-ok {
    font-size: var(--fs-small);
    color: var(--accent);
    font-weight: 600;
  }
  progress {
    width: 100%;
  }
  .la-sp {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .la-sample {
    margin: 0;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--paper-2);
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
</style>
