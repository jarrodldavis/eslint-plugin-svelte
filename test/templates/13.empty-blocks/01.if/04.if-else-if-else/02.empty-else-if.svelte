<script>
  const enabled = true;
</script>

{#if enabled}
  <p>Enabled</p>
{:else if !enabled}
{:else}
  <p>Something Else</p>
{/if}
