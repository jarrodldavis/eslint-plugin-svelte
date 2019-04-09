<script>
  const promise = Promise.resolve("a value");
</script>

{#await promise}
  <p>Waiting...</p>
{:then result}
  <p>Got result: {result}</p>
{:catch error}
{/await}
