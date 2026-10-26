// «Eingaben überall» (Noah 26.10.2026 «1a 2b 3 nur Ton. kein Video 4b 5a aber b möglich»): the input bar, its
// templates per page, the picture card and the diary in the app search. Fictional data only.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as I from '../src/lib/eingabe/inputs.js';
import { cardSentence, wrapLines, coverCut, cardFile, CARD_TEXT_MAX } from '../src/lib/eingabe/bildkarte.js';
import { newEntry, isEmpty, matches, diarySearchable, lightEntry } from '../src/lib/tagebuch/journal.js';
import { searchAll } from '../src/lib/search.js';
import { careChange } from '../src/lib/care/plan.js';
import { checkOf } from '../src/lib/flowcheck.js';
import { tripNotes } from '../src/lib/notes.js';
import { geminiRequest, DIARY_MODES } from '../api/helper.js';
import DE from '../src/lib/i18n/de/index.js';

const voice = (s = 12) => ({ src: 'data:audio/webm;base64,AAAA', s });
const file = (name = 'anleitung.pdf', bytes = 1000) => ({ name, type: 'application/pdf', bytes, src: 'data:application/pdf;base64,AAAA' });

describe('the places of the bar', () => {
  it('ten places, each with known tools, never video (Noah «3 nur Ton. kein Video»)', () => {
    expect(I.PLACE_KEYS).toHaveLength(10);
    for (const k of I.PLACE_KEYS) {
      const tools = I.toolsOf(k);
      expect(tools.length).toBeGreaterThan(1);
      for (const x of tools) expect(I.TOOLS).toContain(x);
    }
    expect(I.TOOLS).not.toContain('video');
    expect(I.VOICE_MAX_S).toBe(60);
  });
  it('every place is really used by a page', () => {
    const src = ['src/lib/tagebuch/EntrySheet.svelte', 'src/lib/notes/NoteSheet.svelte', 'src/pages/Check.svelte', 'src/lib/lernen/Tagebuch.svelte', 'src/pages/Ride.svelte', 'src/lib/spur/PlaceSheet.svelte', 'src/lib/care/CareSheet.svelte', 'src/lib/gear/ItemDialog.svelte', 'src/lib/dreams/DreamSheet.svelte', 'src/lib/QuickNote.svelte'].map((f) => readFileSync(f, 'utf8')).join('\n');
    for (const k of I.PLACE_KEYS) expect(src).toContain(`<InputBar place="${k}"`);
  });
  it('only cuts the tools of a place', () => {
    expect(I.toolsOf('debrief', ['voice', 'photo'])).toEqual(['voice']);
  });
});

describe('what was added', () => {
  it('empty is null when saving, filled keeps only what holds something', () => {
    expect(I.cleanInputs(null)).toBeNull();
    expect(I.cleanInputs(I.emptyInputs())).toBeNull();
    const x = I.addVoice(null, voice()).inputs;
    expect(Object.keys(I.cleanInputs(x))).toEqual(['voices']);
    expect(I.hasInputs(x)).toBe(true);
  });
  it('at most 3 voice notes, each at most a minute', () => {
    let x = null;
    for (let i = 0; i < 3; i++) x = I.addVoice(x, voice(90)).inputs;
    expect(x.voices).toHaveLength(3);
    expect(x.voices[0].s).toBe(60);
    expect(I.addVoice(x, voice()).error).toBe('many');
    const id = x.voices[1].id;
    expect(I.dropVoice(x, id).voices.map((a) => a.id)).not.toContain(id);
    expect(I.setVoice(x, id, { text: 'Sattel knarzt' }).voices[1].text).toBe('Sattel knarzt');
  });
  it('files: too big or too many are refused', () => {
    expect(I.addFile(null, file('gross.pdf', I.FILE_MAX_BYTES + 1)).error).toBe('big');
    let x = null;
    for (let i = 0; i < I.FILES_MAX; i++) x = I.addFile(x, file(`f${i}.pdf`)).inputs;
    expect(I.addFile(x, file()).error).toBe('many');
    expect(I.dropFile(x, x.files[0].id).files).toHaveLength(I.FILES_MAX - 1);
  });
  it('the size of a data URL without reading it', () => {
    expect(I.dataBytes('data:text/plain;base64,SGFsbG8=')).toBe(5);
  });
  it('tags without # and doubles, place with or without position', () => {
    let x = I.addTag(null, '#Tour');
    x = I.addTag(x, 'tour');
    x = I.addTag(x, 'Knie');
    expect(x.tags).toEqual(['Tour', 'Knie']);
    expect(I.dropTag(x, 'Tour').tags).toEqual(['Knie']);
    expect(I.setPlace(x, { name: 'Seeufer' }).place).toEqual({ name: 'Seeufer' });
    expect(I.setPlace(x, { name: '', lat: 46.5, lon: 7.5 }).place).toEqual({ name: '', lat: 46.5, lon: 7.5 });
    expect(I.setPlace(x, null).place).toBeNull();
  });
  it('the words for the search and a short line', () => {
    const x = { voices: [{ src: 'data:a', s: 5, text: 'Kette quietscht' }], files: [file('rechnung.pdf')], tags: ['Werkstatt'], place: { name: 'Thun' } };
    expect(I.inputWords(x)).toContain('Kette quietscht');
    expect(I.inputWords(x)).toContain('rechnung.pdf');
    expect(I.inputsLine(x)).toBe('1 voice note · 1 file · Thun · #Werkstatt');
  });
  it('the most used tags first', () => {
    expect(I.tagsUsed([{ inputs: { tags: ['A', 'B'] } }, { inputs: { tags: ['b'] } }, {}])).toEqual([{ name: 'B', n: 2 }, { name: 'A', n: 1 }]);
  });
  it('a block goes under the text with an empty line', () => {
    expect(I.withBlock('', 'Frage')).toBe('Frage\n');
    expect(I.withBlock('Heute  \n', 'Frage')).toBe('Heute\n\nFrage\n');
    expect(I.withBlock('Heute', '  ')).toBe('Heute');
  });
});

