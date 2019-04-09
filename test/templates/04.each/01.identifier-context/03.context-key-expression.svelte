<script>
  const posts = ["A Blog Post"];
</script>

{#each posts as title (title)}
  <p>{title}</p>
{/each}
