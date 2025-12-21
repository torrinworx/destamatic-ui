# Stage

`Stage` + `StageContext` are destamatic-ui’s “page / modal / flow” system.

A **StageContext** creates a **Stage instance** (an observable `OObject` with state + navigation API).  
A **Stage** component renders the currently active “act” (component) from `acts`, optionally wrapped by a `template`.  
Stages can be nested into a **stage tree**, and the root stage can optionally sync that tree to the browser URL.

## Exports

### `stageRegistry`

Global observable registry of active stages (mostly for debugging/tooling).

```js
import { stageRegistry } from 'destamatic-ui';
```

Type: `OArray<Stage>`

Notes:
- Treat as read-only from userland.
- Prefer `stage.close()` rather than mutating the array.

## `<StageContext />`

Creates a Stage instance and provides it to descendants.

### Signature

```jsx
<StageContext value={config}>
  {children}
</StageContext>
```

### Parameters

#### `props.value` (`StageContextConfig`)

The Stage configuration object.

```ts
type StageContextConfig = {
  acts?: Record<string, Component>;
  template?: Component;

  initial?: string | null;
  fallback?: string | null;

  onOpen?: (args: StageOnOpenArgs) => void | StageOnOpenResult;

  ssg?: boolean;
  register?: boolean;

  urlRouting?: boolean;
  truncateInitial?: boolean;

  // Any extra keys become forwarded props for the active act component.
  [forwardedProp: string]: any;
};

type StageOnOpenArgs = {
  name: string[];                 // normalized segments
  template: Component;            // template about to be used
  props: Record<string, any>;     // forwarded props about to be merged
};

type StageOnOpenResult = {
  name?: string[] | string;       // override route
  template?: Component;           // override template
  props?: Record<string, any>;    // override/replace forwarded props
};
```

### Config fields

#### `config.acts`
Type: `Record<string, Component>`

Map of act name -> component. When `stage.current` matches a key, Stage renders that component.

#### `config.template`
Type: `Component`  
Default: `Default`

Wrapper around the active act. Receives:
- `closeSignal: Observer<boolean>`: becomes `true` when the act should close (useful for exit animations)
- `s` / `m`: the stage instance (both refer to the same Stage)

#### `config.initial`
Type: `string | null`

The act to show by default on mount (and when routing enters this stage without a deeper segment).

#### `config.fallback`
Type: `string | null`

Fallback act key used if `current` is not found in `acts`.
If it’s not valid on this stage, Stage walks up parents until it finds a stage where `fallback` exists in `acts`.

#### `config.onOpen(args)`
Type: `(args: StageOnOpenArgs) => void | StageOnOpenResult`

Hook that runs inside `stage.open()` before the navigation is applied. Use it to rewrite route segments, swap templates, or modify forwarded props.

#### `config.ssg`
Type: `boolean`  
Default: `false`

Marks the stage as SSG-aware (consumed by other parts of the framework).

#### `config.register`
Type: `boolean`  
Default: `true`

If true, the stage registers into `stageRegistry` and unregisters on cleanup/unmount.

#### `config.urlRouting`
Type: `boolean`  
Default: `false`

If true (root stage only), syncs the stage tree to the browser URL:
- URL → stage chain on mount and on `popstate`
- stage `.current` changes → `history.pushState()`

Only the root stage should enable this.

#### `config.truncateInitial`
Type: `boolean`  
Default: `false`

When building a URL from the stage chain, omit a segment when `stage.current === stage.initial`.

This is convenient, but can make some deep states implicit/ambiguous.

Warnings you may see:
- Root stage with `urlRouting && truncateInitial` is usually incompatible for deep routing.
- Child stage using `truncateInitial` under a routed root can make routes URL-implicit.

#### `config.[forwardedProp]`
Type: `any`

Any additional keys on the config object are treated as “global props” for this stage and forwarded into the active act component via `stage.props`.

Example:

```js
const config = {
  acts: { ... },
  initial: 'home',
  userId: '123',         // forwarded
  enabled: Observer.mutable(true), // forwarded
};
```

## `<Stage />`

Renders the active act for the nearest `StageContext`.

### Signature

```jsx
<Stage />
```

Props: none.

Behavior:
- If `stage.current` is falsy, renders `null`.
- If `stage.current` exists in `stage.acts`, renders that act.
- If missing, logs an error and tries `stage.fallbackAct` (resolved from local/parents).

## Stage instance

`StageContext` produces a Stage instance (observable `OObject`) with state + methods.

### Type

