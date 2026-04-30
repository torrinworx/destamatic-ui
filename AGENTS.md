# destamatic-ui — Agent Context

## Stack Overview

destamatic-ui is the top-level package of the **destam stack**, an opinionated UI library for building reactive web interfaces. The stack has three layers:

- **destam** — delta state management; observer-based, direct mutation, no immutability required.
- **destam-dom** — direct DOM manipulation driven by destam; no virtual DOM.
- **destamatic-ui** — component library, theming, routing, and utilities built on top of the two above.

Package name: `@destamatic/ui`. Peer dependencies: `destam ^0.8.0`, `destam-dom ^0.14.4`.

All destam, destam-dom, and destamatic-ui exports are re-exported from `@destamatic/ui`. Prefer this single import path unless working inside destamatic-ui itself (internal components use relative imports directly).

```js
import { mount, Observer, Button, OObject, OArray } from '@destamatic/ui';
```

---

## JSX & `h`

JSX compiles to `h(name, props, ...children)`. The custom `h` in `components/utils/h/h.jsx` extends destam-dom with:

1. `onClick` / `onInput`-style event listeners (any `on` + capital letter prop).
2. `isHovered`, `isFocused`, `isClicked`, `isTouched` — boolean state observers wired to DOM events.
3. Enhanced `style` — static objects, OObjects, Observer values, and `$var` expressions inside strings.
4. `theme` prop — generates and injects CSS classes at runtime.
5. `each` / `each:propName` sugar for repeating a component over an array or OArray.
6. `mark` — structured metadata tags passed from children to a parent component.
7. `svg` — SVG-namespace variant, same API minus themes.
8. `raw:` prefix — bypasses destamatic-ui's `h` and uses destam-dom directly.

**Vite setup** (`vite.config.js`) auto-imports `h`, `mark`, and `raw` into every JSX file at compile time via `jsx_auto_import`. Do not manually import these in application code built with this Vite config.

### JSX return style

Return JSX directly, not wrapped in parentheses:

```js
return <div>
  ...
</div>;
```

### Elements vs Components

- String `name` → real DOM node.
- Function `name` → forwarded to destam-dom's `h`.

---

## Theme System

`Theme` (`components/utils/Theme/Theme.jsx`) is a CSS-in-JS runtime that generates real `<style>` tag entries.

### Defining theme entries

```js
import { Theme } from '@destamatic/ui';

Theme.define({
  button_contained: {
    extends: 'typography_p1_bold',
    background: '$color',
    color: '$contrast_text($color_top)',
  },

  button_contained_hovered: {
    extends: 'button_contained',
    background: '$color_hover',
  },
});
```

- Keys use `_` as a hierarchy/composition separator (`toggle`, `toggle_contained`, `toggle_contained_disabled`).
- `extends` inherits from another theme entry.
- `$name` — theme variable reference.
- `$fn(arg1, arg2)` — theme function call.
- `$var: value` — define a variable inside a theme entry.
- Numbers in size-like properties (width, height, padding, etc.) auto-suffix with `px`.

Built-in theme functions (defined in `util/defaultTheme.js`): `$shiftBrightness`, `$saturate`, `$hue`, `$brightness`, `$invert`, `$alpha`, `$contrast_text`, `$add`, `$sub`, `$div`, `$mul`, `$mod`, `$min`, `$max`, `$floor`, `$ceil`, `$round`, `$if`.

### Using themes on elements

```jsx
<div theme={['center', 'shadow']} />
<Button theme={['button', 'contained']} />
```

The `theme` prop accepts strings, arrays of strings, or Observers that resolve to a string or `null`.

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

Plain `class` props are merged with generated theme classes.

### Theme directives in definitions

Beyond plain CSS properties, theme entries support special directives using `_directive_key` naming:

- `$key: value` — define a CSS variable.
- `_elem_selector: { ... }` — scoped child element styles.
- `_children_selector: { ... }` — direct-child styles.
- `_cssProp_pseudoElement: { ... }` — pseudo-element styles (e.g. `::before`).
- `_keyframes_name: value` — `@keyframes` definition.
- `_fontFace_name: { ... }` — `@font-face` definition.

