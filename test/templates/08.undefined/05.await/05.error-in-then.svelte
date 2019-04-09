{#await Promise.resolve("some value")}
  <p>Waiting</p>
{:then result}
  <p>Got result: {result} {error}</p>
{:catch error}
  <p>Got error: {error}</p>
{/await}
