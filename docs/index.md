# Overview
This document serves as a general overview of the components and their organization within destamatic-ui.

## components/utils
The backbone for building interactive, dynamic, and styled user interfaces. This collection of components aids in creating flexible UI architecture by providing tools and utilities used accross all other components in destamatic-ui.

This doesn't cover every component in components/utils, only the important ones.

### h.jsx
The `h` function stands for "hypertext" and is responsible for creating HTML or SVG elements using JSX-like syntax. It extends the behavior of standard DOM manipulation from destam-dom by adding support for custom features such as event listeners (`onClick`, `onInput`), the interpretation of JavaScript objects as style properties, and units (e.g., numbers as pixels).
- **Importance:** It reduces boilerplate code and offers enhanced styling and functional capabilities, which is especially beneficial when defining components with dynamic styles or event-handling logic.

### Theme.jsx
The `Theme` context is a powerful tool for applying consistent styles throughout an application that uses destamatic-ui. It provides a theming system that allows for the definition and reuse of style variables and properties.
- **Importance:** By providing functionality to define and override styles contextually, `Theme` enables the application to support different appearances or themes reactively.

For more info on Theme.jsx and themeing in destamatic-ui, see [theme.md](./theme.md)

### Context.jsx
The `createContext` function establishes a context mechanism that encapsulates shared states and provides them to child components. It features lazy evaluation and transformation of context values.
- **Importance:** It allows for management of data that needs to be globally accessible across various components.

### Shown.jsx
The `Shown` component is used to conditionally render its children based on observables or boolean values. It supports special tags (`<mark:then>` and `<mark:else>`) to define conditionally visible sections explicitly.
- **Importance:** This component simplifies the logic needed to conditionally display parts of the UI, making it easier to create dynamic user interfaces that respond effectively to state changes.

### `<mark>` Element
The `<mark>` element is a special-purpose tag used in JSX components to pass metadata or special instructions rather than visible content. It does not render any markup itself but serves as an annotation within the component's child hierarchy.
  
- **Functionality:** Components that utilize `<mark>` can loop through their children and extract data or behaviors specified within these tags. This is particularly useful for indicating conditional rendering in the `Shown` component, where marks like `<mark:then>` and `<mark:else>` designate portions of the UI that should appear based on a specific condition.

- **Importance:** `<mark>` simplifies conditional logic and metadata declaration within JSX, allowing complex UI behaviors to be expressed concisely and clearly.

### `<raw>` Element
The `<raw>` element is used when a reference to a raw HTML element is required within the JSX structure. It allows for direct manipulation of native DOM nodes, which can be useful in scenarios needing fine-grain control over element attributes or behaviors not easily managed through typical JSX abstraction.

- **Usage:** Preceding an HTML tag name with `raw:` within a JSX component, `<raw:div>` for example, denotes that the element should be treated as a native DOM element.

- **Importance:** The `<raw>` element enables low-level DOM interactions directly from JSX, providing flexibility for more complex or specific rendering needs, such as handling direct DOM manipulations in drag-and-drop implementations or popups.

## components/navigation
The navigation components category within the destamatic-ui library provides interactive elements that let users navigate through an application. These components are designed to enhance user experience by offering responsive, intuitive navigation tools, each catering to different navigation styles and scenarios.

### Drawer
The `Drawer` component offers a sliding side panel that can be toggled open or closed. It's typically used to house navigation links or additional content that is accessible from any part of the application.

### DropDown
The `DropDown` component provides a collapsible element that, when toggled, displays its child components. It's often used to present a list of options or additional details relevant to the user's current context.

### Tabs
The `Tabs` component offers tabbed navigation that allows users to switch between different views in the same interface area.

## components/inputs
The inputs category within destamatic-ui features a collection of interactive components that capture user input in various formats. These components offer customizable styles and behaviors, enabling seamless integration into custom designs and ensuring responsive and intuitive user interactions.

### Button
The `Button` component provides a responsive button element that can trigger actions and commands across the application.

### Checkbox
The `Checkbox` component allows users to toggle between checked and unchecked states, often used in forms and settings.

### Radio
The `Radio` component lets users select a single option from a list.

### Select
The `Select` component enables users to select a value from a dropdown-like menu.

### Slider
The `Slider` component provides an interactive means of selecting a value from a range by dragging a handle.

### Switch
The `Switch` component offers a binary toggle mechanism, akin to a light switch, to represent on/off states.

### Textarea
The `Textarea` component allows for multi-line text input, automatically adjusting to content size.

### TextField
The `TextField` component captures single-line text input, often used for forms and user authentication.

## components/display
The display components in destamatic-ui focus on rendering visual content with an emphasis on typography, icons, and structured layouts. These components facilitate a consistent and aesthetically pleasing presentation of information, supporting the creation of modern and visually appealing interfaces.

### CodeBlock - Currently non-functioning
The `CodeBlock` component provides syntax-highlighted representation of code snippets. It uses the Prism.js library for highlighting and supports multiple programming languages. Additional features include a dark and light theme mode and a copy-to-clipboard functionality for ease of use.

### Icon
The `Icon` component dynamically loads and renders SVG icons from specified libraries, such as Feather icons. It supports asynchronous loading, allowing for flexible integration of iconography into user interfaces with custom styling options.

### Link
The `Link` component provides a stylized navigational hyperlink, supporting optional underline styling and hover effects. It can encapsulate children components or text.

### Markdown
The `Markdown` component transforms a markdown syntax string into structured HTML elements. It supports various markdown features such as headings, lists, links, emphasis, and block quotes, offering a dynamic way to render text content with markdown syntax.

### Paper
The `Paper` component acts as a container with a shadow effect. This component is often used to separate content visually and enhance focus by providing a distinct and standard card-like appearance.

### Tooltip
The `Tooltip` component presents contextual pop-ups or placeholders when users hover over elements. It is vital for providing additional information or guidance in user interfaces and supports theming.

### Typography
The `Typography` component offers styled text rendering capabilities, with variations such as headings (h1 through h6) and paragraph styles. It supports different font styles and alignment, contributing to a consistent textual presentation across interfaces.
