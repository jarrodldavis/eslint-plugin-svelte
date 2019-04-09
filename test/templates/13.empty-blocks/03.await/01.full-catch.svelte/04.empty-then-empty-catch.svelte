<script>
  const promise = Promise.resolve("a value");
</script>

{#await promise}
  <p>Waiting...</p>
{:then result}
{:catch error}
{/await}
