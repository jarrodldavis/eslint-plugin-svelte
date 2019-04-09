<!-- eslint-disable no-console -->
<script>
  export let value = 2;

  const max = 10;

  $: if (value > max) {

    console.log("Tha's a lot:", value);

  }
</script>
