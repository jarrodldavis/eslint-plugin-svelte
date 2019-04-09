<script>
  const duration300 = 300,
    fadeOptions = {"duration": duration300};
</script>

{#each ["A Blog Post"] as post (post.id)}
  <div animate:fade={fadeOptions}></div>
{/each}
