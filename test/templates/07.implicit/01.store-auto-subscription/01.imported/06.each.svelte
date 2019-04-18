<script>
  import {posts} from "./store";
</script>

{#each $posts as title}
  <p>{title}</p>
{/each}
