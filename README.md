# destamatic‑ui

> A batteries‑included frontend framework built on fine‑grained Observers.  
> No React, no VDOM. Components, routing, SSG/SEO, theming, icons, and rich text in one stack.

[![Build Status](https://img.shields.io/github/actions/workflow/status/torrinworx/destamatic-ui/build.yml?branch=main)](https://github.com/torrinworx/destamatic-ui/actions)
[![npm version](https://img.shields.io/npm/v/destamatic-ui)](https://www.npmjs.com/package/destamatic-ui)

- 🌐 **Site & docs:** https://torrin.me/destamatic-ui  
- 🧪 **Playground & examples:** https://torrin.me/destamatic-ui/playground  
- 📦 **Template starter:** https://github.com/torrinworx/destamatic-template  
- **Discord** https://discord.gg/BJMPpVwdhz

## What is destamatic‑ui?

destamatic‑ui is the top layer of the **destam stack**:

- **destam** – fine‑grained Observer based state management (`Observer`, `OObject`, `OArray`, etc.).
- **destam-dom** – DOM manipulation with direct Observer based updates (**no virtual DOM**).
- **destamatic‑ui** – batteries‑included framework built on top:
  - component library
  - routing & stages
  - static site generation / SEO helpers
  - theming system
  - rich text
  - icons and other utilities

Most apps can import almost everything they need from `destamatic-ui` and ignore the other packages until they want lower‑level control.

## Who is this for?

- **Indie devs / solo SaaS / small teams**  
  Tired of stitching React + Next + Zustand + MUI + Redux + 5 other libs. You want a single stack that just works.

- **Performance / architecture nerds**  
  You like Solid/Svelte/signals and care about fine‑grained reactivity and benchmarkable performance.

- **JS devs bored with React overhead**  
  Comfortable with JSX, want a smaller mental model, less boilerplate, and a live playground to try things before committing.

## Key features

- 🧩 **Built‑in component library** – buttons, inputs, layout, navigation, utilities.
- 🎨 **“Hell and back” theming** – deeply composable, context‑based theming with inheritance and helpers.
- 🧭 **Routing & stages** – simple page routing and stage management.
- 📄 **Static site / SEO tooling** – `<Head>`, `<Title>`, `<Meta>`, `<Link>`, JSON‑LD helpers; works with SSG.
- ✏️ **Rich text engine** – `RichArea`, `RichField`, `RichEngine`, `TextModifiers` for custom inline rendering.
- 🖼️ **Icons** – built‑in support for multiple icon sets & custom icons.
- 🧬 **Observer‑based state** – fine‑grained updates, watchers, delta mutations, network‑sync patterns.
- ⚡ **No VDOM** – `destam-dom` updates real DOM directly, tuned for large lists and high‑frequency updates.
- 🏭 **Production‑proven** – destam stack has been used in production for 5+ years (Equator Studios + personal projects like torrin.me, OpenGig.org, MangoSync).

## Try it online

You can play with the stack in the browser before installing anything:

- **Landing & overview:** https://torrin.me/destamatic-ui  
- **Interactive Playground:** https://torrin.me/destamatic-ui/playground  
- **Comprehensive Documentation**: https://torrin.me/destamatic-ui/docs

The playground includes live examples for:

- destam (Observers),
- destam‑dom (DOM bindings),
- destamatic‑ui (components, theming, utils).

## Installation

`destamatic-ui` is published on npm and designed for Vite.

```bash
npm install destamatic-ui
# or
yarn add destamatic-ui
# or
pnpm add destamatic-ui
```

Basic usage:

```jsx
import { Observer } from 'destam';
import { mount } from 'destam-dom';
import { h, Paper, Button, Typography } from '@destamatic/ui';

const count = Observer.mutable(0);

const App = () => <Paper theme="column_fill_center" style={{ gap: 12, padding: 24 }}>
    <Typography type="h3" label="Counter" />
    <Typography type="p1" label={count.map((c) => `Value: ${c}`)} />
    <Button
      type="contained"
      label="Increment"
      onClick={() => count.set(count.get() + 1)}
    />
</Paper>;

mount(document.getElementById('root'), <App />);
```

For Vite setup and JSX transform configuration, see:  
👉 https://torrin.me/destamatic-ui/docs

Or start from the template:  
👉 https://github.com/torrinworx/destamatic-template (repo needs an update)


## Project status

- ✅ Used in production for multiple apps.
- ✅ Stable core APIs for most components.
- 🚧 Docs, examples, and centralized site are being expanded.
- 🚧 Public roadmap and community (Discord, good first issues) in progress.

If you hit gaps in the docs or rough edges, please open an issue and describe what you were trying to build.

## Contributing

Issues and pull requests are welcome:

- 🐛 Issues: https://github.com/torrinworx/destamatic-ui/issues  
- 📥 PRs: open against `main`  

Planned:

- Public roadmap
- Discord / chat
- Labeled “good first issue” tasks


## License

MIT
