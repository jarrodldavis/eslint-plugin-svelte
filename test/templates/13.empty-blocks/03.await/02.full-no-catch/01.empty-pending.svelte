<script>
  const promise = Promise.resolve("a value");
</script>

{#await promise}
{:then result}
  <p>Got result: {result}</p>
{/await}
