/**
 * v0.113.0 (Noah 12.10.2026: «erst beim zweiten Klick geht das Menü wieder weg»): a small ••• menu
 * closes when a tap or click lands anywhere outside it, the same for every ••• menu. Before, the
 * <details> menus (Bike care «Probleme», bike check before a trip, packing list) and the trip rows'
 * ••• stayed open until their own button was hit again, and an open menu covered the next row's •••.
 * The outside tap still does what it hits (it is not swallowed), like tpl/Menu.svelte.
 *
 * Use as an action on the whole menu (button and box):
 * - `<details class="more" use:away>` closes the <details> by itself;
 * - `<div class="mw" use:away={() => (menu = null)}>` calls the given close for a menu under {#if}.
 */
export function away(node, close) {
  let shut = close;
  const down = (e) => {
    if (node.contains(e.target)) return;
    if (shut) shut();
    else if (node.open) node.open = false;
  };
  document.addEventListener('pointerdown', down, true);
  return {
    update(next) {
      shut = next;
    },
    destroy() {
      document.removeEventListener('pointerdown', down, true);
    },
  };
}
