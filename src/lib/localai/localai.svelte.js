/**
 * «KI im Gerät»: what this device has chosen and loaded. Only in this browser (localStorage + the
 * browser's model cache), never in a backup or in sync: the model belongs to the device.
 */
import { LOCAL_KEY, DEFAULT_MODEL, LOCAL_MODELS } from './models.js';
import { isDownloaded } from './engine.js';

const get = (k) => {
  try {
    return localStorage.getItem(LOCAL_KEY + k);
  } catch {
    return null;
  }
};
const put = (k, v) => {
  try {
    if (v == null) localStorage.removeItem(LOCAL_KEY + k);
    else localStorage.setItem(LOCAL_KEY + k, v);
  } catch {
    /* private mode: only this visit */
  }
};
const known = (k) => (LOCAL_MODELS.some((m) => m.key === k) ? k : DEFAULT_MODEL);
const speedOf = (raw) => {
  try {
    const s = JSON.parse(raw ?? 'null');
    return s && typeof s === 'object' ? s : null;
  } catch {
    return null;
  }
};

/** model: chosen key; ready: its files are on this device; speed: the last check { tps, seconds, device, key }. */
export const local = $state({ model: known(get('model')), ready: false, checked: false, speed: speedOf(get('speed')) });

/** Look whether the chosen model is on the device (called when a place with the button opens). */
export async function refreshLocal() {
  local.ready = await isDownloaded(local.model);
  local.checked = true;
  return local.ready;
}

export function chooseModel(key) {
  local.model = known(key);
  put('model', local.model);
  return refreshLocal();
}

export function saveSpeed(s) {
  local.speed = s ? { ...s, key: local.model } : null;
  put('speed', s ? JSON.stringify(local.speed) : null);
}
