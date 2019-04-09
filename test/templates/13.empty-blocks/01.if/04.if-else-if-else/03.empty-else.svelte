<script>
  const enabled = true;
</script>

{#if enabled}
  <p>Enabled</p>
{:else if !enabled}
  <p>Disabled</p>
{:else}
{/if}