### ThemeContext & cascading

`ThemeContext` (`components/utils/ThemeContext/ThemeContext.jsx`) is the default theme context (defaults to `'primary'`). Use `ThemeContext.use` to write components that receive a cascading `h` function already wired to the current theme and the component's own `theme` prop.

```js
const MyComponent = ThemeContext.use(h => ({ label }) => {
  return <div theme="myStyle">{label}</div>;
});
```

Inside `ThemeContext.use`, `h` automatically prepends the inherited context theme to all `theme` props, enabling cascading.

---

## Context System

`createContext(def, transform?)` (`components/utils/Context/Context.jsx`) creates a context factory:

```js
const MyContext = createContext(defaultValue, (raw, parent, children) => {
  // compute and return the effective value
});

// Providing
<MyContext value={...}>
  {children}
</MyContext>

// Consuming
const UseMyContext = MyContext.use(value => (props, cleanup, mounted) => {
  return <div>{value}</div>;
});
```

- `raw` — the `value` prop passed to `<MyContext>`.
- `parent` — the resolved value from the nearest parent context.
- `children` — an OArray of child context state objects.

---

## Observer & State (destam)

### Observer.mutable

```js
const count = Observer.mutable(0);
count.get();      // read
count.set(1);     // write
count.watch(ev => console.log(ev.prev, ev.value)); // subscribe
```

### OObject

```js
const state = OObject({ name: 'Alice' });
state.name = 'Bob'; // mutation tracked
state.observer.path('name').watch(ev => console.log(ev.value));
```

### OArray

```js
const arr = OArray([1, 2, 3]);
arr.push(4);
arr.observer.watch(ev => { /* Insert/Modify/Delete */ });
```

- `sort` and `reverse` are disabled (throw) — use `indexPosition`/`positionIndex` from `destam/Array.js` for stable index tracking.

### Key Observer methods

- `.map(fn)` — derive a new Observer.
- `.memo()` — cache the derived value.
- `.unwrap()` — flatten an Observer-of-Observer.
- `.defined(pred)` — waits for a condition, returns a promise-like.
- `.then(fn)` — chain after `.defined`.
- `.watch(cb)` — subscribe; returns cleanup function.
- `.effect(cb)` — like watch, auto-runs immediately.
- `.path(key)` — narrow to a property path.
- `.shallow(depth)` — limit change propagation depth.
- `.skip()` — skip the first emission.
- `.tree(key)` — recursively observe a tree of objects.
- `Observer.all([...observers])` — combine multiple observers.
- `Observer.immutable(value)` — wrap a static value as an Observer.

---

## Component Catalog

### display
| Component | Description |
|---|---|
| `Column` | Vertical flex layout container |
| `Divider` | Visual separator |
| `Drag` | Draggable container with pointer-event tracking |
| `Icon` | Async SVG icon loader (Feather, Material, Iconify, Simple Icons) |
| `Paper` | Card-like container with shadow |
| `Row` | Horizontal flex layout container |
| `Stage` | Content display / routing system (see Stage section) |
| `Tooltip` | Hover-triggered contextual popup |
| `Typography` | Styled text (h1–h6, p, bold variants) |

### head
`Head`, `Link`, `Meta`, `Script`, `Style`, `Title` — SSR/SSG-aware `<head>` tag management.

### inputs
| Component | Description |
|---|---|
| `Button` | Clickable button with ripple and theme variants |
| `Checkbox` | Toggle checked/unchecked |
| `ColorPicker` | HSV/HSL/RGB/Hex color selector |
| `Country` | Country and region selector |
| `DatePicker` | Calendar date picker |
| `FileDrop` | File upload via drag-and-drop |
| `Radio` | Single-option selector from a group |
| `RichArea` | Multi-line rich text editor |
| `RichField` | Single-line rich text input |
| `Select` | Dropdown option selector |
| `Slider` | Range slider |
| `TextArea` | Auto-resizing multi-line text input |
| `TextField` | Single-line text input with label and validation support |
| `Toggle` | Binary on/off toggle |

