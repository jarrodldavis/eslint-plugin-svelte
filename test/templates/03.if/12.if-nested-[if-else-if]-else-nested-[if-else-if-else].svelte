<script>
  const enabled = true,
    random = Math.random(),
    zero = 0;
</script>

{#if enabled}
  {#if random > zero}
    <p>Enabled, Positive</p>
  {:else if random < zero}
    <p>Enabled, Negative</p>
  {/if}
{:else}
  {#if random > zero}
    <p>Disabled, Positive</p>
  {:else if random < zero}
    <p>Disabled, Negative</p>
  {:else}
    <p>Disabled, Zero</p>
  {/if}
{/if}
