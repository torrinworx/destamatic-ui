<div align="center">

# Destamatic UI

A lightweight component library powered by `destam` and `destam-dom`.

</div>

---

Destamatic UI is a UI library built on the delta state management library [destam](https://github.com/equator-studios/destam) and the DOM manipulation library [destam-dom](https://github.com/Nefsen402/destam-dom). The base set of components take inspiration from MUI and the base HTML tags, with some ease-of-use built in.

To install:
```bash
	npm i destamatic-ui
```

## Features Overview
Destamatic UI offers a range of components designed for responsive and interactive web interfaces. Key features include:

- **State Management Integration:** Built on `destam`, effortless state management across components.
- **Built in reactivity:** Uses `destam-dom` for efficient DOM manipulations and updates without the need for a virtual dom.
- **Theming:** Customizable and reactive theming for consistent, application-wide style and appearance.
- **Universal Icons**: Seamless icon support for all your favourite icon libraries or custom icon sources.
- **Component Library:** Includes navigational, input, and display components inspired by material design principles.

For a detailed overview of the components and their functionalities, refer to the [documentation](./docs/index.md).

## Demo
You can install and run the demo by following these steps:
1. Clone the library:
```bash
	git clone https://github.com/torrinworx/destamatic-ui.git
```

2. Install dependencies:
```bash
	npm i
```

3. Run the demo:
```bash
	npm run dev
```

This will start the Vite demo server on [http://localhost:5173/](http://localhost:5173/). You can view example components based on their directory paths in the `examples` folder. Here's how you can access them:

- `examples/inputs/button.jsx`, can bee seen by going to:
	- [http://localhost:5173/inputs/button.html](http://localhost:5173/inputs/button.html)
- `examples/utils/theme.jsx`, can bee seen by going to:
	- [http://localhost:5173/utils/theme.html](http://localhost:5173/utils/theme.html)

Replace the path with the corresponding directory and file name, adjusting for any additional examples you want to explore.

---

# Production Ready Components
Not all dui compponents are created equally. Some are polished weekly, some have been built and left to collect dust. Here is a list of components that we (authors) commonly find ourselves using and find them to be reliable. The less useful ones are ~~striked~~:

### display
- ~~CodeBlock~~
- ~~Column~~
- ~~Divider~~
- ~~Drag~~
- Icon
- ~~Link~~
- ~~Markdown~~
- ~~MenuItem~~
- Paper
- ~~Row~~
- ~~ToolTip~~
- Typography

### icons
- ~~CustomIcons~~
- FeatherIcons
- ~~MaterialIcons~~

### inputs
- Button
- Checkbox
- ~~ColorPicker~~
- ~~Date~~
- ~~Radio~~
- ~~Select~~
- ~~Slider~~
- TextArea
- TextField
- Toggle

### navigation
- ~~Drawer~~
- ~~DropDown~~
- ~~Scroll~~
- ~~Tabs~~

### utils
- Context
- ~~Detached~~
- h
- Icons
- LoadingDots
- Popup
- Ripple
- ~~Router~~
- Shown
- Suspend
- SwitchCase
- Theme
- ThemeContext

Other components not listed here may be functional and totally usable as documented, the team just hasn't tested/used them extensively enough where they could be considered production ready for everyone's use case.
