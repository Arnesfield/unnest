# unnest

Flatten nested objects to table rows.

```javascript
const { unnest } = require('@arnesfield/unnest');
```

```javascript
const table = unnest(items).by(property);
const rows = table.rows();
const data = table.data();
```

Using `TypeScript`:

```typescript
const table: Table<Schema> = unnest(items).by<Schema>(property);
```

> **Tip**: Setting the `Schema` generic type should improve typings for `Row`s, `Cell`s, and `RowData`.

## Installation

```sh
npm install @arnesfield/unnest
```

## Usage

Here is a basic example of `unnest`ing a nested object:

```javascript
const user = {
  email: 'john.doe@foo.bar',
  animals: [
    { type: 'cat', food: ['fish', 'meat'] },
    { type: 'frog', food: ['insects'] }
  ]
};
```

Use `unnest` to flatten the object:

```javascript
const table = unnest(user).by({
  animals: {
    food: true
  }
});
```

> **Tip**: Notice that the structure of the `property` value is similar to the nested object.

The `table` contains the `Row`s or `RowData` of the `unnest`ed object:

```javascript
// get rows
const rows = table.rows();

// get data
const data = table.data();
```

Output of `table.data()`:

> **Note**: Most of the actual output structure is omitted for brevity.

```javascript
[
  { root: /* user */, animals: /* cat */,  food: /* fish */    },
  {                                        food: /* meat */    },
  {                   animals: /* frog */, food: /* insects */ },
]
```

Using a table, the result would look something like this:

| root | animals | food    |
| ---- | ------- | ------- |
| user | cat     | fish    |
|      |         | meat    |
|      | frog    | insects |

If you're using `TypeScript`, the `Schema` type (similar to `RowData`) would look something like this:

```typescript
interface Schema {
  root: User;
  animals: Animal;
  food: Food;
}
```

### `unnest` function and `Property`

The `unnest` function takes in the data (array or object) and calling `.by(property)` returns a `table`:

```javascript
const table = unnest(data).by(property);
```

The `property` value structure is based on the data passed to the `unnest` function.

```typescript
type PropertyValue = string | boolean | Property;

interface Property {
  // name of the property, defaults to the object property key or `root`
  name?: string;

  // other properties based on the data
  [property]: PropertyValue;
}
```

Consider the following interface:

```typescript
interface User {
  email: string;
  aliases: string[];
  animals: {
    type: string;
    food: {
      kind: string;
      value: string[];
    }[];
  }[];
  groups?: {
    title: string;
    members: string[];
  }[];
}
```

The `property` value type may look like the following depending on how you want to `unnest` the object:

```javascript
{
  // name: string,
  email: PropertyValue,
  aliases: PropertyValue,
  animals: {
    // name: string,
    type: PropertyValue,
    food: {
      // name: string,
      kind: PropertyValue,
      value: PropertyValue
    }
  },
  groups: {
    // name: string,
    title: PropertyValue,
    members: PropertyValue
  }
}
```

Each specified property will be included in the `Row` and `RowData` object.

### Custom Column Name (`property.name`)

By default, the object property keys are used as the default column name (`root` is the default for the main object) similar to our example output a while back:

| root | animals | food    |
| ---- | ------- | ------- |
| user | cat     | fish    |
|      |         | meat    |
|      | frog    | insects |

Notice that the column names are `root`, `animals`, and `food`.

You can configure the column names by using the `name` property, or pass it as the property value:

```javascript
const table = unnest(user).by({
  // root -> owner
  name: 'owner',
  animals: {
    // animals -> pet
    name: 'pet',
    // food -> treat
    food: 'treat' // can also be `food: { name: 'treat' }`
  }
});
```

Output of `table.data()` using a table:

| owner | pet  | treat   |
| ----- | ---- | ------- |
| user  | cat  | fish    |
|       |      | meat    |
|       | frog | insects |

Notice that the columns are using the custom names.

Since the column names have changed, make sure the `Schema` type gets updated accordingly:

```typescript
interface Schema {
  // root -> owner
  owner: User;
  // animals -> pet
  pet: Animal;
  // food -> treat
  treat: Food;
}
```

### `Row`, `Cell`, and `RowData`

Before jumping in to the `Table` object, we'll need to know what are `Row`s, `Cell`s, and `RowData`.

```typescript
interface Row {
  group: string | number;
  cells: {
    [property]: Cell;
  };
}

interface Cell {
  data: /* cell data type */;
  group: string | number;
  span?: number;
}

type RowData<Schema> = Partial<Schema>;
```

