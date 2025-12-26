# Description
This is an opinionated context primer for using destamatic-ui, a the top level npm package/library/git submodule in the 'destam stack'. The destam stack is composed of three main npm packages/libraries:
- destam -> 'delta state management' library, observers based in architecture.
- destam-dom -> dom manipulation tool based on destam, direct dom updates, no vdom.
- destamatic-ui -> opinionated ui framework built on destam/destam-dom. 

destamatic-ui has many features to simplilfy the developer experience of creating frontend ui:
- jsx syntax
- built to run in vite
- component library with various pools of components: display, head, icons, inputs, navigation, utils.
- context management, similar to react context, but simplier in implementation.
- cascading themeing system built on contexts. you're able to theme and update using observers/destam-dom any css property reactivly
- content display system through the Stage component, allows for Stage trees, url routing/resolution, and static page generation.

# Syntax
- JSX tags are returned directly and not in parenthasis:
```javascript
return <div>
   ...
</div>;
```
- If a function or variable isn't used more than once, prefer to inline it where actually used.
- Theme Object items are defined with a line space between each theme definition for readability:
```javascript:
Theme.define({
	button_contained: {
		extends: 'typography_p1_bold',
		background: '$color',
		color: '$contrast_text($color_top)',
	},

   button_outlined: {
		extends: 'typography_p1_bold',
		borderWidth: 2,
		borderStyle: 'solid',
		color: '$color',
	},
})
```
- all destam, destam-dom, and destamatic-ui exports are exported via destamatic-ui, prefer to use this import syntax, unless working with internal destamatic-ui components directly:
```javascript
import { mount, Observer, Button } from 'destamatic-ui';
```

# `h`

destamatic-ui uses a custom `h` on top of `destam-dom` with a few extras:

- JSX is compiled to `h(name, props, ...children)`
- You usually don’t call `h` directly — you write JSX and import `h` from destamatic-ui:
  ```js
  import { h, mount } from 'destamatic-ui';
  ```
- With destamatic-ui setup with Vite, we usually have an 'include' that automatically imports h into all components at compile time, so syntax wise it's not recommended to import everywhere when working on a user made component that is setup with Vite jsx_auto_import for 'h',
'mark', and 'raw'.

## Elements vs Components

- **DOM elements**: `name` is a string → a real DOM node is created:
  ```jsx
  <div id="root" />
  ```
- **Components**: `name` is a function → forwarded to `destam-dom`’s `h`:
  ```jsx
  const MyComponent = ({ label }) =>
    <div>{label}</div>;
  ```

## `theme` and `class`

- `theme` is destamatic-ui’s main styling hook:
  ```jsx
  <div theme={['center', 'shadow']} />
  <Button theme={['button', 'contained']} />
  ```
- Values in `theme` can be:
  - string(s): `'primary'`, `'toggle_contained'`
  - nested arrays of strings
  - Observers that resolve to string or `null`:
    ```jsx
    <span
      theme={[
        'toggle',
        type,
        disabled.map(d => d ? 'disabled' : null),
        hover.map(h => h ? 'hovered' : null),
      ]}
    />
    ```
- You can still pass a plain `class` prop; it’s merged with generated theme classes:
  ```jsx
  <div class="my-custom-class" theme={['center']} />
  ```

## Events

`h` supports React-style event props and a few “stateful” helpers:

- Standard events:
  ```jsx
  <button
    onClick={e => console.log('clicked', e)}
    onInput={e => console.log(e.target.value)}
  />
  ```
  Any prop starting with `on` + capital letter (`onClick`, `onMouseDown`, etc.) becomes a DOM event listener.

- Boolean event state via `isX` props:
  ```jsx
  const isHovered = Observer.mutable(false);
  const isFocused = Observer.mutable(false);

  <div
    isHovered={isHovered}
    isFocused={isFocused}
    theme={[
      isHovered.map(h => h ? 'hovered' : null),
      isFocused.map(f => f ? 'focused' : null),
    ]}
  />
  ```
  Supported:
  - `isFocused` → `focus` / `blur`
  - `isHovered` → `mouseenter` / `mouseleave`
  - `isClicked` → `mousedown` / `mouseup`
  - `isTouched` → `touchstart` / `touchend`

## Styles

`style` is enhanced compared to raw `destam-dom`:

- **Static object style**
  ```jsx
  <div style={{ width: 100, background: 'red' }} />
  // width -> "100px" (for size-like properties)
  ```
