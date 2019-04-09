<script>
  const posts = [
    {"id": 1,
      "title": "A Blog Post"}
  ];
</script>

{#each posts as {id} @id}
  <p>Some Title</p>
{/each}
