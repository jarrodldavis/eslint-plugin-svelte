<script>
  const titles = ["A Blog Post"];
</script>

{#each titles as post}
{:else}
  <p>No Posts</p>
{/each}
