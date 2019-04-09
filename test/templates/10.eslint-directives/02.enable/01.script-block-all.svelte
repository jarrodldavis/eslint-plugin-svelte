<script>
  /* eslint-disable */
  const first = 2;

  const posts = [];
  /* eslint-enable */
</script>

<div>{first}</div>

{#each posts as snake_case_post}
  <p>{snake_case_post}</p>
{/each}
