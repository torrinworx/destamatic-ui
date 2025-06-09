
# Destamatic UI

*A lightweight component library powered by `destam` and `destam-dom`.*

---
![Build Status](https://img.shields.io/github/actions/workflow/status/torrinworx/destamatic-ui/build.yml?branch=main)
![npm version](https://img.shields.io/npm/v/destamatic-ui)

Destamatic UI is a UI library built on the delta state management library [destam](https://github.com/equator-studios/destam) and the DOM manipulation library [destam-dom](https://github.com/Nefsen402/destam-dom). The base set of components take inspiration from MUI and standard HTML tags, with additional ease-of-use features integrated.

## Installation

Install Destamatic UI via npm:

```bash
npm install destamatic-ui
```

## Features Overview

Destamatic UI offers a range of components designed for responsive and interactive web interfaces. Key features include:

- **State Management Integration:** Built on `destam`, enabling effortless state management across components.
- **Built-in Reactivity:** Utilizes `destam-dom` for efficient DOM manipulations and updates without the need for a virtual DOM.
- **Theming:** Customizable and reactive theming for consistent, application-wide styles and appearances.
- **Universal Icons:** Seamless icon support for all your favorite icon libraries or custom icon sources.
- **Component Library:** Includes navigational, input, and display components inspired by Material Design principles.

For a detailed overview of the components and their functionalities, refer to the [documentation](./docs/index.md).

## Demo

You can install and run the demo by following these steps:

1. **Clone the repository:**

    ```bash
    git clone https://github.com/torrinworx/destamatic-ui.git
    ```

2. **Navigate to the project directory:**

    ```bash
    cd destamatic-ui
    ```

3. **Install dependencies:**

    ```bash
    npm install
    ```

4. **Run the demo:**

    ```bash
    npm run dev
    ```

    This will start the Vite demo server on [http://localhost:5173/](http://localhost:5173/). You can view example components based on their directory paths in the `examples` folder. Here's how you can access them:

    - **Button Example:**
      [http://localhost:5173/inputs/button.html](http://localhost:5173/inputs/button.html)

    - **Theme Utility Example:**
      [http://localhost:5173/utils/theme.html](http://localhost:5173/utils/theme.html)

    Replace the path with the corresponding directory and file name to explore the other examples.
