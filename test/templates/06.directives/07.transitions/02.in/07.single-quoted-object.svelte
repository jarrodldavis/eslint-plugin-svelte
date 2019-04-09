<script>
  const duration300 = 300,
    fade = (node, {duration = duration300}) => ({duration});
</script>

<div in:fade='{{"duration": 300}}'></div>
