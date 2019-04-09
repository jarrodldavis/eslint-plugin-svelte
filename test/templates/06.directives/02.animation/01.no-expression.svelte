<script>
  const duration300 = 300,
    fade = (node, {duration = duration300}) => ({duration}),
    titles = ["A Blog Post"];
</script>

{#each titles as title @title}
  <div animate:fade></div>
{/each}