### navigation
| Component | Description |
|---|---|
| `DropDown` | Collapsible section |
| `Scroll` | Custom scrollable container |
| `Tabs` | Tabbed view switcher |

### stage_templates
| Component | Description |
|---|---|
| `Default` | Standard full-page stage template |
| `Modal` | Overlay modal stage template |

### utils
| Export | Description |
|---|---|
| `createContext` | Context factory (see Context section) |
| `Detached` | Renders children outside the current DOM subtree |
| `Attached` | Counterpart to Detached for re-attaching content |
| `Gradient` | CSS gradient helper |
| `h`, `svg`, `mark` | JSX primitives |
| `InputContext` | Generic input event context — fire typed events up the tree |
| `LoadingDots` | Animated loading indicator |
| `Popup` / `PopupContext` | Positioned popup anchor system |
| `useRipples` | Hook to add Material-style ripple effect to an element |
| `Shown` | Conditional rendering (supports `<mark:then>` / `<mark:else>`) |
| `Switch` | Control-flow: renders first child whose `value` prop matches |
| `suspend` / `suspendRegistry` | Async content with fallback UI |
| `Theme` | Theme definition and lookup |
| `ThemeContext` | Cascading theme context |
| `Validate` / `ValidateContext` | Input validation with built-in validators |

---

## Stage System

`Stage` and `StageContext` (`components/display/Stage/Stage.jsx`) are the primary navigation and content-display primitives.

### Concepts

- A **Stage** is a named slot that renders one "act" (a component) at a time.
- Acts are plain components registered in the `acts` object.
- Stages can be nested — a parent calls `stage.open({ name: 'parent/child' })` to navigate a tree.
- An optional **template** wraps the rendered act (defaults to `Default`).

### StageContext props

```jsx
<StageContext
  value={{
    acts={{ login: Login, dashboard: Dashboard }}
    initial="login"
    fallback="login"
    urlRouting={true}
    truncateInitial={true}
    template={Modal}
    currentDelay={150}
    onOpen={({ name, template, props }) => { /* mutate and return */ }}
  }}
>
  <Stage />
</StageContext>
```

| Prop | Default | Description |
|---|---|---|
| `acts` | — | Map of name → component |
| `initial` | `null` | Act shown on load |
| `fallback` | `null` | Act shown when an unknown act is opened |
| `template` | `Default` | Wrapper component for each act |
| `urlRouting` | `false` | Sync stage state to browser URL (root stage only) |
| `truncateInitial` | `false` | Omit initial act from URL path |
| `currentDelay` | `150` | ms to wait before clearing act on close (animation window) |
| `register` | `true` | Register in global `stageRegistry` |
| `onOpen` | — | Hook to intercept/adjust open calls |

### Opening acts

```js
// Inside any act component, `stage` prop is the StageContext value
stage.open({ name: 'dashboard' });
stage.open({ name: 'profile/settings', urlProps: { tab: 'security' } });
stage.close();
```

Acts receive `stage`, `urlProps`, and any global props spread via `stage.props`.

### URL routing

When `urlRouting={true}` on the root stage:
- URL path segments map 1:1 to the stage chain (`/dashboard/settings` → root opens `dashboard`, child opens `settings`).
- Query params (`?key=value`) become `urlProps` on the leaf stage.
- Back/forward navigation updates stage state automatically.
- `truncateInitial={true}` hides the initial act from the URL.

### stageRegistry

`stageRegistry` (exported OArray) holds all registered `StageContext` instances. Useful for programmatic navigation from outside the component tree.

---

## Validation

`Validate` wraps an input and displays an inline error:

```jsx
<ValidateContext value={isFormValid}>
  <Validate value={fieldValue} validate="email" signal={submitSignal}>
    <TextField value={fieldValue} label="Email" />
  </Validate>
</ValidateContext>
```