describe('templates per page (Noah «4b»)', () => {
  it('the diary starts with Noah\'s four', () => {
    expect(I.templatesFor('diary', {}).map((x) => x.key)).toEqual(['grateful', 'joys', 'good2', 'moment']);
  });
  it('each page has its own list; an empty stored list stays empty', () => {
    const stored = I.withTemplates({}, 'diary', []);
    expect(I.templatesFor('diary', stored)).toEqual([]);
    expect(I.templatesFor('check', stored).length).toBeGreaterThan(0);
  });
  it('add, change, sort and delete', () => {
    let list = I.templatesFor('ride', {});
    list = I.addTemplate(list, 'Pause', 'Pause bei:', 'own1');
    expect(list.at(-1)).toEqual({ key: 'own1', name: 'Pause', text: 'Pause bei:', raw: true });
    expect(I.addTemplate(list, ' ', 'x')).toBe(list);
    const changed = I.changeTemplate(list, 'how', { name: 'Wie war es' }, (s) => s);
    expect(changed[0]).toMatchObject({ key: 'how', name: 'Wie war es', raw: true });
    expect(changed[0].text).toContain('How it went:');
    expect(I.moveTemplate(list, 2, 0)[0].key).toBe('own1');
    expect(I.moveTemplate(list, 0, 9)).toBe(list);
    expect(I.removeTemplate(list, 'own1').map((x) => x.key)).toEqual(['how', 'problem']);
  });
  it('a Standard template is shown in the language line by line, list signs kept', () => {
    const tr = (s) => DE[s] ?? s;
    const x = I.templatesFor('diary', {}).find((y) => y.key === 'good2');
    expect(I.tplName(x, tr)).toBe('2 gute Dinge');
    expect(I.tplText(x, tr)).toBe('Zwei gute Dinge, die heute passiert sind:\n1. \n2. ');
    const ride = I.templatesFor('ride', {})[0];
    expect(I.tplText(ride, tr)).toBe('Wie es lief:\n- Beine: \n- Wetter: \n- Essen: ');
  });
  it('every Standard name, line and prompt has a German text', () => {
    const missing = [];
    for (const list of Object.values(I.STD_TEMPLATES))
      for (const x of list) {
        if (!(x.name in DE)) missing.push(x.name);
        for (const l of x.text.split('\n')) {
          const m = l.match(/^((?:- (?:\[ \] )?)|(?:\d+\. ))?(.*?)(\s*)$/);
          if (m[2] && !(m[2] in DE)) missing.push(m[2]);
        }
      }
    for (const list of Object.values(I.PROMPTS)) for (const s of list) if (!(s in DE)) missing.push(s);
    for (const p of Object.values(I.PLACES)) if (!(p.name in DE)) missing.push(p.name);
    expect(missing).toEqual([]);
  });
});

describe('writing prompts and AI answers', () => {
  it('three prompts a day, others tomorrow', () => {
    const a = I.promptsFor('diary', '2026-10-26');
    const b = I.promptsFor('diary', '2026-10-27');
    expect(a).toHaveLength(3);
    expect(a).not.toEqual(b);
    expect(I.promptsFor('gear', '2026-10-26')).toHaveLength(3); // no own list: the notes' prompts
  });
  it('Gemini lines without list signs, at most max', () => {
    expect(I.aiLines('1. Was hat dich überrascht?\n\n- **Wer** war dabei?\n• Und morgen?\n* vier', 3)).toEqual(['Was hat dich überrascht?', 'Wer war dabei?', 'Und morgen?']);
    expect(I.highlightsBlock(['Pass erreicht', 'Kaffee'], 'Highlights')).toBe('Highlights:\n- Pass erreicht\n- Kaffee');
    expect(I.highlightsBlock([])).toBe('');
  });
  it('the server knows the two new jobs with their own instruction', () => {
    expect(DIARY_MODES).toContain('prompts');
    expect(DIARY_MODES).toContain('highlights');
    const r = geminiRequest({ question: 'Writing prompts for this text', context: '[Diary]\nHeute am See', mode: 'prompts', lang: 'de' });
    expect(r.systemInstruction.parts[0].text).toContain('Schreibanreize');
  });
});

