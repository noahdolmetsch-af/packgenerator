<script>
  /**
   * Design audit C2: one main button per row, the other answers behind •••. (v0.21.0: own component.)
   * v0.117.0 «Knöpfe neu» (N2, answer 3a): it is ui/MoreActions now: each answer with a title and a
   * one-line explanation (`explain`), on a phone a sheet from the bottom. The API stays:
   * <MoreMenu label="…" actions={[{ name, run, explain?, icon?, current? }]} />.
   */
  import { t } from '../i18n.svelte.js';
  import MoreActions from '../ui/MoreActions.svelte';

  let { label, actions } = $props();
</script>

<MoreActions class="more" title={label} label={t('More answers for {label}', { label })} {actions} small />
