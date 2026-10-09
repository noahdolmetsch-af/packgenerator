/**
 * v0.45.2: the database side of problems with a bike (problems.js is the pure part).
 * Changing the way to fix a problem: "Part needed" puts it on the wishlist (the shopping list),
 * leaving "Part needed" takes the wishlist entry away again if it is still only a wish.
 */
import { db } from './db.js';
import { nextId } from './gear.js';
import { problemWish } from './problems.js';

/** Make the wish for a repair that needs a part; returns the item id or null. */
export async function wishForProblem(repair, bike) {
  const items = await db.items.toArray();
  const item = problemWish(repair, bike, items, nextId(items, 'bike'));
  if (!item) return null;
  await db.items.put(item);
  return item.id;
}

/** Set repair.fix; keeps repair.wishId in step with "Part needed". */
export async function setFix(repair, fix, bike) {
  await db.transaction('rw', db.maintenance, db.items, async () => {
    const r = await db.maintenance.get(repair.id);
    if (!r) return;
    let wishId = r.wishId ?? null;
    if (fix === 'part' && !wishId && bike) wishId = await wishForProblem(r, bike);
    if (fix !== 'part' && wishId) {
      const w = await db.items.get(wishId);
      if (w?.ownership === 'wishlist') await db.items.delete(wishId);
      wishId = null;
    }
    await db.maintenance.update(r.id, { fix, wishId });
  });
}
