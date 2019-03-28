# Report warnings from the Svelte compiler (warnings)

The Svelte compiler can emit warnings while parsing templates.
This rule allows those warnings to be presented as ESLint problems.

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