- **Observer style object**
  ```jsx
  const style = OObject({ width: 100, background: 'red' });

  <div style={style} />
  // h listens to changes on the OObject and updates inline styles
  ```
- **Observer values inside style**
  ```jsx
  const width = Observer.mutable(100);

  <div
    style={{
      width,                // Observer → dynamic
      opacity: 0.5,         // static
    }}
  />
  ```
- **Numbers → px**  
  For keys in `sizeProperties` (e.g. `width`, `height`, `margin`, etc.), plain numbers become `px`.

- **Theme expressions in style**
  If you’re using themes on that element, `style` values can include `$vars` and `$fn()` calls:
  ```jsx
  <div
    theme={['primary']}
    style={{
      color: '$contrast_text($color_top)',
      boxShadow: '0 0 10px $alpha($color_top, 0.2)',
    }}
  />
  ```
  `h` will:
  - parse the string with `Theme.parse`
  - resolve vars/functions with `Theme.getVar`
  - keep them reactive if they depend on Observers

## `each` for lists

For *components* (not DOM elements), `each` is used to repeat a component over a list/Observer:

```jsx
const ListItem = ({ item }) =>
  <div>{item.label}</div>;

<ul>
  <ListItem each={items} />
</ul>
```

- `items` can be an array or an OArray.
- The framework will render one `ListItem` per entry and pass the current value in as a prop (by default named `each`).

### `each:` sugar for “item as prop”

You can also rename the injected prop using `each:foo`:

```jsx
const ListItem = ({ item }) =>
  <div>{item.label}</div>;

<ul>
  <ListItem each:item={items} />
</ul>
```

This is syntactic sugar. Internally it rewrites to:

```jsx
<ListItem each={items} /> // then ListItem receives { item: eachValue }
```

You can’t use both `each` and `each:foo` at the same time.

### Control flow / mount

`h` returns a handler compatible with `destam-dom`’s `mount`:

```js
import { h, mount } from 'destamatic-ui';

const App = () =>
  <div theme={['primary']}>
    Hello
  </div>;

mount(document.getElementById('root'), <App />);
```

Under the hood, when extra features (events, theme, reactive styles) are used, `h` wraps the `destam-dom` handler so that:

- the element is mounted via `destam-dom`
- event listeners, theme effects, and style observers are wired up
- cleanup happens when the node is unmounted

### SVG

Use `svg` for SVG elements, it’s the same API minus themes:

```js
import { svg } from 'destamatic-ui';

const Icon = () =>
  <raw:svg viewBox="0 0 24 24">
    <raw:path d="..." />
  </raw:svg>;
```

Internally:

```js
export const svg = (name, props, ...children) => {
  name = document.createElementNS("http://www.w3.org/2000/svg", name);
  return hypertext(false, name, props, ...children); // useThemes = false
};
```

### `mark` nodes

`mark` is a way for children to carry structured metadata up to a parent component.

```js
import { mark } from 'destamatic-ui';

const Toolbar = ({ children }) => {
  const actions = [];
  for (const child of children) {
    if (child instanceof mark.constructor && child.name === 'action') {
      actions.push(child.props);
    } else {
      throw new Error('Unknown mark: ' + child.name);
    }
  }
  // render from `actions`
};

<Toolbar>
  {mark('action', { id: 'save', label: 'Save' })}
  {mark('action', { id: 'delete', label: 'Delete' })}
</Toolbar>
```

`mark(name, props, ...children)` returns:

```ts
{
  name: string,
  props: {
    children: Array<any>,
    ...props
  }
}
```

The parent decides what mark names it understands and should throw on unknown ones.

# Theme System

destamatic-ui has a CSS-in-JS style theme system that generates real CSS classes at runtime and wires them to components via a `theme` prop available to all tags and components.

- **Global theme object**
  - A global `Theme` object is created from `defaultTheme` and extended by internal destamatic-ui components.
  - New theme entries are added with:
    ```js
    import { Theme } from 'destamatic-ui'; // internal components actually use relative paths to directly access files, but this is just a representation.

    Theme.define({
      button_contained: {
        extends: 'typography_p1_bold',
        background: '$color',
        color: '$contrast_text($color_top)',
      },
    });
    ```
  - Each key (e.g. `button_contained`) becomes a *theme class* that can be referenced in components.

