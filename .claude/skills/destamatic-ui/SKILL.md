---
name: destamatic-ui
description: >
  Expert context for building with destamatic-ui — the component library for
  the destam reactive stack. Use whenever writing, editing, or reviewing
  components, themes, routes, or state in a project that imports
  @destamatic/ui. Covers JSX conventions, the Theme system, Observer/OObject
  state, the Stage router, Validate, suspend, and all built-in components.
when_to_use: >
  Writing or editing JSX components that use @destamatic/ui; adding or
  changing Theme.define entries; using Observer.mutable, OObject, or OArray;
  setting up Stage routing; wiring up Validate or suspend; any question about
  destamatic-ui APIs or patterns.
allowed-tools: Read Bash(find *) Bash(grep *)
---

# destamatic-ui skill

Full reference is in `AGENTS.md` at the repo root. This skill adds
quick-start reminders and the most common pitfalls.

---

## Import

Always import from the single package entry point in application code:

```js
import { mount, Observer, Button, OObject, OArray } from '@destamatic/ui';
```

Internal components use relative imports only.

---

## JSX rules

- `h`, `mark`, and `raw` are **auto-imported** by the Vite config — never
  import them manually.
- Return JSX **without wrapping parentheses**:

```js
return <div>
  {children}
</div>;
```

- Event listeners use camelCase `on` + capital letter: `onClick`, `onInput`.
- Interactive state booleans: `isHovered`, `isFocused`, `isClicked`,
  `isTouched` — pass as props; `h` wires the DOM events automatically.

---

## Theme

Define once at module load, then apply via the `theme` prop:

```js
Theme.define({
  myCard: { background: '$color', borderRadius: 8, padding: 16 },
  myCard_hovered: { extends: 'myCard', background: '$color_hover' },
});

// usage
<div theme={['myCard', isHovered.map(h => h ? 'hovered' : null)]} />
```

- `_` separates hierarchy: base `_` variant `_` state.
- Numbers in size properties auto-suffix `px`.
- `extends` inherits all properties from another entry.
- `$name` references a theme variable; `$fn(args)` calls a theme function.
- **Always use `ThemeContext.use`** for components that need cascading:

```js
const MyComp = ThemeContext.use(h => ({ label }) => {
  return <div theme="myStyle">{label}</div>;
});
```

---

## State

```js
// Primitive observable
const open = Observer.mutable(false);
open.set(true);
open.get();

// Reactive object
const form = OObject({ name: '', email: '' });
form.name = 'Alice';  // mutation is tracked

// Derived value
const greeting = form.observer.path('name').map(n => `Hello ${n}`);

// Combine multiple
const both = Observer.all([nameObs, emailObs]).map(([n, e]) => n + e);
```

- Use `.memo()` on expensive derivations.
- Use `.watch(cb)` for side effects; it returns a cleanup function.

---

## Stage (routing)

```jsx
<StageContext value={{
  acts: { home: Home, settings: Settings },
  initial: 'home',
  urlRouting: true,
  truncateInitial: true,
}}>
  <Stage />
</StageContext>
```

Navigate from inside an act via the injected `stage` prop:

```js
stage.open({ name: 'settings', urlProps: { tab: 'profile' } });
stage.close();
```

Acts receive `stage`, `urlProps`, and any props spread by `stage.props`.

---

## Validation

```jsx
<ValidateContext value={isFormValid}>
  <Validate value={email} validate="email" signal={submitSignal}>
    <TextField value={email} label="Email" />
  </Validate>
</ValidateContext>
```

Built-in validators: `phone`, `email`, `pan`, `expDate`, `postalCode`,
`date`, `number`, `float`. Custom: `validate={v => v ? '' : 'Required'}`.

---

## Suspend (async)

```js
const AsyncPage = suspend(
  () => <LoadingDots />,
  async (props) => {
    const data = await fetchData(props.id);
    return <Page data={data} />;
  }
);
```

---

## Common pitfalls

| Mistake | Fix |
|---|---|
| Importing `h` manually | Remove — Vite auto-imports it |
| Wrapping return JSX in `()` | Return bare JSX |
| Sorting OArray with `.sort()` | Use `indexPosition`/`positionIndex` from `destam/Array.js` |
| Using `class` alone on themed elements | `theme` prop generates classes; add plain `class` alongside if needed |
| Defining theme entries inside a component | Call `Theme.define` at module scope, once |
| Forgetting `ThemeContext.use` for cascading | Wrap component definition in `ThemeContext.use(h => ...)` |

---

## Component quick-reference

See `AGENTS.md` → *Component Catalog* for the full table. Common ones:

- **Layout:** `Row`, `Column`, `Paper`, `Scroll`
- **Inputs:** `TextField`, `Button`, `Checkbox`, `Toggle`, `Select`,
  `Slider`, `DatePicker`, `FileDrop`
- **Display:** `Typography`, `Icon`, `Tooltip`, `Stage`, `Shown`, `Switch`
- **Utilities:** `Validate`, `suspend`, `Popup`, `InputContext`, `Detached`
