<script>
  const postId = 1,
    posts = [
      [
        postId,
        "A Blog Post"
      ]
    ];
</script>

{#each posts as [id]}
  <p>Some Title</p>
{/each}
