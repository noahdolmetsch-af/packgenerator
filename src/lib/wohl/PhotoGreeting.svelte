<script>
  /**
   * Paket P #79 «Fotoalbum» (Noah 19.10.2026 «3a»): a small own photo greets you on Heute, another one
   * at each visit. Only when you added photos (Ich › Was mir gut tut › Fotoalbum) and did not switch it
   * off; without photos nothing shows, Heute stays as it was. Photos stay on this device and in the backup.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { albumOf, greetPhoto, ALBUM_KEY, albumCfgOf } from '../wohl.js';
  import { t } from '../i18n.svelte.js';

  const r = Math.random();
  const q = liveQuery(async () => {
    const [photos, cfg] = await Promise.all([db.photos.toArray(), db.settings.get(ALBUM_KEY)]);
    return { album: albumOf(photos), cfg: albumCfgOf(cfg?.value) };
  });
  const p = $derived($q?.cfg.greet ? greetPhoto($q.album, r) : null);
</script>

{#if p}
  <a class="pg" href="#/me/wohl" data-photo-greeting aria-label={t('Your photo album')}>
    <img src={p.data} alt={p.name || t('Your photo')} />
    {#if p.name}<span>{p.name}</span>{/if}
  </a>
{/if}

<style>
  .pg {
    position: relative;
    display: block;
    border-radius: 14px;
    overflow: hidden;
    margin: 0 0 14px;
    max-height: 150px;
  }
  img {
    display: block;
    width: 100%;
    height: 150px;
    object-fit: cover;
  }
  span {
    position: absolute;
    left: 10px;
    bottom: 8px;
    padding: 2px 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--paper) 85%, transparent);
    color: var(--ink);
    font-size: var(--fs-small);
  }
</style>
