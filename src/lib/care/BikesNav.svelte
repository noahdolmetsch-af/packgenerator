<script>
  /** Switch between the bike setup and Bike care (both live under "Bikes"). */
  let { current } = $props();
</script>

<nav class="subnav" aria-label="Bikes">
  <a href="#/bikes" aria-current={current === 'setup' ? 'page' : undefined}>Setup</a>
  <a href="#/care" aria-current={current === 'care' ? 'page' : undefined}>Care</a>
</nav>

<style>
  .subnav {
    display: inline-flex;
    border: 2px solid var(--ink);
    border-radius: 6px;
    overflow: hidden;
  }
  a {
    padding: 6px 16px;
    font: 700 15px var(--font-body);
    color: var(--ink);
    text-decoration: none;
    background: var(--paper);
  }
  a + a {
    border-left: 2px solid var(--ink);
  }
  a[aria-current='page'] {
    background: var(--ink);
    color: var(--paper);
  }
</style>
