<script>
  const posts = [
    {"id": 1,
      "title": "A Blog Post"}
  ];
</script>

{#each posts as {id, title} @title}
  <p>{id}: {title}</p>
{/each}
