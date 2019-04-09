<script>
  const enabled = true;
</script>

{#if enabled}
{:else if !enabled}
  <p>Disabled</p>
{/if}
