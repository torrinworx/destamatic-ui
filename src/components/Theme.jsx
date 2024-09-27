import { h, OObject } from "destam-dom";
import createContext from './Context';

/**
 * Global shared theme for the UI framework, accessible via Shared.
 * Contains default styles and theming options for various UI components.
 * 
 * @type {Object}
 */
const Theme = OObject({
    /**
     * General
     */
    outline: '2px solid',
    borderRadius: '6px',
    transition: 'opacity 250ms ease-out, box-shadow 250ms ease-out, background-color 250ms ease-in-out',
    height: '40px',
    padding: '10px',
    boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
    insetBoxShadow: 'inset -2px -2px 10px rgba(0,0,0,0.2)',
    font: 'Roboto, sans-serif',
    /**
     * Colours
     */
    Colours: OObject({
        primary: OObject({
            base: '#02CA9F', // Main color for primary actions
            baseTrans: 'rgba(2, 202, 159, 0.1)', // Base but transparent
            onPrimary: 'white', // Text/icon color on primary
            lighter: '#02DEAF', // Lighter variant for primary
            darker: '#02B891',  // Darker variant for primary
        }),
        secondary: OObject({
            base: '#CCCCCC', // Main color for secondary actions
            darker: '#A5A5A5' // Darker variant for secondary
        }),
        ripple: OObject({
            light: 'rgba(255, 255, 255, 0.8)', // Ripple effect color for light themes
            dark: 'rgba(0, 0, 0, 0.3)', // Ripple effect color for dark themes
        }),
    }),
});

/**
 * Typography styles for the Typography component.
 * 
 * @type {Object}
 */
Theme.Typography = OObject({
    h1: OObject({
        regular: `62px ${Theme.font}`,
        bold: `bold 62px ${Theme.font}`,
        italic: `italic 62px ${Theme.font}`
    }),
    h2: OObject({
        regular: `56px ${Theme.font}`, 
        bold: `bold 56px ${Theme.font}`,
        italic: `italic 56px ${Theme.font}`
    }),
    h3: OObject({
        regular: `36px ${Theme.font}`,
        bold: `bold 36px ${Theme.font}`,
        italic: `italic 36px ${Theme.font}`
    }),
    h4: OObject({
        regular: `30px ${Theme.font}`,
        bold: `bold 30px ${Theme.font}`,
        italic: `italic 30px ${Theme.font}`
    }),
    h5: OObject({
        regular: `24px ${Theme.font}`,
        bold: `bold 24px ${Theme.font}`,
        italic: `italic 24px ${Theme.font}`
    }),
    h6: OObject({
        regular: `20px ${Theme.font}`,
        bold: `bold 20px ${Theme.font}`,
        italic: `italic 20px ${Theme.font}`
    }),
    p1: OObject({
        regular: `16px ${Theme.font}`,
        bold: `bold 16px ${Theme.font}`,
        italic: `italic 16px ${Theme.font}`
    }),
    p2: OObject({
        regular: `14px ${Theme.font}`,
        bold: `bold 14px ${Theme.font}`,
        italic: `italic 14px ${Theme.font}`
    }),
});

/**
 * Button styles for the Button component.
 * 
 * @type {Object}
 */
Theme.Button = OObject({
    base: OObject({
        fontFamily: Theme.font,
        height: '40px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        border: 'none',
        outline: 'none',
        borderRadius: Theme.borderRadius,
        cursor: 'pointer',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'clip',
        transition: Theme.transition,
    }),
    text: OObject({
        base: OObject({
            backgroundColor: 'transparent',
            color: 'black',
        }),
        hover: OObject({
            backgroundColor: Theme.Colours.primary.baseTrans,
            color: Theme.Colours.primary.base,
        }),
        disabled: OObject({
            cursor: 'default',
            filter: 'grayscale(100%)',
            pointerEvents: 'none',
        }),
    }),
    contained: OObject({
        base: OObject({
            backgroundColor: Theme.Colours.primary.base,
            color: Theme.Colours.primary.onPrimary,
        }),
        hover: OObject({
            backgroundColor: Theme.Colours.primary.darker,
            color: Theme.Colours.primary.onPrimary,
        }),
        disabled: OObject({
            cursor: 'default',
            filter: 'grayscale(100%)',
            pointerEvents: 'none',
        }),
    }),
    outlined: OObject({
        base: OObject({
            backgroundColor: 'transparent',
            border: `2px solid ${Theme.Colours.primary.lighter}`,
            color: Theme.Colours.primary.base,
        }),
        hover: OObject({
            backgroundColor: Theme.Colours.primary.baseTrans,
            color: Theme.Colours.primary.base,
        }),
        disabled: OObject({
            cursor: 'default',
            filter: 'grayscale(100%)',
            pointerEvents: 'none',
        }),
    }),
    icon: OObject({
        base: OObject({
            backgroundColor: 'transparent',
            margin: '0px 6px 0px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'black',
        }),
        hover: OObject({
            backgroundColor: 'transparent',
            color: Theme.Colours.primary.base,
        }),
        disabled: OObject({
            cursor: 'default',
            filter: 'grayscale(100%)',
            pointerEvents: 'none',
            boxShadow: `inset 1px 1px 10px #333`
        }),
    })
});

/**
 * Markdown styles for the Markdown component.
 * 
 * @type {Object}
 */
Theme.Markdown = OObject({
    code: {
        backgroundColor: Theme.Colours.secondary.base,
        borderRadius: Theme.borderRadius,
        padding: '2px 6px',
        fontFamily: 'monospace',
    },
    inlineCode: {
        backgroundColor: '#f8f8f8',
        borderRadius: '3px',
        padding: '0 0.2em',
        fontFamily: 'monospace',
    },
    blockquote: {
        borderLeft: `4px solid ${Theme.Colours.primary.base}`,
        paddingLeft: '16px',
        color: '#666',
        margin: '1em 0',
        fontSize: '1em',
    },
    ul: {
        listStyleType: 'disc',
        margin: '1em 0',
        paddingLeft: '40px',
    },
    ol: {
        listStyleType: 'decimal',
        margin: '1em 0',
        paddingLeft: '40px',
    },
});

export default createContext(Theme, customTheme => {
    // The application may specify only a partial theme. We need to fill in
    // the rest of the theme in this case from the defaults.

    const createReactiveCopy = (a, b) => {
        if (!(a instanceof OObject)) {
            return b ?? a;
        }

        const out = OObject();

        a.observer.shallow().watch(delta => {
            const prop = delta.path()[0];

            out[prop] = createReactiveCopy(a[prop], b[prop]);
        });

        b.observer?.shallow().watch(delta => {
            const prop = delta.path()[0];

            out[prop] = createReactiveCopy(a[prop], b[prop]);
        });

        for (let o in a) {
            if (!(o in b)) {
                out[o] = a[o];
            } else {
                out[o] = createReactiveCopy(a[o], b[o]);
            }
        }

        return out;
    };

    return createReactiveCopy(Theme, customTheme);
});
