# Destamatic-ui Themes

The theming engine in destamatic designed around css properties. Most css properties that components in destamatic-ui will come from the theme that can
be configured by the user. In essence, the idea is that each component only really implements functionality, all css is responsible for theming. The theme is basically a big json file that if you squint your eyes, looks like css. Each property in the theme json is basically a selector, and in each selector, you can define a bunch of styles. Behind the scenes, the theming engine from this json will generate actual css classes, and those clasess are going to be used by the components.

There are three main features that the themeing json implements:
 - selectors
 - variables
 - styles

## Selectors

Components define themes by defining a bunch of identifiers that will end up matching to a selector. These selectors work along the lines of selectors in css except the acutal algorithm used to match up selectors is completely different. Themes do not have clasess or ids.

## A component with selectors
```jsx
<div theme='myDiv' />
```

This is the most basic example. We are creating a component where we only have one selector. destamatic-ui's hypertext (h.jsx) implementation includes a helper to assign themes to indidival components using a shortcut. Here, we are using that helper.

## Defining the style

```jsx
{
    myDiv: {
        background: 'red',
        width: 100,
        height: 100,
    }
}
```

Here, we are defining a style for the 'myDiv' selector. We are simply defining some css styles here. We have a background, and we are making the div 100x100 pixels. 

## Multiple selectors

Having multiple selectors is where the real power of the theming engine will come in. It isn't very useful if you have to repeat yourself everytime for every component. With multiple selectors, you can compose selectors. The engine uses `_` as a delimiter to split apart the different selectors.

```jsx
<div theme='primary_myDiv' />

// theme
{
    primary: {
        background: 'red',
    }

    myDiv: {
        width: 100,
        height: 100,
    }
}
```

With multiple selectors, the div above will both be styled with the `primary` and `myDiv` selector at the same time. Note that seletors are order dependant: `primary_myDiv` will have `myDiv` have precedence meaning that `myDiv` will overwrite any styles that `primary` has. With this, you can start removing duplication. Suppose we have multiple components that all want to work off the same background color. We can now can define a 'primary' selector that all these styles can build off of.

## Extends

```jsx
<div theme='myDiv' />

// theme
{
    myDiv: {
        extends: 'primary',

        width: 100,
        height: 100,
    }
}
```

Sometimes though, it can be itself problematic to create theme selectors that always use `primary`. Sometimes you know for sure that your component will always want to use primary colors. In this case, `extends` can be used which essentially bakes in inheretance straight from the theme definition. However, since everything is baked in, it won't be possible to change the theme programatically through the component unless you change the theme itself. That means if you want to implement things like hover effects, those are obviously based off changing state on the component itself. You'd still want to use multiple selectors for that.

## Dynamic selectors

As mentioned above, multiple selectors are necessary to use if you have dynamic state. Let's explore this.

```jsx
const hovered = Observer.mutable(false);

<div theme={[
    'myDiv',
    hovered.map(h => h ? 'hovered' : null)
]} isHovered={hovered} />

// theme
{
    myDiv: {
        extends: 'primary',

        width: 100,
        height: 100,
    }

    hovered: {
        background: 'green',
    }
}
```

Dynamic seletors are pretty simple, it's basically just an observer that can dynamically control when you have a certain selector for a component or not.

## Multipe selectors in the theme

We've discussed multiple selectors for regural components, but themes can also explicitly match multiple selectors. In the above example, we define a hovered effect for `myDiv` however, different components might want a different hover effect for each one of them that is different than just changing the background. 

```jsx
{
    myDiv: {
        extends: 'primary',

        width: 100,
        height: 100,
    }

    myDiv_hovered: {
        background: 'green',
    }
}
```

Notice the `myDiv_hovered` in the theme definiton. This selector will only trigger if both `myDiv` and `hovered` are present in the component theme in that order. Note that the selector will still work if the component defines a selector inbetween:

```jsx
<div theme='myDiv_whatever_hovered' />

// theme
{
    myDiv_hovered: {
        // this will still match the div above
    },

    myDiv_whatever_hovered: {
        // this will also match the div above, but with a high precedence since it's a more exact match.
    },

    myDiv_whatever: {
        // this will match the div above with the same precedence as the first selector.
    }
}
```

## Variables

With the selectors that we've been able to define so far, we can overwrite styles that have been previously defined with more specific selectors for more specific elements. This bottom-up approach will work well for most components but sometimes you want something more top down, where a previous selector can influence styles later. This is where variables come in. The style engine uses `$` as the keyword to denote a varibale.

```jsx
<div theme='myDiv_hovered' />

// theme
{
    myDiv: {
        background: 'black',
        $hover_color: 'white',
    },

    hovered: {
        background: '$hover_color',
    }
}
```

With variables, we can implement the hovered effect differently. Suppose that we find that the elements that we want to style basically always want to have a changed background when they hover. But the background color is silghtly different for each component to maybe complement whatever primary color they are using. Instead of defining the background in the generic `hovered` component, we basically define it to be the variable `hover_color`. Then in `myDiv`, the theme there defines the `hover_color` value. Note that this works because `myDiv` has a lower precedence than `hovered`. If `myDiv` had a higher precedence, the variable would not be seen by `hovered` and it would be pointless anyway. If this was the precedence order, you could just use the standard overwriting usage.

The neat part here is that, `hovered` doesn't know anything about `myDiv`. The only reason these two are connected is because of the multiple selector in the div.

## Variables can use other variables

You can nest variables to create more complex structures.

```jsx
<div theme='myDiv' />

// theme
{
    myDiv: {
        $color: 'white',
        $border: '1px solid $color'
        border: '$border',
    },
}
```

## Functions

Themes can also define and use functions. This heavily relies on the variable system. When a variable is used, you can give that variable paramaters and it will be called as a function. Consider the above example with the border: we can invert the border color from the actual color variable in case that's what we want.

```jsx
<div theme='myDiv' />

// theme
{
    myDiv: {
        $color: 'white',
        $border: '1px solid $invert($color)'
        border: '$border',
    },
}
```

`destamatic-ui` already defines a couple functions for our use:
 - `$shiftBrightness(color, amount)`: Shifts the brightness of the color towards neutral grey by the amount. The amount is from 0-1
 - '$insert(color)': Inverts the color
 - '$alpha(color, alpha)': Sets the alpha of a color