Built-in validators: `phone`, `email`, `pan` (credit card), `expDate`, `postalCode`, `date`, `number`, `float`.

Custom validator: pass a function `validate={(value) => errorStringOrEmpty}`.

With `signal`: validation runs only on submit-trigger (then switches to live mode).

---

## Suspend (Async Content)

```js
import { suspend } from '@destamatic/ui';

const AsyncPage = suspend(
  (props, cleanup, mounted) => <LoadingDots />,
  async (props, cleanup) => {
    const data = await fetchData();
    return <Page data={data} />;
  }
);
```

`suspendRegistry` (OArray) tracks all pending promises — useful for SSG to know when rendering is complete.

---

## InputContext

`InputContext` propagates input event metadata down the component tree. Components fire typed events upward:

```js
InputContext.fire(ctx, 'click', { value: 42 });
// ctx.on({ type: 'click', value: 42, ...ctx.meta })
// ctx.onClick({ type: 'click', value: 42, ...ctx.meta })
```

Nest `<InputContext value={{ meta: { id: 'my-input' }, onClick: handler }}>` to intercept or enrich events.

---

## SSG (Static Site Generation)

SSG utilities live in `ssg/`:

- `render(App)` — renders the app to an HTML string (runs in Node).
- `wipe(outputDir)` — clears a build output directory.
- `is_node()` — returns `true` when running in Node (useful for conditional SSR logic).
- `build.js` — entry point for the build pipeline (not yet exported from index.js).

Stage respects `is_node()` — in Node mode it uses a simpler synchronous render path and skips URL routing.

---

## Utility Exports

- `useAbort(fn)` — creates an `AbortSignal`-scoped setup function; cleans up event listeners automatically.
- `atomic` (from destam/Network) — batch multiple OObject/OArray mutations as a single commit.
- `UUID` — generates unique identifiers (used internally for context node IDs).
- `mount` (from destam-dom) — mounts a component tree onto a DOM node.

```js
mount(document.getElementById('root'), <App />);
```

---

## File Structure

```
destamatic-ui/
├── index.js                    # All public exports
├── components/
│   ├── display/                # Visual display components
│   │   ├── Stage/Stage.jsx     # Routing / content display
│   │   └── ...
│   ├── head/                   # <head> tag management
│   ├── icons/                  # Icon set integrations
│   ├── inputs/                 # User input components
│   ├── navigation/             # Navigation components
│   ├── stage_templates/        # Stage wrapper templates
│   └── utils/
│       ├── h/h.jsx             # Custom JSX hypertext function
│       ├── Theme/Theme.jsx     # CSS-in-JS theme engine
│       ├── ThemeContext/       # Cascading theme context
│       ├── Context/Context.jsx # Context factory
│       ├── Validate/           # Input validation
│       ├── Suspend/            # Async content with fallback
│       ├── Shown/              # Conditional rendering
│       ├── Switch/             # Control-flow rendering
│       ├── Popup/              # Positioned popup system
│       ├── InputContext/       # Input event context
│       └── ...
├── ssg/                        # Static site generation tools
├── util/
│   ├── defaultTheme.js         # Built-in theme variables and functions
│   ├── index.js                # sizeProperties and other shared constants
│   └── ...
├── examples/                   # Runnable component examples
├── docs/                       # Additional documentation
└── vite.config.js              # Vite config with jsx_auto_import for h/mark/raw
```

---

## Key Conventions

- **No parentheses** around returned JSX.
- **Inline** functions and variables that are only used once.
- **Theme.define** entries have a blank line between each definition for readability.
- **`_` separates** theme name hierarchy; combine base + variant + state (e.g. `toggle_contained_disabled`).
- **Each component** calls `Theme.define` once at module load time with its own entries.
- **No manual `h` import** needed in application code when using the Vite config with `jsx_auto_import`.
- **`ThemeContext.use`** is the standard way to write themed components — it provides a pre-configured `h` that threads the current theme automatically.
