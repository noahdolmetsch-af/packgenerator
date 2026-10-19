<script>
  /**
   * Big idea 2 «Werkzeug-Ketten» (Noah 19.10.2026 «1-3 freigabe»): saved steps that run with one tap.
   * «Start» asks for the files, then runs the steps one after the other and shows where it is. Chains
   * and steps: add, rename, move (arrows and drag), delete with Undo (rules 12, 18).
   */
  import { Plus, Pencil, Trash2, Play, ChevronDown } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import { sortable } from '../ui/sortable.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { STEPS, stepOf, RESIZE_PX, cleanChains, chainName, brokenStep, kindOfFiles, runChain } from './chains.js';
  import { loadImage, fitSize, render, recodeJpeg } from './phototools.js';
  import { convertedName } from './convert.js';
  import { mergeParts, shrinkPdf, sizeText } from './pdftools.js';
  import { addFile, FILE_MAX } from './ablage.js';
  import { loadTool, saveTool } from './toolstore.js';
  import { deliver } from './tools.js';
  import { t } from '../i18n.svelte.js';
  import './tools.css';

  let chains = $state([]);
  let open = $state('');
  let renaming = $state(null); // { chain } or { add: true }
  let running = $state(null); // { id, at, n, error, done: [files] }
  let input = $state();
  let want = null;
  loadTool('chains', null).then((l) => (chains = cleanChains(l)));
  const save = () => saveTool('chains', chains).catch(() => {});
  const name = (c) => chainName(c, t);
  const newId = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  const moveIn = (list, from, to) => {
    const l = [...list];
    const [x] = l.splice(from, 1);
    l.splice(to, 0, x);
    return l;
  };
  const moveChain = (from, to) => ((chains = moveIn(chains, from, to)), save());
  const setSteps = (c, steps) => ((chains = chains.map((x) => (x.id === c.id ? { ...x, steps } : x))), save());
  const addStep = (c, kind) => kind && setSteps(c, [...c.steps, { id: newId('s'), kind, ...(kind === 'resize' ? { px: 1600 } : {}) }]);

  async function removeChain(c) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: name(c) }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const at = chains.indexOf(c);
    await deleteWithUndo({
      name: name(c),
      text: t('«{name}» deleted.', { name: name(c) }),
      run: async () => {
        chains = chains.filter((x) => x.id !== c.id);
        await saveTool('chains', chains);
        return { c, at };
      },
      undo: async (s) => {
        chains = moveIn([...chains, s.c], chains.length, s.at);
        await saveTool('chains', chains);
      },
    });
  }
  async function removeStep(c, s) {
    const at = c.steps.indexOf(s);
    const label = t(stepOf(s.kind).label);
    await deleteWithUndo({
      name: label,
      text: t('«{name}» deleted.', { name: label }),
      run: async () => {
        setSteps(c, c.steps.filter((x) => x.id !== s.id));
        return { at };
      },
      undo: async ({ at: i }) => {
        const cur = chains.find((x) => x.id === c.id);
        if (cur) setSteps(cur, moveIn([...cur.steps, s], cur.steps.length, i));
      },
    });
  }

  function start(c) {
    want = c;
    input.click();
  }
  const ops = {
    async resize(f, px) {
      const img = await loadImage(f.blob);
      const s = fitSize(img.width, img.height, px);
      const blob = await render(img, { x: 0, y: 0, w: img.width, h: img.height }, s.w, s.h);
      img.close?.();
      return { name: convertedName(f.name, 'jpg'), type: 'image/jpeg', blob };
    },
    async pdf(files) {
      const parts = [];
      for (const f of files) {
        let { blob, type } = f;
        if (/^image\//.test(type) && !/jpe?g|png/.test(type)) {
          const img = await loadImage(blob);
          blob = await render(img, { x: 0, y: 0, w: img.width, h: img.height }, img.width, img.height);
          type = 'image/jpeg';
        }
        parts.push({ bytes: new Uint8Array(await blob.arrayBuffer()), kind: /pdf/.test(type) ? 'pdf' : /png/.test(type) ? 'png' : 'jpg' });
      }
      const { bytes } = await mergeParts(parts);
      return { name: convertedName(files[0]?.name, 'pdf'), type: 'application/pdf', blob: new Blob([bytes], { type: 'application/pdf' }) };
    },
    async shrink(f) {
      const src = new Uint8Array(await f.blob.arrayBuffer());
      const { bytes } = await shrinkPdf(src, recodeJpeg);
      return bytes.length < src.length ? { ...f, blob: new Blob([bytes], { type: 'application/pdf' }) } : f;
    },
    async ablage(f) {
      if (f.blob.size > FILE_MAX) throw new Error(t('«{name}» is bigger than 5 MB. Small files only.', { name: f.name }));
      const data = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(f.blob);
      });
      await addFile({ name: f.name, type: f.type, size: f.blob.size, data });
    },
    async share(files) {
      for (const f of files) await deliver(f.blob, f.name, { share: files.length === 1 });
    },
  };
  async function run(e) {
    const el = e.currentTarget;
    const files = [...(el.files ?? [])].map((f) => ({ name: f.name, type: f.type || (/\.pdf$/i.test(f.name) ? 'application/pdf' : ''), blob: f }));
    el.value = '';
    const c = want;
    if (!c || !files.length) return;
    const kind = kindOfFiles(files);
    const bad = brokenStep(c.steps, kind === 'pdf' ? 'pdf' : kind === 'img' ? 'img' : 'any');
    running = { id: c.id, at: 0, n: c.steps.length, error: '', done: null };
    if (kind === 'other' || bad >= 0) {
      running.error = kind === 'other' ? t('Only photos and PDF files.') : t('Step {n} does not fit these files.', { n: bad + 1 });
      return;
    }
    try {
      running.done = await runChain(c, files, ops, (i) => (running.at = i));
    } catch (err) {
      console.error(err);
      running.error = err?.message && !/^[A-Z][a-z]+Error/.test(err.name ?? '') ? err.message : t('Step {n} did not work.', { n: running.at + 1 });
    }
  }
