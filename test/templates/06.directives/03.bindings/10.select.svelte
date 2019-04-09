<script>
  const value = "some value";
</script>

<select bind:value>
  <option value=""></option>
  <option value={value}>{value}</option>
</select>
