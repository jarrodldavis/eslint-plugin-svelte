<!-- globals id -->
<script>
  const handler = function handler (event) {

    event.target.id = id.create();

  };
</script>

<button on:click="{handler}">Set ID</button>

<div>{id.current}</div>