```ts
type Stage = {
  acts?: Record<string, Component>;
  template: Component;

  // props merged from StageContext config + stage.open(...)
  props: Record<string, any>;

  initial?: string | null;
  fallback?: string | null;
  ssg: boolean;

  parent: Stage | null;
  children: OArray<{ value: Stage }>;
  parentRoute: string | null;

  current: string | null;
  currentDelay: number; // default: 150

  onOpen?: (args: StageOnOpenArgs) => void | StageOnOpenResult;

  urlRouting: boolean;
  truncateInitial: boolean;

  fallbackAct: Observer<Component | null>;

  open(args: StageOpenArgs): void;
  close(): void;
  cleanup(): void;

  register(): void;
  unregister(): void;
};

type StageOpenArgs = {
  name: string | string[];
  template?: Component;
  onClose?: () => void;

  // merged into stage.props and forwarded to the rendered act
  [prop: string]: any;
};
```

## `stage.open(args)`

Opens an act on this stage, and optionally routes into child stages.

### Signature

```ts
stage.open(args: StageOpenArgs): void
```

### Parameters

#### `args.name`
Type: `string | string[]`  
Required.

Route to open.

- If string: supports `/` segments (`"Blog/post-1"`).
- If array: treated as segments (`["Blog", "post-1"]`).

Behavior:
- Sets `stage.current` to the first segment.
- If more segments remain, forwards them into the first child stage (`children[0]`).
- If no segments remain, resets the child stage to `child.initial` (or `null`).

#### `args.template`
Type: `Component`  
Optional.

Overrides the stage template for this navigation (persists until `stage.cleanup()` runs).

#### `args.onClose`
Type: `() => void`  
Optional.

Called once the act opened by this call is no longer current.

#### `args.[prop]`
Type: `any`  
Optional.

Any additional keys are merged into `stage.props` and forwarded into the rendered act component.

## `stage.close()`

```ts
stage.close(): void
```

Sets `stage.current = null`.

## `stage.cleanup()`

```ts
stage.cleanup(): void
```

Resets transient stage state after an act finishes. Currently restores `stage.template` back to the original template captured when the stage was created.

## `stage.register()` / `stage.unregister()`

```ts
stage.register(): void
stage.unregister(): void
```

Adds/removes the stage from `stageRegistry`. Usually handled automatically when `register: true`.

## Nested stages (stage trees)

Stages can be nested to represent hierarchical flows (App → Blog → Post).

Assumption:
- Stage trees expect a single child stage per act chain.
- If multiple child StageContexts exist, you’ll see a warning and routing uses `children[0]`.

### Example

```jsx
import { Stage, StageContext, Default } from 'destamatic-ui';

const BlogHome = () => <>Blog home</>;
const Post1 = () => <>Post 1</>;

const Blog = () => (
  <StageContext value={{
    acts: { home: BlogHome, 'post-1': Post1 },
    initial: 'home',
    template: Default,
  }}>
    <Stage />
  </StageContext>
);

const Landing = () => <>Landing</>;

export default function App() {
  const rootConfig = {
    acts: { Landing, Blog },
    initial: 'Landing',
    template: Default,
  };

  return (
    <StageContext value={rootConfig}>
      <Stage />
    </StageContext>
  );
}
```

Navigate into a nested route:

```js
rootStage.open({ name: 'Blog/post-1' });
```

## Async acts (loading pages on demand)

You can mount a stage immediately, then populate `acts` after async work finishes. This is useful for:
- example browsers / playgrounds
- CMS-driven pages
- “load index, then create one act per entry”
- keeping deep links stable while content loads

### Example: fetch an index, then register acts dynamically

```jsx
import {
  StageContext,
  Stage,
  suspend,
  LoadingDots,
  Default,
  Paper,
  Typography,
} from 'destamatic-ui';

const fetchIndex = async () => {
  const res = await fetch('/examples/index.json');
  if (!res.ok) throw new Error('Failed to load index');
  return await res.json(); // { "hello": "/examples/hello.txt", ... }
};

const ExamplesLoader = StageContext.use(stage =>
  suspend(LoadingDots, async () => {
    const index = await fetchIndex();

    const newActs = Object.fromEntries(
      Object.entries(index).map(([name, url]) => [
        name,
        suspend(LoadingDots, async () => {
          const r = await fetch(url);
          const text = await r.text();
          return (
            <Paper theme="column" style={{ gap: 12 }}>
              <Typography type="h3" label={name} />
              <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
            </Paper>
          );
        }),
      ])
    );

    Object.assign(stage.acts, newActs);

    // If we're still on the loader act, jump to the first loaded act
    if (stage.current === 'loading') {
      stage.open({ name: Object.keys(newActs)[0] });
    }

    return <Stage />;
  })
);

export default function AsyncActsExample() {
  const config = {
    acts: {
      loading: () => (
        <Paper>
          <Typography type="p1" label="Loading examples..." />
        </Paper>
      ),
    },
    initial: 'loading',
    template: Default,
  };

  return (
    <StageContext value={config}>
      <ExamplesLoader />
    </StageContext>
  );
}
```

Note:
- The key idea is that the StageContext (and optionally URL routing) can exist immediately, while the real acts arrive later.