<script>
  const duration300 = 300,
    fade = (node, {duration = duration300}) => ({duration});
</script>

<div transition:fade="{{"duration": 300}}"></div>
