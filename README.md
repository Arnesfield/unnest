# unnest

Flatten nested objects to table rows.

```typescript
// JavaScript
const table = unnest(items).by(property);

// TypeScript
const table: Table<Schema> = unnest(items).by<Schema>(property);
```

## Example

Here is a basic example of `unnest`ing a nested object:

```javascript
const user = {
  email: 'john.doe@foo.bar',
  animals: [
    { type: 'cat', food: ['fish', 'meat'] },
    { type: 'frog', food: ['insects'] }
  ]
};

// use `unnest` to flatten the object:
const table = unnest(user).by({ animals: { food: true } });
const rows = table.rows();
console.log(rows);
```

Output:

> **Note**: Most of the actual output structure is omitted for brevity.

```javascript
[
  { root: /* user */, animals: /* cat  */, food: /* fish    */ },
  { /* undefined   */ /* undefined      */ food: /* meat    */ },
  { /* undefined   */ animals: /* frog */, food: /* insects */ },
]
```

Using a table, the result would look something like this:

| root | animals | food    |
| ---- | ------- | ------- |
| user | cat     | fish    |
|      |         | meat    |
|      | frog    | insects |
