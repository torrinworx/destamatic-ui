TODO: Create context file so that users can copy/paste this into a chat context and an llm can reference this to help out the user.

# Description:
destamatic-ui is the top level npm package/library/git submodule in the 'destam stack'. The destam stack is composed of three main npm
packages/libraries:
- destam -> 'delta state management' library, observers based in architecture.
- destam-dom -> dom manipulation tool based on destam, direct dom updates, no vdom.
- destamatic-ui -> opinionated ui framework built on destam/destam-dom. 

destamatic-ui has many features to simplilfy the developer experience of creating frontend ui:
- jsx syntax
- built to run in vite
- component library with various pools of components: display, head, icons, inputs, navigation, utils.
- context management, similar to react context, but simplier in implementation.
- cascading themeing system built on contexts. you're able to theme and update using observers/destam-dom any css property reactivly
- 

# Syntax:
- JSX tags are returned directly and not in parenthasis:
```javascript
return <div>
   ...
</div>
```
- If a function or variable isn't used more than once, prefer to inline it.

# Tips:


