<script>
  /**
   * Paket D «Mit Freunden» (Noah 24.10.2026 «3b», 17 ideas of the 996 list): Ich › Mit Freunden
   * (#/me/freunde). Three parts, each a tab: «Freunde fragen» (friends add their part to a trip, a
   * place, a photo, the difficulty, the costs, the flat handover, the packing, a workshop day),
   * «Leihregal für Freunde» (lend, swap, give; shared and borrowed gear) and «Vorlage teilen» (a
   * building block, your layout). No account and no server: everything travels in a link or a small
   * file you send yourself. A friend's answer comes back the same way and is kept as their own
   * contribution, with name and date; your own entries never change.
   * #/me/freunde/in/<code> opens a message (what a friend sent you, or what you got from a friend).
   */
  import { untrack } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { t } from '../lib/i18n.svelte.js';
  import { ME_KEY, TOPICS, FRIENDS_HASH, codeOf, readFileText } from '../lib/freunde/freunde.js';
  import { decodeEnvelope } from '../lib/freunde/code.js';
  import { putKey } from '../lib/freunde/store.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import AskForm from '../lib/freunde/AskForm.svelte';
  import Incoming from '../lib/freunde/Incoming.svelte';
  import Notes from '../lib/freunde/Notes.svelte';
  import Shelf from '../lib/freunde/Shelf.svelte';
  import Templates from '../lib/freunde/Templates.svelte';
  import ContactCard from '../lib/freunde/ContactCard.svelte';
  import { Users, BookOpen, Package, LayoutTemplate, FileUp, ChevronRight, Contact } from '@lucide/svelte';
  import '../lib/freunde/freunde.css';

  let { hash = '' } = $props();
  const meQ = liveQuery(() => db.settings.get(ME_KEY));
  const me = $derived(typeof $meQ?.value === 'string' ? $meQ.value : '');
  let myName = $state('');
  let nameSeen = false;
  $effect(() => {
    if (!nameSeen && $meQ !== undefined) {
      myName = me;
      nameSeen = true;
    }
  });
  const saveMe = () => myName.trim() !== me && putKey(ME_KEY, myName.trim()).catch(() => {});

  const TABS = [
    { key: 'ask', title: 'Ask friends', icon: Users },
    { key: 'shelf', title: 'Lending shelf for friends', icon: Package },
    { key: 'tpl', title: 'Share a template', icon: LayoutTemplate },
    { key: 'card', title: 'Contact card', icon: Contact }, // Gruppenfahrt für Events (Noah 26.10.2026 «5a»)
  ];
  const tabOf = (h) => new URLSearchParams(String(h).split('?')[1] ?? '').get('tab');
  const first = untrack(() => tabOf(hash));
  let tab = $state(TABS.some((x) => x.key === first) ? first : 'ask');
  function go(k) {
    tab = k;
    history.replaceState(history.state, '', k === 'ask' ? FRIENDS_HASH : `${FRIENDS_HASH}?tab=${k}`);
  }
  let topic = $state('');

  /* a message from a link or a file */
  let env = $state.raw(null);
  let broken = $state(false);
  $effect(() => {
    const code = codeOf(hash);
    if (!code) return;
    let gone = false;
    decodeEnvelope(code).then((e) => {
      if (gone) return;
      env = e;
      broken = !e;
    });
    return () => (gone = true);
  });
  function closeIn() {
    env = null;
    broken = false;
    if (!codeOf(location.hash)) return;
    // the address without the message; the app hears it, so the same link opens again later
    history.replaceState(history.state, '', FRIENDS_HASH);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
  let fileEl = $state(null);
  async function openFile(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    const got = f.size < 8_000_000 ? readFileText(await f.text()) : null;
    env = got;
    broken = !got;
  }
  const groups = [
    { key: 'tell', title: 'Tell together' },
    { key: 'tour', title: 'Before a tour together' },
    { key: 'pack', title: 'Pack and work together' },
  ];
</script>

<div class="page fr-page" data-fr-page>
  <PathHead crumbs={[{ label: t('Me|place'), href: '#/me' }]} title={t('With friends')} sub={t('Share with the people you choose, without an account')} />

  {#if env || broken}
    <div class="fr-in">
      {#if broken}
        <section class="fr-card" role="alert">
          <h2 class="title">{t('Link broken')}</h2>
          <p>{t('This message could not be read. Ask your friend to send it again.')}</p>
          <button type="button" class="btn" onclick={closeIn}>{t('Close')}</button>
        </section>
      {:else}
        <Incoming {env} {me} ondone={closeIn} />
      {/if}
    </div>
  {/if}

  <p class="fr-intro">{t('Friends add their part as their own entry, with their name and the day; nothing of yours is changed. Everything goes as a link or a small file that you send yourself, only to whom you choose.')}</p>

  <!-- Mini-Tools (Noah 28.10.2026 «2a»): their own page, reached from here too -->
  <p class="fr-intro"><a href="#/me/mini" data-fr-mini>{t('Find a date with others: Mini tools')} ›</a></p>

  <nav class="fr-tabs" aria-label={t('With friends')}>
    {#each TABS as x (x.key)}
      {@const Icon = x.icon}
      <button type="button" class="fr-tab" class:on={tab === x.key} aria-pressed={tab === x.key} onclick={() => go(x.key)} data-fr-tab={x.key}><Icon size={18} aria-hidden="true" /><span>{t(x.title)}</span></button>
    {/each}
  </nav>

  <div class="fr-me">
    <label class="fr-f"><span>{t('Your name for friends')}</span><input bind:value={myName} onblur={saveMe} placeholder={t('e.g. your first name')} data-fr-me /></label>
    <button type="button" class="btn" onclick={() => fileEl?.click()}><FileUp size={16} aria-hidden="true" />{t('Open a file')}</button>
    <input type="file" accept=".json,application/json" hidden bind:this={fileEl} onchange={openFile} />
  </div>

  {#if tab === 'ask'}
    {#if topic}
      {#key topic}<AskForm {topic} me={me || myName.trim()} onclose={() => (topic = '')} />{/key}
    {:else}
      {#each groups as g (g.key)}
        <section class="fr-sec" aria-labelledby="fr-g-{g.key}">
          <h2 id="fr-g-{g.key}" class="fr-gh">{t(g.title)}</h2>
          <ul class="fr-topics">
            {#each TOPICS.filter((x) => x.group === g.key) as x (x.key)}
              <li><button type="button" class="fr-topic" onclick={() => (topic = x.key)} data-fr-topic={x.key}><span><b>{t(x.title)}</b><small>{t(x.hint)}</small></span><ChevronRight size={18} aria-hidden="true" /></button></li>
            {/each}
          </ul>
        </section>
      {/each}
    {/if}
    <Notes me={me || myName.trim()} />
  {:else if tab === 'shelf'}
    <Shelf me={me || myName.trim()} />
  {:else if tab === 'tpl'}
    <Templates me={me || myName.trim()} />
  {:else}
    <ContactCard me={me || myName.trim()} />
  {/if}

  <p class="fr-fine"><BookOpen size={14} aria-hidden="true" /> {t('Signing in with Google for friends comes later; all of this works already without it.')}</p>
</div>
