<script>
  const enabled = true;
</script>

{#if enabled}
{:else if !enabled}
  <p>Negative</p>
{:else}
{/if}
