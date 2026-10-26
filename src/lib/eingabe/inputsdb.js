/**
 * «Eingaben überall»: the templates of every place in settings 'inputTemplates' (inputs.js TEMPLATES_KEY),
 * the AI steps of the bar (Gemini, free, only with a tick) and a voice note turned into text on this device.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { askGemini } from '../assistent/gemini.js';
import { TEMPLATES_KEY, withTemplates, PLACES } from './inputs.js';

export const templatesQuery = (db = appDb) => liveQuery(async () => (await db.settings.get(TEMPLATES_KEY))?.value ?? {});

/** The templates of one place saved (the others kept). */
export async function saveTemplates(place, list, db = appDb) {
  const had = (await db.settings.get(TEMPLATES_KEY))?.value ?? {};
  await db.settings.put({ key: TEMPLATES_KEY, value: withTemplates(had, place, list) });
}

/** How many signs of text go along to Gemini at most (the server takes 12000). */
export const AI_MAX = 8000;

/**
 * One AI step (api/helper.js modes): 'title', 'prompts' (three writing prompts that fit the text) or
 * 'highlights' (the best of the text in 2–4 lines). → { ok, text } | { ok: false, error } (gemini.js)
 */
export function inputAi(mode, { text = '', place = 'notes', lang = 'de', fetchFn } = {}) {
  const q = { title: 'Title for this entry', prompts: 'Writing prompts for this text', highlights: 'Highlights of this text' }[mode] ?? 'Help with this text';
  const context = `[${PLACES[place]?.name ?? place}]\n${String(text).slice(0, AI_MAX)}`;
  return askGemini(q, { context, lang, mode, ...(fetchFn ? { fetchFn } : {}) });
}

/** A voice note (data URL) as text, with Whisper on this device (whisper.js; the model loads once, free). */
export async function voiceText(src, { lang = 'de-CH', onprogress = () => {} } = {}) {
  const { transcribe, RATE } = await import('../whisper.js');
  const buf = await (await fetch(src)).arrayBuffer();
  const ctx = new AudioContext({ sampleRate: RATE });
  try {
    const audio = await ctx.decodeAudioData(buf);
    return await transcribe(audio.getChannelData(0), { lang, onprogress });
  } finally {
    ctx.close?.();
  }
}
