<script module>
  import { Flower2, BicepsFlexed, PersonStanding, Accessibility, Footprints, Volleyball, Bike, Goal, Mountain, Dumbbell, Activity, Flame, Waves, TreePine, Heart, Moon, Snowflake, Leaf } from '@lucide/svelte';
  /** v0.51.0 «Im Flow»: the symbols an activity can have (the editor offers them in this order). */
  export const ACT_ICONS = { lotus: Flower2, pushup: BicepsFlexed, stretch: PersonStanding, yoga: Accessibility, run: Footprints, tennis: Volleyball, bike: Bike, hockey: Goal, climb: Mountain, gym: Dumbbell, spin: Activity, sauna: Flame, swim: Waves, walk: TreePine, ski: Snowflake, leaf: Leaf, moon: Moon, heart: Heart };
</script>

<script>
  /** The activity's symbol in a soft square of its ring colour (ring: move | mind | rest). */
  let { icon = 'heart', ring = 'move', size = 18, box = true, dim = false } = $props();
  const Icon = $derived(ACT_ICONS[icon] ?? Heart);
</script>

{#if box}
  <span class="aic {ring}" class:dim aria-hidden="true"><Icon {size} strokeWidth={2} /></span>
{:else}
  <Icon {size} strokeWidth={2} aria-hidden="true" />
{/if}

<style>
  .aic {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }
  .move {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .mind {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .rest {
    background: var(--l3-soft);
    color: var(--l3);
  }
  .dim {
    opacity: 0.55;
  }
</style>
