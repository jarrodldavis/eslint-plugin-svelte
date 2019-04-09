<script>
  export let changeable = 2;

  const double = 2;

  $: reactive = changeable * double;
</script>

<div>Double: {reactive}</div>
