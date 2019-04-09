<script>
  const posts = ["A Blog Post"];
</script>

{#each posts as post}
  <p>{post}</p>
{:else}
  <p>No posts: {post}</p>
{/each}
