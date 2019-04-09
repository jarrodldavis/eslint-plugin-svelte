<script>
  const duration300 = 300,
    fade = (node, {duration = duration300}) => ({duration});
</script>

{#each ["A Blog Post"] as post (post.id)}
  <div animate:fade="{fadeOptions}"></div>
{/each}
