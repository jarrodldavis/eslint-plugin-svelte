{#await Promise.resolve("some value")}
  <p>Waiting</p>
{:then result}
  <p>Got result: {result}</p>
{:catch error}
  <p>Got error: {error} {result}</p>
{/await}
