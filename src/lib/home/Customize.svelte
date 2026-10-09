<script>
  /**
   * v0.46.0 «Startseite neu» (Noah 33a): "Customise the start page", a panel on the page itself: each
   * section on or off and one place up or down (buttons, so it works by touch and keyboard alike),
   * and the name for the greeting. Stored in the settings records "homeLayout" and "userName".
   */
  import { db } from '../db.js';
  import { SECTIONS, SECTION_NAME, LAYOUT_KEY, layoutOf, moveSection, toggleSection } from './heute.js';
  import { ArrowUp, ArrowDown } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { layout = null, name = '', onclose } = $props();

  const l = $derived(layoutOf(layout));
  const save = (value) => db.settings.put({ key: LAYOUT_KEY, value });
  // svelte-ignore state_referenced_locally
  let nameIn = $state(name ?? ''); // the field starts with the stored name
  async function saveName(e) {
    e.preventDefault();
    await db.settings.put({ key: 'userName', value: nameIn.trim() });
  }
</script>

<section class="cust" aria-labelledby="cust-h">
  <div class="ch">
    <h2 id="cust-h" class="title">{t('Customise the start page')}</h2>
    <button type="button" class="btn sm" onclick={onclose}>{t('Done|customise')}</button>
  </div>
  <ol>
    {#each l.order as key, i (key)}
      {@const on = !l.off.includes(key)}
      <li data-section={key}>
        <label class="tg"><input type="checkbox" checked={on} onchange={() => save(toggleSection(l, key))} /><span>{t(SECTION_NAME[key])}</span></label>
        <span class="mv">
          <button type="button" class="btn sm ic" disabled={i === 0} onclick={() => save(moveSection(l, key, -1))} aria-label={t('{name} up', { name: t(SECTION_NAME[key]) })}><ArrowUp size={18} aria-hidden="true" /></button>
          <button type="button" class="btn sm ic" disabled={i === SECTIONS.length - 1} onclick={() => save(moveSection(l, key, 1))} aria-label={t('{name} down', { name: t(SECTION_NAME[key]) })}><ArrowDown size={18} aria-hidden="true" /></button>
        </span>
      </li>
    {/each}
  </ol>
  <form class="nm" onsubmit={saveName}>
    <label><span class="lbl">{t('Your name for the greeting')}</span><input class="inp" type="text" bind:value={nameIn} autocomplete="given-name" maxlength="40" /></label>
    <button type="submit" class="btn">{t('Save name')}</button>
  </form>
</section>

<style>
  .cust {
    padding: 16px 18px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--paper);
  }
  .ch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .ch h2 {
    font-size: var(--fs-sub);
  }
  ol {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 52px;
    border-bottom: 1px solid var(--line);
  }
  .tg {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    min-width: 0;
    cursor: pointer;
  }
  .tg input {
    flex: none;
    width: 22px;
    height: 22px;
    accent-color: var(--accent);
  }
  .tg span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .mv {
    display: flex;
    gap: 6px;
    flex: none;
  }
  .ic {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
  }
  .nm {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px 12px;
    margin-top: 12px;
  }
  .nm label {
    flex: 1 1 220px;
  }
</style>
