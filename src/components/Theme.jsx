import { h, OObject } from "destam-dom"

const Theme = OObject({
    outline: '2px solid',
    borderRadius: '6px',
    transition: 'opacity 250ms ease-out, box-shadow 250ms ease-out, background-color 250ms ease-in-out',
    height: '40px',
    padding: '10px',
    boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
    insetBoxShadow: 'inset -2px -2px 10px rgba(0,0,0,0.2)',
    colours: OObject({
        primary: OObject({
            base: '#02CA9F', // Main color for primary actions
            baseTrans: 'rgba(2, 202, 159, 0.1)', // Base but transparent
            onPrimary: 'white', // Text/icon color on primary
            lighter: '#02DEAF', // Lighter variant for primary
            darker: '#02B891',  // Darker variant for primary
        }),
        secondary: OObject({
            base: '#CCCCCC'
        }),
        ripple: OObject({
            light: 'rgba(255, 255, 255, 0.8)',
            dark: 'rgba(0, 0, 0, 0.3)',
        }),
    }),
    typography: OObject({
        h1: OObject({
            regular: '62px Roboto, sans-serif',
            bold: 'bold 62px Roboto, sans-serif'
        }),
        h2: OObject({
            regular: '56px Roboto, sans-serif',
        }),
        h3: OObject({
            regular: '36px Roboto, sans-serif',
            bold: 'bold 36px Roboto, sans-serif'
        }),
        h4: OObject({}),
        h5: OObject({}),
        h6: OObject({}),
        p1: OObject({
            regular: '24px Roboto, sans-serif',
            bold: 'bold 24px Roboto, sans-serif'
        }),
        p2: OObject({
            regular: '16px Roboto, sans-serif',
            bold: 'bold 16px Roboto, sans-serif'
        }),
    })
});

Theme.Button = OObject({
    base: OObject({
        fontFamily: 'Roboto, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 'bold',
        height: '40px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        border: 'none',
        outline: 'none',
        borderRadius: Theme.borderRadius,
        lineHeight: '2.25rem',
        cursor: 'pointer',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: Theme.transition,
    }),
    text: OObject({
        base: OObject({
            backgroundColor: 'transparent',
            color: 'black',
        }),
        hover: OObject({
            backgroundColor: 'transparent',
            color: Theme.colours.primary.base,
        }),
        disabled: OObject({
            cursor: 'default',
            filter: 'grayscale(100%)',
            pointerEvents: 'none',
        }),
    }),
    contained: OObject({
        base: OObject({
            backgroundColor: Theme.colours.primary.base,
            color: Theme.colours.primary.onPrimary,
        }),
        hover: OObject({
            backgroundColor: Theme.colours.primary.darker,
            color: Theme.colours.primary.onPrimary,
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
            border: `2px solid ${Theme.colours.primary.lighter}`,
            color: Theme.colours.primary.base,
        }),
        hover: OObject({
            backgroundColor: Theme.colours.primary.baseTrans,
            color: Theme.colours.primary.base,
        }),
        disabled: OObject({
            cursor: 'default',
            filter: 'grayscale(100%)',
            pointerEvents: 'none',
        }),
    }),
    icon: OObject({
        base: OObject({
            margin: '0px 6px 0px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
        }),
        disabled: OObject({
            cursor: 'default',
            filter: 'grayscale(100%)',
            pointerEvents: 'none',
        }),
    })
});

export default Theme;
