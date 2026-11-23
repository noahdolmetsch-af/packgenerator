/**
 * «Eingaben überall»: the templates of every place in settings 'inputTemplates' (inputs.js TEMPLATES_KEY),
 * and a voice note turned into text on this device.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { TEMPLATES_KEY, withTemplates } from './inputs.js';

export const templatesQuery = (db = appDb) => liveQuery(async () => (await db.settings.get(TEMPLATES_KEY))?.value ?? {});

/** The templates of one place saved (the others kept). */
export async function saveTemplates(place, list, db = appDb) {
  const had = (await db.settings.get(TEMPLATES_KEY))?.value ?? {};
  await db.settings.put({ key: TEMPLATES_KEY, value: withTemplates(had, place, list) });
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
