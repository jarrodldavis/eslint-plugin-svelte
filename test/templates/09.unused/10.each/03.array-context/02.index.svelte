<script>
  const postId = 1,
    posts = [
      [
        postId,
        "A Blog Post"
      ]
    ];
</script>

{#each posts as [id], index}
  <p>{id}</p>
{/each}
