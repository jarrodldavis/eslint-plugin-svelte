<script>
  const posts = [
    {"id": 1,
      "title": "A Blog Post"}
  ];
</script>

{#each posts as {id}, index}
  <p>{id}</p>
{/each}
