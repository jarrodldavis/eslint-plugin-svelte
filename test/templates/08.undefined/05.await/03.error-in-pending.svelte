{#await Promise.resolve("some value")}
  <p>Waiting {error}</p>
{:then result}
  <p>Got result: {result}</p>
{:catch error}
  <p>Got error: {error}</p>
{/await}
