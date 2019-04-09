<script>
  const titles = ["A Blog Post"];
</script>

{#each titles as post}
  <p>{post}</p>
{:else}
{/each}
