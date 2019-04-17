<script>
  const posts = ["A Blog Post"];
</script>

{#each posts as post, index}
  <p>#{index}: {post}</p>
{:else}
  <p>No posts: {index}</p>
{/each}
