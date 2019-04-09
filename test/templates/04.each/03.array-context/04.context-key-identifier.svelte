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
] @title}
  <p>{id}: {title}</p>
{/each}