</script>

<input bind:this={input} type="file" accept="image/*,application/pdf,.pdf" multiple hidden onchange={run} />
<section class="tool-card chains">
  <p class="tool-help">{t('A chain does several steps one after the other. Tap «Start», choose the files, done.')}</p>
  <ul class="tool-list" use:sortable={{ onmove: moveChain }}>
    {#each chains as c, i (c.id)}
      {@const bad = brokenStep(c.steps, c.steps[0]?.kind === 'shrink' ? 'pdf' : 'img')}
      <li data-sort-id={c.id} class="ch-row" data-chain={c.id}>
        <div class="tool-row ch-head">
          <SortGrip name={name(c)} onstep={(d) => moveChain(i, i + d)} />
          <button type="button" class="ch-name" aria-expanded={open === c.id} onclick={() => (open = open === c.id ? '' : c.id)}>
            <b>{name(c)}</b>
            <small class="tool-muted">{c.steps.map((s) => t(stepOf(s.kind).label)).join(' → ') || t('No steps yet')}</small>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          <span class="ch-acts">
            <SortArrows name={name(c)} {i} n={chains.length} onstep={(d) => moveChain(i, i + d)} />
            <button type="button" class="btn hi sm" disabled={!c.steps.length || bad >= 0} onclick={() => start(c)}><Play size={15} aria-hidden="true" />{t('Start|chain')}</button>
          </span>
        </div>
        {#if running?.id === c.id}
          <div class="ch-run" aria-live="polite">
            {#if running.error}
              <p class="tool-status err">{running.error}</p>
            {:else if running.done}
              <p class="tool-status">{t('Done.')} {running.done.map((f) => `${f.name} (${sizeText(f.blob.size)})`).join(', ')}</p>
            {:else}
              <progress max={running.n} value={running.at}></progress>
              <p class="tool-status">{t('Step {n} of {all}: {step}', { n: running.at + 1, all: running.n, step: t(stepOf(c.steps[running.at]?.kind)?.label ?? '') })}</p>
            {/if}
          </div>
        {/if}
        {#if open === c.id}
          <div class="ch-edit">
            {#if bad >= 0}<p class="tool-status err">{t('Step {n} does not fit what comes before it. Move or delete it.', { n: bad + 1 })}</p>{/if}
            <ol class="tool-list ch-steps" use:sortable={{ onmove: (a, b) => setSteps(c, moveIn(c.steps, a, b)) }}>
              {#each c.steps as s, j (s.id)}
                {@const label = t(stepOf(s.kind).label)}
                <li data-sort-id={s.id} data-step={s.kind}>
                  <SortGrip name={label} onstep={(d) => setSteps(c, moveIn(c.steps, j, j + d))} />
                  <span class="ch-step">{j + 1}. {label}</span>
                  {#if s.kind === 'resize'}
                    <select class="tool-input ch-px" aria-label={t('Longest side')} value={s.px} onchange={(e) => setSteps(c, c.steps.map((x) => (x.id === s.id ? { ...x, px: Number(e.currentTarget.value) } : x)))}>
                      {#each RESIZE_PX as px (px)}<option value={px}>{px} px</option>{/each}
                    </select>
                  {/if}
                  <SortArrows name={label} i={j} n={c.steps.length} onstep={(d) => setSteps(c, moveIn(c.steps, j, j + d))} />
                  <button type="button" class="btn sm" aria-label={t('Delete {name}', { name: label })} onclick={() => removeStep(c, s)}><Trash2 size={15} aria-hidden="true" /></button>
                </li>
              {/each}
            </ol>
            <div class="tool-row">
              <label class="tool-field ch-add"><span>{t('Add step')}</span>
                <select class="tool-input" value="" onchange={(e) => (addStep(c, e.currentTarget.value), (e.currentTarget.value = ''))}>
                  <option value="">–</option>
                  {#each STEPS as s (s.kind)}<option value={s.kind}>{t(s.label)}</option>{/each}
                </select>
              </label>
              <button type="button" class="btn sm" onclick={() => (renaming = { chain: c })}><Pencil size={15} aria-hidden="true" />{t('Rename')}</button>
              <button type="button" class="btn sm" onclick={() => removeChain(c)}><Trash2 size={15} aria-hidden="true" />{t('Delete')}</button>
            </div>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
  {#if !chains.length}<p class="tool-muted">{t('No chains yet. Add one.')}</p>{/if}
  <div><button type="button" class="btn" onclick={() => (renaming = { add: true })}><Plus size={16} aria-hidden="true" />{t('New chain')}</button></div>
</section>

{#if renaming}
  <RenameSheet
    kicker={t('Tool chains')}
    title={renaming.add ? t('New chain') : t('Rename chain')}
    value={renaming.chain ? name(renaming.chain) : ''}
    max={60}
    onsave={(v) => {
      const n = v.trim();
      if (!n) return t('Please type a name.');
      if (renaming.add) {
        const c = { id: newId('c'), name: n, builtin: false, steps: [] };
        chains = [...chains, c];
        open = c.id;
      } else chains = chains.map((x) => (x.id === renaming.chain.id ? { ...x, name: n, builtin: false } : x));
      save();
    }}
    onclose={() => (renaming = null)}
  />
{/if}

<style>
  .ch-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }
  .ch-acts {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin-left: auto;
  }
  .ch-name {
    display: grid;
    grid-template-columns: 1fr auto;
    flex: 1 1 220px;
    min-width: 0;
    gap: 0 var(--sp-2);
    padding: 4px 0;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .ch-name b,
  .ch-name small {
    grid-column: 1;
    overflow-wrap: break-word;
  }
  .ch-name :global(svg) {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
  }
  .ch-run,
  .ch-edit {
    display: grid;
    gap: var(--sp-2);
  }
  .ch-step {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ch-px {
    width: auto;
    min-height: 36px;
  }
  .ch-add {
    flex: 1 1 200px;
  }
  progress {
    width: 100%;
  }
</style>
