{#await promise}
  <p>Waiting</p>
{:then result}
  <p>Got result: {result}</p>
{:catch error}
  <p>Got error: {error}</p>
{/await}
