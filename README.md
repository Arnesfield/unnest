# unnest

Flatten nested objects to table rows.

```javascript
const { unnest } = require('@arnesfield/unnest');
// ...
const table = unnest(items).by(property);
```

Using `TypeScript`:

> **Tip**: Setting the `Schema` generic type should improve typings for `Row`s and `Cell`s.

```typescript
const table: Table<Schema> = unnest(items).by<Schema>(property);
```

## Installation

```sh
npm install @arnesfield/unnest
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
```

Use `unnest` to flatten the object:

```javascript
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

## Usage

The `unnest` function takes in the data (array or object) and calling `.by()` returns a `table`:

```javascript
const table = unnest(data).by(property);
```

### `unnest(data).by(property)`

The `property` value is as object that is based on the `data` type. Consider the following interface:

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
}
```

The `property` object type may look like the following depending on how you want to `unnest` the object:

```javascript
{
  email: /* ... */,
  aliases: /* ... */,
  animals: {
    food: {
      kind: /* ... */,
      value: /* ... */
    }
  }
}
```

### Custom Column Name

By default, the property keys are used as the default column name (and `root` is the default for the main object) similar to our example output a while back:

| root | animals | food    |
| ---- | ------- | ------- |
| user | cat     | fish    |
|      |         | meat    |
|      | frog    | insects |

You can configure your own column names by using `name` for the property, or pass it as the property value:

> **Tip**: See `user` object from the first example.

```javascript
const table = unnest(user).by({
  name: 'owner',
  animals: {
    name: 'pet',
    food: 'treat' // can also be `food: { name: 'treat' }`
  }
});
console.log(table.rows());
```

Output:

Notice that the columns are using the custom names.

> **Note**: Most of the actual output structure is omitted for brevity.

| owner | pet  | treat   |
| ----- | ---- | ------- |
| user  | cat  | fish    |
|       |      | meat    |
|       | frog | insects |

### `Row` and `Cell`

The `Row` contains the following:

```typescript
interface Row {
  group: string | number;
  cells: {
    [property]: Cell;
  };
}
```

The `Cell` contains the following:

```typescript
interface Cell {
  data: /* cell data type */;
  group: string | number;
  span?: number;
}
```

The `span` value pertains to the `rowspan` of a cell. It is set only for cells that span across rows.

The `group` value contains a unique value which determines if `Row`s or `Cell`s are related (or are in a `group`).

By default, the `group` value uses the `index` of the array of `data` passed to `unnest` (if it's an object, the value is `0`). You can set your own `group` value through the `unnest` function:

> **Tip**: In the example below, the `user.email` is set as the `group` value.

```javascript
unnest(users, (user, index, array) => user.email).by(...)
```

### The `Table` Object

Using `unnest(data).by(property)` gives you a `Table` object.

The `Table` object contains the rows that have been `unnest`ed, as well as other useful methods.

#### `table.rows([group])`

Get the rows.

```javascript
// all rows
const rows = table.rows();
// get and filter rows by `group` value
const rowsOfGroup = table.rows(group);
```

#### `table.roots()`

Get the root rows (the main object/s).

```javascript
const rows = table.roots();
```

#### `table.column(property)`

Get all the cells in the column (property).

```javascript
// the `treat` property from the previous example
const treatCells = table.column('treat');
```

#### `table.cell(property, rowIndex)`

Get the cell info (current, previous, and next cells) at row index if any.

```javascript
const info = table.cell('treat', 1);
console.log(info);
```

Output:

```javascript
{
  current: { data: 'meat', group: 0 },
  previous: { data: 'fish', group: 0 },
  next: { data: 'insects', group: 0 }
}
```

#### `table.filter(callback)`

Similar to `array.filter(callback)`, but `table.filter(callback)` will return a new `Table` object with the filtered rows.

The return value of the filter callback is an object with the properties.

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

#### `table.sort(compareFn)`

Similar to `array.sort(compareFn)`, but only the root rows are used as the arguments for the `compareFn`.

```javascript
const sortedTable = table.sort((rootRowA, rootRowB) => {
  return /* number */ -1;
});
const sortedRows = sortedTable.rows();
```

By using the root rows as the arguments to compare, the other rows of the same group do not get sorted. Only the entire group is sorted against other groups (e.g. Rows with `group` index `1` precede the rows with `group` index `0`)

> **Tip**: The methods `table.filter()` and `table.sort()` return a new `Table` object to allow the usage of the `Table` methods on the new filtered/sorted rows instead.

### `render(rows, getLabelFn)`

A small `render` function is included which accepts rows and returns a Markdown table `string`.

```javascript
const { unnest, render } = require('@arnesfield/unnest');

// ...

const tableStr = render(table.rows(), row => {
  // labels per column, defaults to empty string
  return {
    owner: row.cells.owner?.data.email,
    pet: row.cells.pet?.data.type,
    treat: row.cells.treat?.data
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
