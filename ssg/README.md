# Static Site Generation

destamatic‑ui includes a small static‑site generation (SSG) layer that works directly with `Stage` / `StageContext`.
The goal is:

- keep your app a normal SPA at runtime (client‑side `Stage` switching)
- generate static HTML files for each stage for SEO, crawlers, and fast first load
- automatically discover nested stage trees (e.g. `/blogs` with its own stages)

This document explains the user‑facing pieces of that system.

## High‑level flow

1. **You build an SSR bundle** that can render your app to a string:
   - Vite builds `frontend/index.ssg.jsx` as a Node‑usable entry.
2. **The SSG runner** (`destamatic-ui/ssg/build.js`) loads that server bundle,
   calls your `renderAppToString`, and gets back a list of pages.
3. **Each page is written to disk** under your client build output (`build/dist`):
   - one HTML file per stage (with some routing rules)
   - each HTML file includes a small boot script that loads your SPA bundle
4. **At runtime**, crawlers and browsers can hit those HTML pages directly;
   once JavaScript loads, the normal `Stage` system takes over on the client.

You trigger all of this from your app via `StageContext` configuration and a small `render` entry.

## Defining stages for SSG

SSG is driven entirely by `StageContext`. You decide **which** stage trees are
turned into static pages by configuring the `StageContext` value.

### Basic example

```jsx
// frontend/App.jsx
import { Stage, StageContext, Button } from 'destamatic-ui';

import About from './pages/about';
import Blogs from './pages/blogs';
import Landing from './pages/landing';

const stageConfig = {
  stages: {
    Landing,
    About,
    Blogs,
  },
  template: ({ children }) => children,
  initial: 'About',      // initial stage for this context
  ssg: true,             // <- opt this StageContext into SSG
  route: '/',            // <- folder route for generated files
};

const Pages = StageContext.use(s => () => (
  <>
    <div theme="row">
      <Button
        type="contained"
        label="Landing"
        onClick={() => s.open({ name: 'Landing' })}
        href="Landing.html"
      />
      {/* ... */}
    </div>
    <Stage />
  </>
));

const App = () => (
  <StageContext value={stageConfig}>
    <Pages />
  </StageContext>
);

export default App;
```

Key options that affect SSG:

- `stages`: map of stage name → component.
- `initial`: which stage is the default for this context.
- `ssg: true`: marks this context as SSG‑enabled.
- `route`: the folder path where this context’s pages will be generated.

## Client and SSG entry points

You keep two small entry files:

### 1. Normal client entry

```jsx
// frontend/index.jsx
import App from './App';
import { mount } from 'destam-dom';

mount(document.body, <App />);
```

This is your SPA bootstrap. It’s what runs in the browser.

### 2. SSG entry

```jsx
// frontend/index.ssg.jsx
import App from './App';
import { render } from 'destamatic-ui/ssg/render';

export const renderAppToString = () => {
  return render(App);
};
```

Important:

- You **must** export a `renderAppToString` function.
- It should call `render` from `destamatic-ui/ssg/render` with your root component.
- `render(App)` returns an array of page descriptors (see below).

## What `render(App)` returns

`render(App)` inspects all SSG‑enabled `StageContext`s and returns something like:

```ts
type Page = {
  route: string; // folder route, e.g. "/", "/blogs/"
  name: string;  // base filename, e.g. "index", "Landing", "FirstPost"
  html: string;  // full HTML document string
};

type RenderResult = Page[];
```

For the example app, the output pages include:

- `/index.html` (root `initial` stage: `About`)
- `/Landing.html` (root stage `Landing`)
- `/blogs/index.html` (`blogs` context initial: `BlogHome`)
- `/blogs/FirstPost.html`
- `/blogs/SecondPost.html`

The SSG runner (`build.js`) writes these into `build/dist`.

## How routes and filenames are chosen

For each SSG‑enabled `StageContext`:

- `route` (string) → folder route for that context
  - `'/'` → `build/dist/`  
  - `'blogs'` or `'/blogs'` → `build/dist/blogs/`
- `initial` (stage name) → becomes `index.html` under that folder
- Every other stage name → `<StageName>.html` in the same folder

So for:

```js
{
  ssg: true,
  route: 'blogs',
  initial: 'BlogHome',
  stages: {
    BlogHome,
    FirstPost,
    SecondPost,
  },
}
```

You get:

- `build/dist/blogs/index.html`       (BlogHome)
- `build/dist/blogs/FirstPost.html`
- `build/dist/blogs/SecondPost.html`

### Nested stage contexts

If you nest a `StageContext` inside a stage of a parent context and give it a
non‑root `route`, the child context gets its own folder.

Example:

- Root `StageContext` with `route: '/'` and a `Blogs` stage
- Nested `StageContext` inside `Blogs` with `route: 'blogs'`

Result:

- Root pages: `/index.html`, `/Landing.html`, `/Blogs.html` (as configured)
- Blogs child context: `/blogs/index.html`, `/blogs/FirstPost.html`, `/blogs/SecondPost.html`

The SSG renderer will avoid generating “wrapper only” pages that just forward
to a nested context’s content, and will instead prefer the child context’s own files.

## Linking between generated pages

Because each stage gets a real HTML file, you can link directly to them:

```jsx
<Button
  type="contained"
  label="First Post"
  onClick={() => s.open({ name: 'FirstPost' })}
  href="FirstPost.html"
/>
```

This means:

- Crawlers see a static link to `FirstPost.html`.
- Users can refresh or hit that URL directly and still see content.
- Once the client bundle loads, `Stage` takes over and behaves like an SPA.

Use:

- `href="index.html"` or just `/blogs/` for the `initial` stage file.
- `href="<StageName>.html"` for other stages in that same context route.

## Including the client boot script

The SSG renderer automatically injects a small boot script into the generated HTML:

```html
<script type="module" src="./index.jsx"></script>
```

This script is responsible for loading your client bundle (which, in turn,
mounts `App` via your normal `frontend/index.jsx`).

You do **not** need to add this manually; it’s added for you so that static
HTML pages hydrate into your SPA once JavaScript is available.

## Running the SSG build

Typical setup in `package.json`:

```json
{
  "scripts": {
    "build:ssg": "vite build --config vite.config.ssg.js && node ./destamatic-ui/ssg/build.js"
  }
}
```

- `vite.config.ssg.js` builds the server bundle (SSR entry) into something
  like `build/server/ssg-entry.js`.
- `destamatic-ui/ssg/build.js`:
  - imports `renderAppToString` from that server entry
  - calls it to get `pages`
  - writes each `{ route, name, html }` to `build/dist/<route>/<name>.html`

Example output:

```text
build/
├── dist
│   ├── blogs
│   │   ├── FirstPost.html
│   │   ├── index.html
│   │   └── SecondPost.html
│   ├── Landing.html
│   ├── Blogs.html
│   └── index.html
└── server
    └── ssg-entry.js
```

## Example Repo:
For more documentation, or to see a working demo of this system, checkout this repo:
https://github.com/torrinworx/ssg-test-destamatic-ui

## TODO
TODO: SSG to js app, dom wiper helper. Need to build a helper that the user imports, and auto loads a 
script in the header that on load of js, wipes the dom and properly loads the web-app.

TODO: Somehow define or allow the user to define an html wrapper file.

TODO: Helper that let's user define and add stuff to the header like jsonld stuff.
