<script>
  const posts = ["A Blog Post"];
</script>

{#each posts as title, index @title}
  <p>#{index}: {title}</p>
{/each}
