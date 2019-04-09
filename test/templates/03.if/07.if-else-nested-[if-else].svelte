<script>
  const enabled = true,
    random = Math.random(),
    zero = 0;
</script>

{#if enabled}
  <p>Enabled</p>
{:else}
  {#if random > zero}
    <p>Disabled, Positive</p>
  {:else}
    <p>Disabled, Not Positive</p>
  {/if}
{/if}
