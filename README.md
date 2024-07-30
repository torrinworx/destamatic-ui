<div align="center">

# Destamatic UI

A lightweight component library powered by `destam` and `destam-dom`.

</div>

---

Destamatic UI is a simple ui library built on the delta state management library [destam](https://github.com/equator-studios/destam) and dom manipulation library [destam-dom](https://github.com/Nefsen402/destam-dom). The base set of components take insperation from MUI and the base HTML tags, with some ease-of-use built in.

## Install
```bash
npm i destamatic-ui
```

## Notes
[destam](https://github.com/equator-studios/destam) and [destam-dom](https://github.com/Nefsen402/destam-dom) are both required to run this library.

Optional libraries:
- [prismjs](https://github.com/PrismJS/prism) - Adds language specific syntax highlighting for CodeBlock component.
- [Feather](https://github.com/feathericons/feather) - Icon library used in with the Icon component
- [Material Icons](https://github.com/marella/material-icons) - Icon library used with the Icon component

## Demo
You can install and run the demo with the following steps:
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
npm start
```

This will start the webpack dev server on localhost:3000, this has a small demo page showing off some of the capabilities of the components currently available.

## TODO:
list of html Input components to wrap (https://www.w3schools.com/html/html_form_input_types.asp):
- Button - [x]
- Checkbox - [X]
- Color - [ ]
- DateTime (local) - [ ] - Make single Date component where you can enable either time, date + time, or date.
- File - [ ] - use current Button component, <input> tags so that this can have children
- Radio - [x]
- Range - [ ]

Features to add to standard text input:
- Tel - [ ] - simple built in phone number validation
- Email - [ ] simple built in email validation

list of other html tags to wrap possibly:

list of other components to make from material ui:
- Grid?
