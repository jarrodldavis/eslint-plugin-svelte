<!-- eslint-disable -->
<script>
  const first = 2;

  const posts = [];
</script>

<div>{first}</div>

{#each posts as snake_case_post}
<!-- eslint-enable -->
  <p>{snake_case_post}</p>
{/each}
