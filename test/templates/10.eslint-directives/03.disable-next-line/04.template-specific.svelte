<script>
  const first = 2;

  const posts = [];
</script>

<div>{first}</div>

<!-- eslint-disable-next-line camelcase -->
{#each posts as snake_case_post}
  <p>{snake_case_post}</p>
{/each}
