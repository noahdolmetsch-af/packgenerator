<script>
  /**
   * Paket C «Ruhig und persönlich» (Noah 24.10.2026, 996 Ideen «5a»): the overview, one row per sub-page.
   */
  import { Leaf, FlaskConical, Search, Mail, Heart, Award, Share2, Ruler, MessageCircle, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { SUBS, subHash } from './subs.js';

  const ICON = { leaf: Leaf, flask: FlaskConical, search: Search, mail: Mail, heart: Heart, award: Award, share: Share2, ruler: Ruler, message: MessageCircle };
</script>

<ul class="card rh-hub" data-ruhig-hub>
  {#each SUBS as s (s.key)}
    {@const Icon = ICON[s.icon]}
    <li>
      <a class="rh-hrow" href={subHash(s.key)} data-sub={s.key}>
        <span class="rh-ic"><Icon size={18} aria-hidden="true" /></span>
        <span class="rh-t"><b>{t(s.title)}</b><small>{t(s.sub)}</small></span>
        <ChevronRight size={18} aria-hidden="true" />
      </a>
    </li>
  {/each}
</ul>

<style>
  .rh-hub {
    list-style: none;
    margin: 0;
    padding: 4px 0;
  }
  .rh-hub li + li {
    border-top: 1px solid var(--line);
  }
  .rh-hrow {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px var(--sp-4);
    min-height: 56px;
    color: inherit;
    text-decoration: none;
  }
  .rh-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .rh-t {
    flex: 1;
    min-width: 0;
  }
  .rh-t b {
    display: block;
    font-weight: 600;
  }
  .rh-t small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
