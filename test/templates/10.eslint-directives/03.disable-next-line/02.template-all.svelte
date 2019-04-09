<script>
  const first = 2;

  const posts = [];
</script>

<div>{first}</div>

<!-- eslint-disable-next-line -->
{#each posts as snake_case_post}
  <p>{snake_case_post}</p>
{/each}
