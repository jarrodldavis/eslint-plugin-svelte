<script>
  const enabled = true,
    random = Math.random(),
    zero = 0;
</script>

{#if enabled}
  {#if random > zero}
    <p>Enabled, Positive</p>
  {/if}
{:else}
  {#if random > zero}
    <p>Disabled, Positive</p>
  {/if}
{/if}
