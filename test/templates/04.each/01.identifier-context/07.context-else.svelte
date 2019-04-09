<script>
  const posts = ["A Blog Post"];
</script>

{#each posts as title}
  <p>{title}</p>
{:else}
  <p>No posts</p>
{/each}