- **Theme props on elements / components**
  - Any component or element can receive a `theme` prop:
    ```jsx
    <Button theme={['button', 'contained']} />
    <div theme={['center', 'shadow']} />
    ```
  - Values in `theme` can be:
    - string(s): `'primary'`, `'button_contained'`
    - arrays of strings
    - Observers that resolve to a string or `null`:
      ```jsx
      <span
        theme={[
          'toggle',
          type,
          disabled.map(d => d ? 'disabled' : null),
          hover.map(h => h ? 'hovered' : null),
        ]}
      />
      ```
  - The theme system resolves these into generated CSS class names and injects them into a single `<style>` tag in `document.head`.

- **Compositional naming & “extends”**
  - Theme keys use `_` as a hierarchy/composition separator:
    - `toggle`, `toggle_contained`, `toggle_contained_disabled`, etc.
    - This lets you build up styling from base → variant → state.
  - `extends` lets one theme entry inherit from others:
    ```js
    Theme.define({
      button_contained_hovered: {
        extends: 'button_contained',
        background: '$color_hover',
      },
    });
    ```

- **Theme variables and functions**
  - Values starting with `$` are theme variables or functions:
    ```js
    primary: {
      $color: '#02CA9F',
      $color_hover: '$shiftBrightness($color, 0.1)',
      $color_top: 'black',
    },
    shadow: {
      boxShadow: '4px 4px 10px $alpha($color_top, 0.2)',
    },
    ```
  - Variables are defined with `$name` and used as `$name` in strings.
  - Functions are also defined on `$` keys and used like `$fn(arg1, arg2)` inside strings:
    - Built-ins in `defaultTheme["*"]` include:
      - Color transforms: `$shiftBrightness`, `$saturate`, `$hue`, `$brightness`, `$invert`, `$alpha`, `$contrast_text`
      - Math helpers: `$add`, `$sub`, `$div`, `$mul`, `$mod`, `$min`, `$max`, `$floor`, `$ceil`, `$round`, `$if`

- **Numeric values and size properties**
  - For certain CSS properties (in `sizeProperties`), plain numbers are automatically suffixed with `px`:
    ```js
    Theme.define({
      spacer: {
        padding: 8,     // → padding: 8px;
      },
    });
    ```

- **Component-local theme defaults**
  - Each component can ship with its own theme definitions and call `Theme.define` once on import:
    ```js
    Theme.define({
      toggle: { /* base styles */ },
      toggle_contained: { /* variant */ },
      toggle_contained_disabled: { /* state */ },
      // ...
    });
    ```
  - Components then pass theme classes via `theme`:
    ```jsx
    <Span
      theme={[
        'toggle',
        type,
        disabled.map(d => d ? 'disabled' : null),
        hover.map(h => h ? 'hovered' : null),
      ]}
    />
    ```

- **Context + cascading themes**
  - `Theme` is also exposed via a context created by `ThemeContext`.
  - `ThemeContext.use` wraps a component so that:
    - `props.theme` is automatically threaded, and
    - nested components can extend the parent theme (cascading).
  - When multiple themes are combined, the merge logic:
    - merges plain objects deeply,
    - merges `extends` arrays/strings in a controlled way,
    - keeps everything reactive via underlying `Observer`s.

# Destam · Delta State Manager

Destam is a small state management library that:

- Lets you **mutate** state directly (no forced immutability / cloning)
- Tracks all changes as **deltas** (Insert / Modify / Delete)
- Gives you **Observers** that can:
  - expose current state
  - notify you when it changes (`.watch`, `.watchCommit`, `.effect`, etc.)
  - narrow what you listen to with **governors** (`.path`, `.ignore`, `.shallow`, `.skip`, `.tree`, …)
- Works with **observable objects** (`OObject`) and **observable arrays** (`OArray`), which behave like normal JS objects/arrays but are fully tracked.

You can use those deltas to:

- Update a UI or DOM efficiently
- Sync state across tabs, clients, or to a server
- Implement undo/redo or time‑travel
- Sync to a DB or a document store

## Install

```bash
npm install destam
# or
yarn add destam
```

## Quick Start Guide: Observer

An **Observer**, the core concept behind destam, is simply a box around a value that:

- Stores a value
- Can be updated, if it’s mutable
- Notifies listeners

### Creating a simple mutable observer

```js
import { Observer } from 'destam';

const count = Observer.mutable(0);

console.log(count.get()); // 0

count.set(1);
console.log(count.get()); // 1
```

### Watching changes

`.watch` lets you subscribe to changes. The callback gets called **every time the value is mutated**.

