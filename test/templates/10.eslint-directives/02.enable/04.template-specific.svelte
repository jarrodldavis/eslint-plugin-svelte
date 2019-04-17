<!-- eslint-disable one-var, camelcase -->
<script>
  const first = 2;

  const posts = [];
</script>

<div>{first}</div>

{#each posts as snake_case_post}
<!-- eslint-enable camelcase -->
  <p>{snake_case_post}</p>
{/each}
