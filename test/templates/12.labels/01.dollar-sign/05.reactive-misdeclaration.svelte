<script>
  export let value = 2;

  const doubler = 2;

  $: {

    doubled = value * doubler;

  }
</script>

<div>Doubled: {doubled}</div>