```js
const count = Observer.mutable(0);

const stop = count.watch(event => {
  // For basic mutable observers:
  // event.value = new value
  // event.prev  = previous value
  console.log('count changed from', event.prev, 'to', event.value);
});

count.set(1); // logs: count changed from 0 to 1
count.set(2); // logs: count changed from 1 to 2

// stop listening
stop();
```

A few things to know about `.watch`:

- It returns a **cleanup function**. Call it to unsubscribe.
- It runs **synchronously** right when the mutation happens.
- If multiple watchers are attached, they all get run (order is not guaranteed stable, and they can re‑trigger changes).

There are more Observer helpers (`.map`, `.memo`, `.throttle`, `.wait`, `.unwrap`, etc.), but for a quick start, `mutable`, `get`, `set`, and `watch` are enough. See the rest of the documentation for more details.

## Observable Objects: OObject

`OObject` is a JS object that:

- Behaves like a normal object
- Has a built‑in Observer through `.observer` so you can use to watch mutations to any property
- Emits **Insert / Modify / Delete** deltas when it changes

### Creating an observable object

```js
import { OObject } from 'destam';

const state = OObject({
  name: 'John Doe',
  address: 'Tokyo',
});
```

You can read and write properties like a normal object:

```js
console.log(state.name);  // "John Doe"
state.name = 'Jane Doe';  // mutation is tracked
delete state.address;     // also tracked
```

### Getting the object’s Observer

Every observable exposes `.observer`:

```js
const obs = state.observer;
console.log(obs.get() === state); // true
```

### Watching OObject changes with `.watch`

For observables like `OObject` and `OArray`, `.watch` receives **delta objects**:

- `Insert(prev, value, ref, id)`
- `Modify(prev, value, ref, id)`
- `Delete(prev, value, ref, id)`

Where (for `OObject`):

- `event.ref`   – the property name (string)
- `event.value` – new value
- `event.prev`  – previous value
- `event.path`  – full path from the root observer (array of keys)
- `event.parent`– the observable that was mutated (here: `state`)

Example:

```js
import { Insert, Modify, Delete } from 'destam';

state.observer.watch(event => {
  if (event instanceof Insert) {
    console.log('INSERT', event.path, '->', event.value);
  } else if (event instanceof Modify) {
    console.log('MODIFY', event.path, 'from', event.prev, 'to', event.value);
  } else if (event instanceof Delete) {
    console.log('DELETE', event.path, 'prev was', event.prev);
  }
});

state.name = 'Jane Doe';   // MODIFY ["name"] from "John Doe" to "Jane Doe"
state.age = 42;            // INSERT ["age"] -> 42
delete state.age;          // DELETE ["age"] prev was 42
```

### Narrowing what you watch with `.path`

Observers can be narrowed using **governors**. The most important one to start with: `.path`.

```js
// Only react when "address" changes:
state.observer
  .path('address')
  .watch(event => {
    console.log(`${event.parent.name}'s address changed to ${event.value}`);
  });

state.address = 'Toronto';
// logs: "John Doe's address changed to Toronto"

state.occupation = 'Electrician';
// No log, because .watch was narrowed and only listens for updates
// to state.address
```

Some key points:

- `state.observer` sees **everything** under `state`.
- `state.observer.path('address')` only sees changes at/under `state.address`.
- `.path` works for nested properties too (you can pass an array path).


## Observable Arrays: OArray

`OArray` is a JS array that:

- Behaves like a normal array (`push`, `splice`, indexing, `Array.isArray`, `instanceof`, etc.)
- Emits deltas for element insertions, modifications, and deletions
- Uses stable **logical indexes** internally so you can track items even when the array shifts

### Creating an observable array

```js
import { OArray } from 'destam';

const arr = OArray([1, 2, 3]);

console.log(arr.length);   // 3
console.log([...arr]);     // [1, 2, 3]

arr.push(4);               // tracked
arr[0] = 10;               // tracked
arr.splice(1, 2, 'a', 'b'); // tracked (insert + delete/modify)
```

It still behaves like an array:

```js
console.log(Array.isArray(arr));      // true
console.log(arr instanceof OArray);   // true
```

> Note: `sort` and `reverse` are intentionally disabled (they throw) because they’re not implemented for stable indexing.

### Watching OArray changes with `.watch`

The `.observer` for an `OArray` also gives you `Insert`, `Modify`, `Delete` deltas. The difference vs. `OObject` is the **ref**: in arrays it’s a *stable index token* instead of a numeric JS index.

Example:

```js
import { Insert } from 'destam';

