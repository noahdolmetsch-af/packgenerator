/**
 * Paket L «Werkzeugkasten»: what the tools keep on this device (in db.meta, so it is in the backup):
 * the calculator's last lines, the own time-zone places, the last unit choice.
 */
import { db } from '../db.js';

export const TOOL_KEYS = { calc: 'tools.calc', zones: 'tools.zones', units: 'tools.units', phrases: 'tools.phrases' };

export async function loadTool(name, fallback) {
  try {
    const row = await db.meta.get(TOOL_KEYS[name]);
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveTool(name, value) {
  await db.meta.put({ key: TOOL_KEYS[name], value: JSON.parse(JSON.stringify(value)) });
}
