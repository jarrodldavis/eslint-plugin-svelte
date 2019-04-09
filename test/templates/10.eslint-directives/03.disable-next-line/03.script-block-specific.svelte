<script>
  const first = 2;

  /* eslint-disable-next-line one-var */
  const posts = [];
</script>

<div>{first}</div>

{#each posts as snake_case_post}
  <p>{snake_case_post}</p>
{/each}
