<script>
  import {count} from "./store";

  const min = 0;
</script>

{#if $count > min}
  <p>Positive</p>
{/if}
