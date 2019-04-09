<script>
  const random = Math.random(),
    zero = 0;
</script>

{#if random > zero}
  <p>Positive</p>
{:else if random < zero}
  <p>Negative</p>
{:else}
  <p>Zero</p>
{/if}
