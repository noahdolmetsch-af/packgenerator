// P8 «Automatischer Abgleich»: a small fake of the Upstash Redis for /api/sync, used by tests/sync.test.js
// and tests/e2e/abgleich.spec.js. The push script runs as its JavaScript twin (a real Redis checks the
// real script in tests/sync.test.js where redis-server is installed).
import { PUSH_LUA } from '../api/_lib/sync.js';

/** A fake Upstash Redis: the commands /api/sync uses. */
export function fakeRedis() {
  const kv = new Map();
  const hash = (k) => kv.get(k) ?? kv.set(k, new Map()).get(k);
  const run = (cmd, a) => {
    switch (cmd) {
      case 'GET':
        return kv.get(a[0]) ?? null;
      case 'SET': // Paket S «Reise-Spur» (api/spur.js): SET k v [EX s]
        kv.set(a[0], a[1]);
        return 'OK';
      case 'INCR': {
        const v = Number(kv.get(a[0]) ?? 0) + 1;
        kv.set(a[0], String(v));
        return v;
      }
      case 'HGET':
        return hash(a[0]).get(a[1]) ?? null;
      case 'HSET':
        hash(a[0]).set(a[1], a[2]);
        return 1;
      case 'HMGET':
        return a.slice(1).map((f) => hash(a[0]).get(f) ?? null);
      case 'ZADD':
        hash(a[0]).set(a[2], Number(a[1]));
        return 1;
      case 'ZRANGEBYSCORE': {
        const min = Number(String(a[1]).replace('(', ''));
        const limit = a.includes('LIMIT') ? Number(a[a.indexOf('LIMIT') + 2]) : Infinity;
        const rows = [...hash(a[0])].filter(([, s]) => s > min).sort((x, y) => x[1] - y[1]).slice(0, limit);
        return rows.flatMap(([k, s]) => [k, String(s)]);
      }
      case 'EXPIRE':
        return 1;
      case 'DEL':
        a.forEach((k) => kv.delete(k));
        return a.length;
      case 'EVAL': {
        // the JavaScript twin of PUSH_LUA
        if (a[0] !== PUSH_LUA) throw new Error('fake redis: unknown script');
        const [data, log, seq] = a.slice(2, 5);
        const count = Number(a[6]);
        const out = [];
        for (let i = 0; i < count; i++) {
          const [k, base, e] = a.slice(7 + i * 3, 10 + i * 3);
          const cur = run('HGET', [data, k]);
          const cs = cur ? Number(cur.split(':')[0]) : 0;
          if (cs > Number(base)) out.push('c', k, String(cs));
          else {
            const s = run('INCR', [seq]);
            run('HSET', [data, k, `${s}:${e}`]);
            run('ZADD', [log, s, k]);
            out.push('o', k, String(s));
          }
        }
        return out;
      }
      default:
        throw new Error(`fake redis: ${cmd}`);
    }
  };
  return { kv, run };
}
