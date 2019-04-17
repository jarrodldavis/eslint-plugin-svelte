<script>
  const duration300 = 300,
    fade = (node, {duration = duration300}) => ({duration}),
    fadeOptions = {"duration": duration300},
    titles = ["A Blog Post"];
</script>

{#each titles as title @title}
  <div animate:fade="{"fadeOptions"}"></div>
{/each}
