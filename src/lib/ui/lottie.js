// «Neuer Schwung» Teil 2b (Noah 26.10.2026 «5b»: Lottie for big moments): a tiny Lottie animation plays once
// in place of a still icon. The player (lottie-web light, about 170 KB) and the animation load only on first
// use. With «reduce motion», without the browser API or when loading fails, the still icon simply stays.

/** Svelte action: play the animation `load` (a function returning the JSON module) once inside `node`. */
export function lottie(node, load) {
  let anim = null;
  let gone = false;
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!still && load) {
    Promise.all([import('lottie-web/build/player/lottie_light.js'), load()])
      .then(([player, data]) => {
        if (gone) return;
        const lib = player.default ?? player;
        anim = lib.loadAnimation({ container: node, renderer: 'svg', loop: false, autoplay: true, animationData: data.default ?? data });
        node.dataset.lottie = 'on';
      })
      .catch(() => {});
  }
  return {
    destroy() {
      gone = true;
      anim?.destroy();
    },
  };
}
