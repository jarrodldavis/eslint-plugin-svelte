<script>
  import {readable} from "svelte/store";

  const number = 0,
    store = readable(number);
</script>

<div id=$count></div>
