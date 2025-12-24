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