const arr = OArray([1, 2, 3]);

arr.observer.watch(event => {
  if (event instanceof Insert) {
    console.log('Inserted value', event.value, 'at ref', event.ref);
  } else {
    console.log(event.constructor.name, 'prev=', event.prev, 'value=', event.value);
  }
});

arr.push(4);
// Insert at logical end

arr[0] = 10;
// Modify of first element

arr.splice(1, 2);
// Deletes / modifies depending on what changed
```

You rarely need to care about the exact internal index encoding. There are helpers if you need to map between numeric positions and refs.

### Mapping positions ↔ refs (`indexPosition` / `positionIndex`)

From `Array.js` Destam exports:

- `indexPosition(array, ref)` – given a ref from an event, returns the numeric position *at that moment*.
- `positionIndex(array, pos)` – given a numeric position, returns the stable ref for that element (useful in `.path` governors).

Example: tracking *which index* changed in a watcher:

```js
import { indexPosition } from 'destam/Array.js';

const arr = OArray();

arr.observer.watch(event => {
  const idx = indexPosition(arr, event.path[0]); // path[0] is the ref
  console.log('Change at index', idx, '->', event.value);
});

arr.push('a'); // logs: Change at index 0 -> a
arr.push('b'); // logs: Change at index 1 -> b
arr.push('c'); // logs: Change at index 2 -> c
```

### Watching a specific array element with `.path`

To watch a specific element stably (even if the array shifts), you **convert the numeric index to a ref** using `positionIndex` and then use `.path` with that ref:

```js
import { positionIndex } from 'destam/Array.js';

const arr = OArray(['hello', 'third thing']);
arr.splice(1, 0, 'world'); // arr = ["hello", "world", "third thing"]

// Grab stable refs for each position:
const ref0 = positionIndex(arr, 0);
const ref1 = positionIndex(arr, 1);
const ref2 = positionIndex(arr, 2);

// Create observers for each position:
const o0 = arr.observer.path([ref0]);
const o1 = arr.observer.path([ref1]);
const o2 = arr.observer.path([ref2]);

console.log(o0.get(), o1.get(), o2.get()); // "hello", "world", "third thing"

// Update via observers:
o0.set('new value 1');
o1.set('new value 2');
o2.set('new value 3');

// These are equivalent to writing directly: arr[0] = ..., etc.
console.log([...arr]); // ["new value 1", "new value 2", "new value 3"]
```

Under the hood, these `.path([ref])` observers:

- Resolve the ref into a numeric index **at call time**
- Read/write the proper element
- Emit the `Modify` deltas

## Understanding `.watch`

You’ll see `.watch` in three main situations:

1. **Plain Observer (single value)**  
   - Created with `Observer.mutable()`, `.map`, `.all`, etc.
   - `watch(cb)` calls `cb(event)` whenever `.set` is called.
   - `event.value` and `event.prev` are the new/previous values.

2. **Observable Object (`OObject`)**  
   - `state.observer.watch(cb)` gets **per‑property** events:
     - `Insert`, `Modify`, or `Delete`
     - `event.ref` is the property name
     - `event.path` is path from root observer (array of keys)

3. **Observable Array (`OArray`)**  
   - `arr.observer.watch(cb)` gets **per‑element** events:
     - `Insert`, `Modify`, or `Delete`
     - `event.ref` is a *stable index ref*
     - Use `indexPosition(arr, event.ref)` to get the numeric index.

In all three:

- `.watch` returns a function to unsubscribe.
- Multiple listeners can be attached.
- Events are emitted synchronously on mutation.


## Where to go next

If you want to dig deeper:

- **Observers & governors**: `docs/observer.md`, `docs/governors.md`
- **Observables & state trees**: `docs/observables.md`, `docs/state-tree.md`
- **Networks, commits, undo/redo & syncing**: `docs/network.md`, `Tracking.js`

But for most use cases, you can start with:

- `Observer.mutable` + `.get()`, `.set()`, `.watch()`
- `OObject` + `.observer.watch()` / `.observer.path(...)`
- `OArray` + `.observer.watch()`, `indexPosition`, `positionIndex`

and only pull in the more advanced stuff when you actually need it.

## Repository structure

```bash
./
├── README.md <- this readme
├── destam <- The core destam library (Observer, OArray, OObject, etc)
│   └── ...
└── destam-react <- Library containing specialized Observer integration tools for React
    └── ...
```