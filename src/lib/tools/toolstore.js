/**
 * Paket L «Werkzeugkasten»: what the tools keep (in db.settings, so it goes into the backup and the
 * sync): the calculator's last lines, the own time-zone places, the last unit and language choice.
 */
import { db } from '../db.js';

export const TOOL_KEYS = { calc: 'tools.calc', zones: 'tools.zones', units: 'tools.units', phrases: 'tools.phrases', money: 'tools.money', level: 'tools.level', gears: 'tools.gears', qr: 'tools.qr', chains: 'tools.chains', map: 'tools.map' };

export async function loadTool(name, fallback) {
  try {
    const row = await db.settings.get(TOOL_KEYS[name]);
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function saveTool(name, value) {
  await db.settings.put({ key: TOOL_KEYS[name], value: JSON.parse(JSON.stringify(value)) });
}
