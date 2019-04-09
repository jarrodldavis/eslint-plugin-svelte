{#await Promise.resolve("some value")}
  <p>Waiting {result}</p>
{:then result}
  <p>Got result: {result}</p>
{:catch error}
  <p>Got error: {error}</p>
{/await}
