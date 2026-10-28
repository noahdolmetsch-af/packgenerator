<script>
  /**
   * «Bild pro Sportart» (Noah 27.10.2026 «1a»): the cover on top of a sport's page, like Tennis (P4 TN4).
   * With a photo: the photo, the crop moved up or down. Without: the app's suggestion, the sport's colour with
   * its symbol. The camera button opens the sheet (another photo, move the crop, «Ohne Bild»); taking the photo
   * away offers Undo. sport: the sport (sportsbase.js); color: its colour; line: one short line under the name.
   */
  import { liveQuery } from 'dexie';
  import { Camera, ImagePlus } from '@lucide/svelte';
  import { db } from '../db.js';
  import { COVER_KEY, coverOf, withCover } from './covers.js';
  import { saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import ActIcon from '../flow/ActIcon.svelte';
  import CoverSheet from '../tennis/CoverSheet.svelte';
  import { sportName } from './words.js';
  import { t } from '../i18n.svelte.js';

  let { sport, color = 'var(--line)', line = '' } = $props();
  const q = liveQuery(() => db.settings.get(COVER_KEY));
  const all = $derived($q?.value ?? {});
  const c = $derived(coverOf(all, sport.id));
  const name = $derived(sportName(sport));
  let open = $state(false);

  const put = (value) => db.settings.put({ key: COVER_KEY, value: JSON.parse(JSON.stringify(value)) });
  async function save(v) {
    const before = all;
    try {
      await put(withCover(all, sport.id, v));
      if (c.cover && !v.cover) offerDone(t('Cover photo removed.'), () => put(before));
    } catch (e) {
      saveFailed(e);
    }
  }
</script>

<section class="spc" class:has={!!c.cover} style="--sc:{color}" aria-labelledby="spc-h" data-sport-cover={sport.id}>
  {#if c.cover}
    <img class="img" src={c.cover} alt="" style:object-position="50% {c.y}%" data-cover-img />
  {:else}
    <!-- the app's suggestion: the colour of the sport and its symbol, large and calm -->
    <span class="sugg" aria-hidden="true" data-cover-sugg><ActIcon icon={sport.icon} box={false} size={96} /></span>
  {/if}
  <div class="over">
    <h2 id="spc-h">{name}</h2>
    {#if line}<p class="num">{line}</p>{/if}
  </div>
  <button type="button" class="cam" aria-label={c.cover ? t('Change the cover photo') : t('Add a cover photo')} onclick={() => (open = true)} data-cover-edit>
    {#if c.cover}<Camera size={20} aria-hidden="true" />{:else}<ImagePlus size={20} aria-hidden="true" />{/if}
  </button>
</section>

{#if open}<CoverSheet cover={c.cover} y={c.y} {name} onsave={save} onclose={() => (open = false)} />{/if}

<style>
  .spc {
    position: relative;
    overflow: hidden;
    min-height: 120px;
    border: 1px solid var(--card-line);
    border-left: 6px solid var(--sc);
    border-radius: var(--radius-card);
    background: color-mix(in srgb, var(--sc) 16%, var(--paper));
  }
  .spc.has {
    min-height: 170px;
  }
  .img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .sugg {
    position: absolute;
    right: 64px;
    top: 50%;
    transform: translateY(-50%);
    color: color-mix(in srgb, var(--sc) 55%, var(--paper));
    line-height: 0;
  }
  .over {
    position: absolute;
    left: 0;
    right: 56px;
    bottom: 0;
    padding: 14px 16px;
    color: var(--ink);
    overflow-wrap: break-word;
  }
  .spc.has .over {
    right: 0;
    padding-right: 64px;
    background: linear-gradient(to top, var(--scrim), transparent);
    color: var(--paper);
  }
  .over h2 {
    margin: 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
    color: inherit;
  }
  .over p {
    margin: 2px 0 0;
    font-size: var(--fs-small);
  }
  .cam {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
</style>
