<script>
  const enabled = true;
</script>

{#if enabled}
{:else if !enabled}
{:else}
  <p>Something Else</p>
{/if}
