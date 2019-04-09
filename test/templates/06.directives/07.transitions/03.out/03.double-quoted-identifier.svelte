<script>
  const duration300 = 300,
    fade = (node, {duration = duration300}) => ({duration}),
    fadeOptions = {"duration": duration300};
</script>

<div out:fade="{fadeOptions}"></div>
