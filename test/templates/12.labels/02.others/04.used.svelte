<!-- eslint-disable @jarrodldavis/svelte/no-labels -->
<script>
  export let values = [];

  const max = 10;

  label: {

    if (values.length > max) {

      break label;

    }

  }
</script>
