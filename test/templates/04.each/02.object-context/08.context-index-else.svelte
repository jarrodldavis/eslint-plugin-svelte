<script>
  const posts = [
    {"id": 1,
      "title": "A Blog Post"}
  ];
</script>

{#each posts as {id, title}, index}
  <p>#{index}: {id}: {title}</p>
{:else}
  <p>No posts</p>
{/each}
