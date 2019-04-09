<script>
  const promise = Promise.resolve("a value");
</script>

{#await promise}
{:then result}
{:catch error}
  <p>Got error: {error}</p>
{/await}
