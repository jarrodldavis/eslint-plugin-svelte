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
  {:else if random < zero}
    <p>Disabled, Negative</p>
  {/if}
{/if}
