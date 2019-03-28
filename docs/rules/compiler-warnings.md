# Report warnings from the Svelte compiler (compiler-warnings)

The Svelte compiler can emit warnings while parsing templates.

```html
<script>
  export let name;
  const posts = ["A Blog Post"];
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<h1>Hello {name}!</h1>

{#each posts as post} {/each}
```

```sh
$ npm run build

> svelte-app@1.0.0 build /Users/jarrodldavis/source/repos/svelte-app
> rollup -c


src/main.js → public/bundle.js...
(!) svelte plugin: Empty block
src/App.svelte
12: <h1>Hello {name}!</h1>
13:
14: {#each posts as post} {/each}
    ^
15:
created public/bundle.js in 509ms
```

## Rule Details

This rule collects warnings reported by the Svelte compiler and reports them
as ESLint problems.

## Options

```json
{
  "@jarrodldavis/svelte/warnings": [
    "warn",
    {
      "ignore": ["css-unused-selector", "empty-block"]
    }
  ]
}
```

This rule has one option which is an object with one property.

### ignore

An array of compiler warning codes to ignore.

## Processor

You can use the `@jarrodldavis/svelte/individual-warnings` plugin so that
each warning code is reported under a separate rule ID. The main rule must still
be enabled for any compiler warnings to be reported.

Note that this is primarily a stylistic choice for how rules are reported. Due
to how ESLint processors work, the parent rule ID _must_ be used to ignore
individual warning codes via config files or comment directives.

As such, the following **will not work**:

```json
{
  "rules": {
    // this doesn't work!
    "@jarrodldavis/svelte/compiler-warnings/css-unused-selector": "off",
    "@jarrodldavis/svelte/compiler-warnings/empty-block": "off"
  }
}
```

```html
<script>
  export let name;
  const posts = ["A Blog Post"];
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<h1>Hello {name}!</h1>

<!-- this doesn't work! -->
<!-- eslint-disable-next-line @jarrodldavis/svelte/compiler-warnings/empty-block -->
{#each posts as post} {/each}
```

Instead, use the parent rule ID:

```json
{
  "rules": {
    "@jarrodldavis/svelte/warnings": [
      "warn",
      {
        "ignore": ["empty-block"]
      }
    ]
  }
}
```

```html
<script>
  export let name;
  const posts = ["A Blog Post"];
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<h1>Hello {name}!</h1>

<!-- eslint-disable-next-line @jarrodldavis/svelte/compiler-warnings -->
{#each posts as post} {/each}
```
