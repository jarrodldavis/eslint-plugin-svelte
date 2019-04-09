<!-- eslint-disable no-console, one-var -->
<script>
  import {calculate} from "./utils";
  export let value = 2;

  let calculated = calculate(value);

  $: {

    console.log("New Value:", value);
    console.log("Old Caluclated:", calculated);
    calculated = calculate;
    console.log("New Caluclated:", calculated);

  }
</script>
