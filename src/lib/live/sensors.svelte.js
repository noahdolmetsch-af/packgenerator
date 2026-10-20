/**
 * Sensoren verbinden (Noah 20.10.2026 «Kann ich meinen Sensor da verbinden und den Wert gleich anzeigen
 * lassen, Herzfrequenz»): heart rate belts and watches that send their pulse, power meters and cadence
 * sensors over Bluetooth (Web Bluetooth: Chrome on Android and the desktop; not on an iPhone).
 *
 * The browser asks once which device (its own window); the values come in as they are sent. When the
 * connection drops (out of range, sensor asleep) the app tries again by itself for a few minutes.
 * The values of a running recording are kept with it (recorder addSensor). The message parsing is in ble.js.
 */
import { KINDS, parseHeartRate, parsePower, parseCsc, cadenceOf } from './ble.js';

export const sensors = $state({ hr: null, power: null, cadence: null, at: { hr: 0, power: 0, cadence: 0 }, list: [] });

/** Can this browser talk to Bluetooth sensors? */
export const canBluetooth = () => typeof navigator !== 'undefined' && !!navigator.bluetooth?.requestDevice;

const STALE_MS = 10_000; // a value older than this is not shown
/** The value of a kind when it is fresh, else null. */
export const fresh = (kind, now = Date.now()) => (sensors[kind] != null && now - (sensors.at[kind] ?? 0) < STALE_MS ? sensors[kind] : null);

let listeners = [];
/** Listen to every new value: fn(kind, value, at). Returns the off function. */
export function onValue(fn) {
  listeners.push(fn);
  return () => (listeners = listeners.filter((f) => f !== fn));
}
const put = (kind, value) => {
  const at = Date.now();
  sensors[kind] = value;
  sensors.at = { ...sensors.at, [kind]: at };
  for (const f of listeners) f(kind, value, at);
};

const devices = new Map(); // id → { device, kind, char, tries, crank }

function setStatus(id, status) {
  sensors.list = sensors.list.map((x) => (x.id === id ? { ...x, status } : x));
}

function handler(entry) {
  return (e) => {
    const dv = e.target.value;
    if (entry.kind === 'hr') {
      const bpm = parseHeartRate(dv);
      if (bpm != null) put('hr', bpm);
      return;
    }
    const m = entry.kind === 'power' ? parsePower(dv) : parseCsc(dv);
    if (!m) return;
    if (entry.kind === 'power') put('power', m.watts);
    if (m.crank) {
      const rpm = cadenceOf(entry.crank, m.crank);
      entry.crank = m.crank;
      if (rpm != null) put('cadence', rpm);
    }
  };
}

async function link(entry) {
  const k = KINDS[entry.kind];
  setStatus(entry.device.id, 'connecting');
  const server = await entry.device.gatt.connect();
  const service = await server.getPrimaryService(k.service);
  const char = await service.getCharacteristic(k.char);
  entry.char = char;
  entry.onData ??= handler(entry);
  char.addEventListener('characteristicvaluechanged', entry.onData);
  await char.startNotifications();
  entry.tries = 0;
  setStatus(entry.device.id, 'on');
}

async function again(entry) {
  if (!devices.has(entry.device.id)) return; // disconnected on purpose
  setStatus(entry.device.id, 'lost');
  if (entry.tries >= 20) return; // about 5 minutes: then «Connect again» by hand
  entry.tries += 1;
  setTimeout(() => link(entry).catch(() => again(entry)), 15_000);
}

/**
 * Connect a sensor of a kind ('hr' | 'power' | 'cadence'). Opens the browser's own device window.
 * Returns '' or an error key for t().
 */
export async function connectSensor(kind) {
  if (!canBluetooth()) return 'This browser cannot connect Bluetooth sensors. Chrome on Android or on a computer can.';
  const k = KINDS[kind];
  if (!k) return 'Unknown sensor.';
  let device;
  try {
    device = await navigator.bluetooth.requestDevice({ filters: [{ services: [k.service] }] });
  } catch (e) {
    return e?.name === 'NotFoundError' ? '' : 'The sensor could not be connected. Is it on and near?';
  }
  if (devices.has(device.id)) return '';
  const entry = { device, kind, char: null, tries: 0, crank: null, onData: null };
  devices.set(device.id, entry);
  sensors.list = [...sensors.list, { id: device.id, name: device.name || '', kind, status: 'connecting' }];
  device.addEventListener('gattserverdisconnected', () => again(entry));
  try {
    await link(entry);
    return '';
  } catch {
    setStatus(device.id, 'lost');
    return 'The sensor could not be connected. Is it on and near?';
  }
}

/** Connect a lost sensor again by hand. */
export async function reconnectSensor(id) {
  const entry = devices.get(id);
  if (!entry) return '';
  entry.tries = 0;
  try {
    await link(entry);
    return '';
  } catch {
    setStatus(id, 'lost');
    return 'The sensor could not be connected. Is it on and near?';
  }
}

/** Disconnect a sensor and forget it here. */
export function disconnectSensor(id) {
  const entry = devices.get(id);
  devices.delete(id);
  sensors.list = sensors.list.filter((x) => x.id !== id);
  if (!entry) return;
  try {
    entry.char?.removeEventListener('characteristicvaluechanged', entry.onData);
    entry.device.gatt?.disconnect();
  } catch {
    /* already gone */
  }
  if (![...devices.values()].some((d) => d.kind === entry.kind || (entry.kind === 'power' && d.kind === 'cadence'))) {
    sensors[entry.kind] = null;
    if (entry.kind === 'power') sensors.cadence = null;
  }
}