describe('the picture card (Noah «1a»: no AI picture)', () => {
  it('starts with the title, else the text, at most CARD_TEXT_MAX signs', () => {
    expect(cardSentence({ title: 'Am Pass', text: 'lang' })).toBe('Am Pass');
    expect(cardSentence({ text: 'Erster  Satz\nzweiter' })).toBe('Erster Satz zweiter');
    const long = cardSentence({ text: 'wort '.repeat(100) });
    expect(long.length).toBeLessThanOrEqual(CARD_TEXT_MAX);
    expect(long.endsWith(' …')).toBe(true);
  });
  it('wraps words into lines and cuts the last with …', () => {
    const m = (s) => s.length;
    expect(wrapLines('eins zwei drei vier', 9, m)).toEqual(['eins zwei', 'drei vier']);
    expect(wrapLines('a b c d e f', 1, m, 2)).toEqual(['a', 'b …']);
    expect(wrapLines('superlangeswort', 3, m)).toEqual(['superlangeswort']);
  });
  it('cuts a photo to fill the box', () => {
    expect(coverCut(2000, 1000, 1000, 1000)).toEqual({ sx: 500, sy: 0, sw: 1000, sh: 1000 });
    expect(cardFile('2026-10-26')).toBe('bildkarte-2026-10-26.png');
  });
});

describe('the pages keep what was added', () => {
  it('a diary entry keeps its inputs; a voice note alone is not empty; the diary search finds its words', () => {
    const e = newEntry({ text: '', inputs: { voices: [{ src: 'data:a', s: 4, text: 'Sonnenaufgang am See' }] } }, { id: 'tb-x', now: '2026-10-26T07:00:00Z' });
    expect(e.inputs.voices).toHaveLength(1);
    expect(isEmpty(e)).toBe(false);
    expect(isEmpty({ text: '', inputs: null })).toBe(true);
    expect(matches(e, 'sonnenaufgang')).toBe(true);
    expect(newEntry({ text: 'x' }, { id: 'tb-y' })).not.toHaveProperty('inputs');
  });
  it('a care keeps its inputs per care key', () => {
    const out = careChange({ careNotes: {} }, 'wax', { on: true, note: 'gewachst', inputs: { voices: [voice()] } });
    expect(out.careInputs.wax.voices).toHaveLength(1);
    expect(careChange({ careInputs: { wax: { tags: ['x'] } } }, 'wax', { inputs: null }).careInputs).toEqual({});
    expect(careChange({}, 'wax', { on: true })).not.toHaveProperty('careInputs');
  });
  it('the evening check keeps its inputs', () => {
    expect(checkOf({ day: '2026-10-26', inputs: { tags: ['Ruhe'] } }).inputs).toEqual({ tags: ['Ruhe'] });
    expect(checkOf({ day: '2026-10-26' }).inputs).toBeNull();
  });
  it('a ride note brings its inputs into the trip\'s notes', () => {
    const n = { id: 'n1', at: '2026-10-26T10:00:00Z', day: 0, text: 'Sprachnotiz', tripId: 't1', inputs: { voices: [voice()] } };
    expect(tripNotes(null, [n], 't1')[0].inputs.voices).toHaveLength(1);
  });
});

describe('the diary in the app search (Noah «5a aber b möglich»)', () => {
  const entry = { id: 'tb-1', kind: 'diary', day: '2026-10-20', time: '20:00', title: 'Abend am See', text: 'Ruhig', tags: ['See'], photos: [{ src: 'data:image/jpeg;base64,AAAA' }], inputs: { voices: [{ src: 'data:a', s: 3, text: 'Schwäne' }] } };
  it('on by default, off when switched off, with a lock only while open', () => {
    expect(diarySearchable({})).toBe(true);
    expect(diarySearchable({ inSearch: false })).toBe(false);
    expect(diarySearchable({ lock: { hash: 'x' } }, false)).toBe(false);
    expect(diarySearchable({ lock: { hash: 'x' } }, true)).toBe(true);
  });
  it('the search keeps no photos or sound in memory', () => {
    const l = lightEntry(entry);
    expect(JSON.stringify(l)).not.toContain('data:');
    expect(l.inputs.voices[0].text).toBe('Schwäne');
  });
  it('finds an entry by its title and by a voice note as text, and opens it', () => {
    const g = searchAll('schwäne', { diary: [lightEntry(entry)] });
    expect(g.map((x) => x.kind)).toEqual(['diary']);
    expect(g[0].rows[0]).toMatchObject({ id: 'tb-1', title: 'Abend am See', href: '#/tagebuch/tb-1' });
    expect(searchAll('schwäne', {})).toEqual([]);
  });
});
