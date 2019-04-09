<script>
  const postId = 1,
    posts = [
      [
        postId,
        "A Blog Post"
      ]
    ];
</script>

{#each posts as [
  id,
  title
]}
  <p>{id}: {title}</p>
{:else}
  <p>No posts</p>
{/each}
