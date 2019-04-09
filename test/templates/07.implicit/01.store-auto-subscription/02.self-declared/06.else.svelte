<script>
  import {readable} from "svelte/store";

  const posts = readable([]);
</script>

{#each $posts as title}
  <p>{title}</p>
{/each}
