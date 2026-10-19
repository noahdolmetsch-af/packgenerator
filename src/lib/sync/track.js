/**
 * P8 «Automatischer Abgleich»: every save of a data record leaves a small note in the meta table, in
 * the same database step as the save itself (a Dexie middleware, so a note can never get lost when the
 * app closes right after a save):
 *
 *   meta 'sync|<table>|<id as JSON>' → { t, id, at, del, dirty, base }
 *     at:    when this device last changed the record (ISO), its «changedAt»
 *     del:   true when the record was deleted (a «tombstone», so the other device deletes it too)
 *     dirty: 1 while the change still has to go to the server
 *     base:  the server's version number this device last had of the record (0 = never)
 *
 * The records themselves stay exactly as they are (no new field, no schema change, backups unchanged).
 * The meta table is never exported. The sync engine (engine.js) reads and clears these notes.
 */

export const NOTE = 'sync|';
export const noteKey = (table, id) => `${NOTE}${table}|${JSON.stringify(id)}`;

/** Register the middleware. Call before the database opens (db.js createDb does). */
export function trackSync(db, { tables, skip = () => false, now = () => new Date().toISOString() }) {
  const tracked = new Set(tables);
  db.use({
    stack: 'dbcore',
    name: 'pg-sync-notes',
    create(down) {
      return {
        ...down,
        // every writing step that touches a data table also may write the notes
        transaction(stores, mode, options) {
          const add = mode === 'readwrite' && stores.some((s) => tracked.has(s)) && !stores.includes('meta');
          return down.transaction(add ? [...stores, 'meta'] : stores, mode, options);
        },
        table(name) {
          const table = down.table(name);
          if (!tracked.has(name)) return table;
          const pk = table.schema.primaryKey;
          const meta = down.table('meta');
          const note = async (trans, ids, del) => {
            const list = ids.filter((id) => id != null && !skip(name, id));
            if (!list.length) return;
            const keys = list.map((id) => noteKey(name, id));
            const old = await meta.getMany({ trans, keys });
            const at = now();
            const values = list.map((id, i) => ({ key: keys[i], t: name, id, at, del, dirty: 1, base: old[i]?.base ?? 0 }));
            await meta.mutate({ type: 'put', trans, values });
          };
          return {
            ...table,
            async mutate(req) {
              let gone = null;
              if (req.type === 'deleteRange') {
                // table.clear() or a range delete: find the ids first, they become tombstones
                const r = await table.query({ trans: req.trans, values: false, query: { index: pk, range: req.range } });
                gone = r.result;
              }
              const res = await table.mutate(req);
              const failed = (i) => res.failures && res.failures[i] !== undefined;
              if (req.type === 'add' || req.type === 'put') {
                const ids = req.values.map((v, i) => (failed(i) ? null : (req.keys?.[i] ?? res.results?.[i] ?? pk.extractKey?.(v))));
                await note(req.trans, ids, false);
              } else if (req.type === 'delete') {
                await note(req.trans, req.keys, true);
              } else if (gone) {
                await note(req.trans, gone, true);
              }
              return res;
            },
          };
        },
      };
    },
  });
}
