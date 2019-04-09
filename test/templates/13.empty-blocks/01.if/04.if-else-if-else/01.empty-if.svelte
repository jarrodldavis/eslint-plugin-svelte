<script>
  const enabled = true;
</script>

{#if enabled}
{:else if !enabled}
  <p>Disabled</p>
{:else}
  <p>Something Else</p>
{/if}
