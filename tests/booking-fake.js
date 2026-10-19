// Termine buchen: a small Redis in memory for the tests of api/booking.js (vitest and the browser test).
// Only the commands the booking server uses.
export function fakeRedis() {
  const kv = new Map();
  const hs = new Map();
  const h = (k) => (hs.has(k) ? hs.get(k) : hs.set(k, new Map()).get(k));
  const run = ([c, ...a]) => {
    switch (c) {
      case 'GET': return kv.get(a[0]) ?? null;
      case 'SET': if (a.includes('NX') && kv.has(a[0])) return null; kv.set(a[0], a[1]); return 'OK';
      case 'DEL': kv.delete(a[0]); return 1;
      case 'MGET': return a.map((k) => kv.get(k) ?? null);
      case 'INCR': case 'INCRBY': case 'DECRBY': {
        const n = (Number(kv.get(a[0])) || 0) + (c === 'INCR' ? 1 : c === 'INCRBY' ? Number(a[1]) : -Number(a[1]));
        kv.set(a[0], String(n));
        return n;
      }
      case 'EXPIRE': return 1;
      case 'HSET': h(a[0]).set(a[1], a[2]); return 1;
      case 'HGET': return h(a[0]).get(a[1]) ?? null;
      case 'HDEL': return h(a[0]).delete(a[1]) ? 1 : 0;
      case 'HLEN': return h(a[0]).size;
      case 'HGETALL': return [...h(a[0])].flat();
      default: throw new Error(`no ${c}`);
    }
  };
  return { kv, hs, run };
}
