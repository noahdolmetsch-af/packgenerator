<script>
  /**
   * Paket NE 1148 (Noah 20.10.2026 «7a», formats «Alle»): one file of a note, read in the app.
   * PDF page by page (pdf.js), Word and PowerPoint as text, Excel and CSV as a table, text and Markdown,
   * GPX/TCX/FIT as a small map, a calendar file with «into the calendar», a contact with «into the
   * contacts», a short video, a web page kept to read offline. Anything else: open it with the device.
   * file: an entry of allFiles() (data inline for a mail file, else in db.docs). onclose().
   */
  import { onMount } from 'svelte';
  import { backClose } from '../ui/backclose.js';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { mdToHtml } from '../noteformats.js';
  import { formatOf, sizeText, csvRows, parseVcf, vcfOf, thinTrack, rtfToText } from './files.js';
  import { openPdf, renderPdfPage, readOffice, trackOf, bytesOf } from './attach.js';
  import { parseIcs } from '../icsio.js';
  import StaticMap from '../ui/StaticMap.svelte';
  import { X, Download, CalendarPlus, UserPlus } from '@lucide/svelte';
  import '../bikes/velo-dlg.css';

  let { file, onclose, ontext = null } = $props();

  let dialog;
  let row = $state(null);
  let err = $state('');
  let busy = $state(true);
  let view = $state(null); // what to show, by kind
  let sheet = $state(0);
  let info = $state('');
  let pdfBox = $state(null);
  const f = $derived(formatOf(file.fmt));

  onMount(() => {
    dialog.showModal();
    (async () => {
      try {
        row = file.data ? { ...file } : await db.docs.get(file.id);
        if (!row?.data) throw new Error(t('This file is not on this device.'));
        const show = formatOf(row.fmt).show;
        if (show === 'pdf') await showPdf();
        else if (show === 'doc') view = { md: (await readOffice(row.data, row.fmt)).md };
        else if (show === 'table') view = row.fmt === 'csv' ? { sheets: [{ name: row.name, rows: csvRows(await text()) }] } : await readOffice(row.data, row.fmt);
        else if (show === 'md') view = { md: await text() };
        else if (show === 'text') view = { text: (row.fmt === 'rtf' ? rtfToText(await text()) : await text()).slice(0, 100_000) };
        else if (show === 'web') view = { web: webHtml(await text(), row.images ?? []) };
        else if (show === 'map') view = { line: thinTrack(await trackOf(row.data, row.fmt)).map((p) => [p.lat, p.lon]) };
        else if (show === 'ics') view = { events: parseIcs(await text()).slice(0, 50) };
        else if (show === 'vcf') view = { contacts: parseVcf(await text()).slice(0, 50) };
        else if (show === 'video') view = { video: row.data };
        else view = { file: true };
      } catch (e) {
        err = e?.message || t('This file could not be read. You can still open it with your device.');
        view = { file: true };
      } finally {
        busy = false;
      }
    })();
  });

  async function text() {
    return new TextDecoder().decode(await bytesOf(row.data));
  }
  /** The kept web page: its text, the pictures where they stood. */
  function webHtml(md, images) {
    return mdToHtml(md).replace(/<p>\[\[img:(\d+)\]\]<\/p>/g, (_, i) => (images[Number(i)] ? `<p><img src="${images[Number(i)]}" alt="" /></p>` : ''));
  }

  let pdf = null;
  let pdfPages = $state(0);
  async function showPdf() {
    const o = await openPdf(row.data);
    pdf = o.doc;
    pdfPages = o.pages;
    view = { pdf: true };
    // the pages are drawn once the box is there
    requestAnimationFrame(drawPdf);
  }
  async function drawPdf() {
    if (!pdfBox || !pdf) return;
    const w = Math.min(1200, Math.max(320, pdfBox.clientWidth)) * Math.min(2, window.devicePixelRatio || 1);
    for (let n = 1; n <= Math.min(pdfPages, 50); n++) {
      const c = document.createElement('canvas');
      c.setAttribute('aria-label', t('Page {n} of {m}', { n, m: pdfPages }));
      c.className = 'pdfpage';
      pdfBox.append(c);
      await renderPdfPage(pdf, n, c, w);
    }
  }

  /** Open or save the file with the device (its own viewer, calendar or contacts). */
  async function openWith(data = row.data, name = row.name, mime = row.mime) {
    const blob = new Blob([await bytesOf(data)], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'datei';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  async function toCalendar() {
    info = '';
    err = '';
    try {
      const { agenda, saveEvent } = await import('../agenda/client.svelte.js');
      const { calsToFetch } = await import('../agenda.js');
      const cal = calsToFetch(agenda.prefs)[0] ?? 'primary';
      let n = 0;
      for (const e of view.events.slice(0, 10)) {
        const res = await saveEvent({ cal, title: e.title, day: e.day, lastDay: e.lastDay, allDay: e.allDay, ...(e.allDay ? {} : { from: e.from, to: e.to || e.from }), where: e.where, note: e.note });
        if (!res?.event) throw new Error(t('Connect the Google calendar first: Me › Appointments. Or open the file with your phone’s calendar.'));
        n++;
      }
      info = tn(n, '{n} appointment is in your Google calendar now.', '{n} appointments are in your Google calendar now.');
    } catch (e) {
      err = e?.message || t('The calendar could not be reached. Try again later.');
    }
  }
  function contactLines(c) {
    return [c.name, ...c.tel.map((x) => `${t('Phone')} ${x}`), ...c.email, c.org, c.adr].filter(Boolean).join('\n');
  }
  const fmtDay = (d) => (d ? d.split('-').reverse().join('.') : '');
</script>

<dialog use:backClose class="sheet vdlg fview" bind:this={dialog} onclose={() => (pdf?.destroy?.(), onclose?.())} aria-labelledby="fv-h" data-file-view={file.fmt}>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="fv-h" class="title">{file.name}</h2>
      <p class="vd-sub">{t(f.name)} · {sizeText(file.bytes)}{#if pdfPages}{' · '}{tn(pdfPages, '{n} page', '{n} pages')}{/if}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if busy}<p class="q" role="status">{t('Opening …')}</p>{/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
  {#if info}<p class="ok" role="status">{info}</p>{/if}

  {#if view?.pdf}
    <div class="pdfbox" bind:this={pdfBox} data-file-pdf></div>
  {:else if view?.md != null}
    <div class="md" data-file-md>{@html mdToHtml(view.md)}</div>
  {:else if view?.web != null}
    <div class="md web" data-file-web>{@html view.web}</div>
    {#if row?.url}<p class="q">{t('Kept from')} <a href={row.url} target="_blank" rel="noopener noreferrer">{row.url}</a></p>{/if}
  {:else if view?.text != null}
    <pre class="txt" data-file-text>{view.text}</pre>
  {:else if view?.sheets}
    {#if view.sheets.length > 1}
      <div class="vd-chips" role="group" aria-label={t('Sheets')}>
        {#each view.sheets as s, i (i)}<button type="button" class="vd-chip" aria-pressed={sheet === i} onclick={() => (sheet = i)}>{s.name}</button>{/each}
      </div>
    {/if}
    {@const rows = view.sheets[sheet]?.rows ?? []}
    <div class="tblw" data-file-table>
      {#if rows.length}
        <table>
          <thead><tr>{#each rows[0] as c, i (i)}<th>{c}</th>{/each}</tr></thead>
          <tbody>{#each rows.slice(1) as r, i (i)}<tr>{#each r as c, j (j)}<td>{c}</td>{/each}</tr>{/each}</tbody>
        </table>
      {:else}<p class="q">{t('This sheet is empty.')}</p>{/if}
    </div>
  {:else if view?.line}
    {#if view.line.length}
      <div data-file-map><StaticMap line={view.line} marks={[{ lat: view.line[0][0], lon: view.line[0][1], label: t('Start'), kind: 'start' }, { lat: view.line.at(-1)[0], lon: view.line.at(-1)[1], label: t('End'), kind: 'end' }]} label={file.name} /></div>
      <p class="q">{t('Open the file in Planen › Route or on your bike computer to ride it.')}</p>
    {:else}<p class="q">{t('This file has no points with a place.')}</p>{/if}
  {:else if view?.events}
    {#if view.events.length}
      <ul class="evs" data-file-ics>
        {#each view.events as e, i (i)}<li><b>{e.title}</b><small>{fmtDay(e.day)}{e.lastDay !== e.day ? ` – ${fmtDay(e.lastDay)}` : ''}{e.from ? ` · ${e.from}${e.to ? `–${e.to}` : ''}` : ''}{e.where ? ` · ${e.where}` : ''}</small></li>{/each}
      </ul>
      <div class="acts">
        <button type="button" class="btn hi" onclick={() => openWith(row.data, row.name.endsWith('.ics') ? row.name : `${row.name}.ics`, 'text/calendar')} data-ics-open><CalendarPlus size={16} aria-hidden="true" />{t('Into my calendar')}</button>
        <button type="button" class="btn" onclick={toCalendar} data-ics-google>{t('Into the Google calendar')}</button>
      </div>
      <p class="q">{t('«Into my calendar» opens the file with your phone’s calendar app; there you confirm it.')}</p>
    {:else}<p class="q">{t('No appointment found in this file.')}</p>{/if}
  {:else if view?.contacts}
    {#if view.contacts.length}
      <ul class="evs" data-file-vcf>
        {#each view.contacts as c, i (i)}
          <li>
            <b>{c.name || '—'}</b><small>{[...c.tel, ...c.email, c.org].filter(Boolean).join(' · ')}</small>
            <span class="acts">
              <button type="button" class="btn sm hi" onclick={() => openWith(`data:text/vcard;charset=utf-8,${encodeURIComponent(vcfOf(c))}`, `${(c.name || 'kontakt').replace(/[^\w\- ]+/g, '')}.vcf`, 'text/vcard')} data-vcf-open><UserPlus size={16} aria-hidden="true" />{t('Into my contacts')}</button>
              {#if ontext}<button type="button" class="btn sm" onclick={() => (ontext(contactLines(c)), (info = t('Added under the text of the note.')))} data-vcf-note>{t('Into the note')}</button>{/if}
            </span>
          </li>
        {/each}
      </ul>
      <p class="q">{t('«Into my contacts» opens the contact with your phone; there you save it.')}</p>
    {:else}<p class="q">{t('No contact found in this file.')}</p>{/if}
  {:else if view?.video}
    <!-- svelte-ignore a11y_media_has_caption -->
    <video class="vid" src={view.video} controls playsinline data-file-video></video>
  {:else if view?.file}
    {#if row?.fmt === 'office'}
      <p class="q" data-file-oldoffice>{t('This is an old Office file (.doc, .xls or .ppt). The app keeps it with the note but cannot show it. Open it with your device, or save it there as .docx, .xlsx or .pptx; then the app shows it and searches its text.')}</p>
    {:else}
      <p class="q">{t('The app keeps this file with the note. Open it with your device to read it.')}</p>
    {/if}
  {/if}

  <div class="vd-foot">
    {#if row}<button type="button" class="btn" onclick={() => openWith()} data-file-open><Download size={16} aria-hidden="true" />{t('Open with the device')}</button>{/if}
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Close')}</button>
  </div>
</dialog>

<style>
  .fview {
    width: min(920px, 100vw);
  }
  .pdfbox {
    display: grid;
    gap: 10px;
    margin: 0 0 12px;
  }
  .pdfbox :global(canvas) {
    width: 100%;
    height: auto;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--input);
  }
  .md {
    margin: 0 0 12px;
    overflow-x: auto;
    overflow-wrap: break-word;
  }
  .md :global(table),
  .tblw table {
    border-collapse: collapse;
  }
  .md :global(th),
  .md :global(td),
  .tblw th,
  .tblw td {
    padding: 4px 8px;
    border: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
  }
  .web :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }
  .txt {
    max-height: 60vh;
    overflow: auto;
    padding: 10px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    white-space: pre-wrap;
    overflow-wrap: break-word;
    font-size: var(--fs-small);
  }
  .tblw {
    max-height: 60vh;
    overflow: auto;
    margin: 0 0 12px;
    font-size: var(--fs-small);
  }
  .tblw th {
    position: sticky;
    top: 0;
    background: var(--paper-2);
  }
  .evs {
    display: grid;
    gap: 8px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  .evs li {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .evs small {
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 8px;
  }
  .vid {
    display: block;
    width: 100%;
    max-height: 60vh;
    border-radius: var(--r-ctl);
    background: var(--ink);
  }
  .q {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .err {
    color: var(--bad);
  }
</style>
