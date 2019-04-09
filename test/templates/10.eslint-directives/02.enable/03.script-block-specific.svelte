<script>
  /* eslint-disable one-var, camelcase */
  const first = 2;
  /* eslint-enable camelcase */

  const posts = [];
</script>

<div>{first}</div>

{#each posts as snake_case_post}
  <p>{snake_case_post}</p>
{/each}
