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
], index (title)}
  <p>#{index}: {id}: {title}</p>
{/each}