What do these mean?

- `Row` - contains the `Cell`s.
- `Cell` - contains the data.
- `RowData` - the `Schema` but with partial values.
- `span` - pertains to the `rowspan` of a `Cell`. It is set only for `Cell`s that span across `Row`s.
- `group` - contains a unique value which determines if `Row`s or `Cell`s are related (or are in a `group`).

  By default, the `group` value uses the `index` of the array of `data` passed to `unnest` (if it's an object, the value is `0`).

  You can set your own `group` value through the `unnest` function:

  ```javascript
  unnest(users, (user, index, array) => user.email).by(property);
  ```

  > **Tip**: The `user.email` is used as the `group` value.

### `Table`

Using `unnest(data).by(property)` gives you a `Table` object.

The `Table` object contains the `Row`s and `RowData` that have been `unnest`ed, as well as other useful methods.

- Get the rows.

  ```javascript
  const rows = table.rows();

  // filter by group
  const rows = table.rows(group);
  ```

- Get the row data.

  ```javascript
  const data = table.data();
  ```

- Transform `Row`s to `RowData`.

  ```javascript
  const data = table.data(...rows);
  ```

- Get the root rows (the main object/s or the first rows per group).

  ```javascript
  const rows = table.roots();
  ```

- Get all the cells in the column (property).

  ```javascript
  const cells = table.column('treat');

  // filter by group
  const cells = table.column('treat', group);
  ```

  > **Tip**: See `treat` property from the previous example.

- Get the cell info (current, previous, and next cells) at row index if any.

  ```javascript
  const rowIndex = 1;
  const info = table.cell('treat', rowIndex);
  ```

  Output of `info`:

  ```javascript
  {
    current: /* Cell */ { data: 'meat', group: 0 },
    previous: /* Cell */ { data: 'fish', group: 0 },
    next: /* Cell */ { data: 'insects', group: 0 }
  }
  ```

- `table.filter(callback)`

  Similar to `array.filter(callback)`, but `table.filter(callback)` will return a new `Table` object with the filtered rows.

  The return value of the filter callback is an object similar to the `Schema` type.

  ```javascript
  const filteredTable = table.filter((row, index, array) => {
    return {
      owner: /* true, false, undefined */ true,
      pet: /* true, false, undefined */ true,
      treat: /* true, false, undefined */ true
    };
  });
  const filteredRows = filteredTable.rows();
  ```

- `table.sort(compareFn)`

  Similar to `array.sort(compareFn)`, but only the root rows are used as the arguments for the `compareFn`.

  The return value of `table.sort(compareFn)` is also a new `Table` object similar to `table.filter()`.

  ```javascript
  const sortedTable = table.sort((rootRowA, rootRowB) => {
    return /* number */ 0;
  });
  const sortedRows = sortedTable.rows();
  ```

  By using the root rows as the arguments to compare, the other rows of the same group do not get sorted. Only the entire group is sorted against other groups.

  e.g. After sorting, the rows with `group` index `1` precede the rows with `group` index `0`.

  > **Tip**: The methods `table.filter()` and `table.sort()` return a new `Table` object to allow the usage of the `Table` methods on the new filtered/sorted rows instead.

### `render` function

```javascript
render(rows, getLabelFn);
render(rows, columns, getLabelFn);
```

A `render` function is included which accepts rows and returns a Markdown table `string`.

```javascript
const { unnest, render } = require('@arnesfield/unnest');
// ...
const tableStr = render(table.rows(), row => {
  // convert to RowData so it's easier to work with
  const [data] = table.data(row);
  // labels per column, defaults to empty string
  return {
    owner: data.owner?.email,
    pet: data.pet?.type,
    treat: data.treat
  };
});
console.log(tableStr);
```

Output:

```markdown
| owner            | pet  | treat   |
| ---------------- | ---- | ------- |
| john.doe@foo.bar | cat  | fish    |
|                  |      | meat    |
|                  | frog | insects |
```

You can also pass in default columns to use. With this, you can reorder the columns to display:

```javascript
const tableStr = render(table.rows(), ['treat', 'owner', 'pet'], row => {
  const [data] = table.data(row);
  return {
    owner: data.owner?.email,
    pet: data.pet?.type,
    treat: data.treat
  };
});
console.log(tableStr);
```

Output:

```markdown
| treat   | owner            | pet  |
| ------- | ---------------- | ---- |
| fish    | john.doe@foo.bar | cat  |
| meat    |                  |      |
| insects |                  | frog |
```
