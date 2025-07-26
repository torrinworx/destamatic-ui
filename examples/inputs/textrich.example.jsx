import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css'

import { Observer } from 'destam';
import { mount } from 'destam-dom';
import { Button, TextModifiers, Select, PopupContext, TextRich } from 'destamatic-ui';

const value = Observer.mutable('hello world there!?!?!?!?!?! :frog: button');
const selection = Observer.mutable({ start: null, end: null, side: null });
Observer.timer(1000).watch(() => {
    const sel = selection.get();
    if (sel.start === 6 && sel.end === 12) {
        selection.set({ start: 0, end: 6 });
    } else {
        selection.set({ start: 6, end: 12 });
    }
});

const emojis = {
    frog: '🐸',
    smile: '😄',
    heart: '❤️',
    fire: '🔥',
    turtle: '🐢',
};

const extractPatterns = (grammar, parent = []) => {
    let list = []
    for (let [tokenName, def] of Object.entries(grammar)) {
        if (Array.isArray(def)) {
            def.forEach(d => list.push(...extractPatterns({ [tokenName]: d }, parent)))
        } else if (def instanceof RegExp) {
            list.push([[...parent, tokenName].join('-'), def])
        } else if (def.pattern instanceof RegExp) {
            const name = def.alias
                ? Array.isArray(def.alias)
                    ? def.alias.join(' ')
                    : def.alias
                : [...parent, tokenName].join('-')
            list.push([name, def.pattern])
        } else if (typeof def === 'object') {
            // nested grammar
            list.push(...extractPatterns(def, [...parent, tokenName]))
        }
    }
    return list
}

const makePrismModifiers = (lang) => {
    const grammar = Prism.languages[lang]
    if (!grammar) return []
    const patterns = extractPatterns(grammar)
    return patterns.map(([tokenClass, regex]) => {
        // console.log(tokenClass, regex)
        return {
            check: new RegExp(regex.source, regex.flags + (regex.flags.includes('g') ? '' : 'g')),
            atomic: false,
            return: match => <span class={`token ${tokenClass}`}>{match}</span>
        }
    })
};

const language = Observer.mutable('javascript');
const modifiers = language.map(l => makePrismModifiers(l));
const value2 = Observer.mutable('const modifiers = makePrismModifiers(language.get()); ');

mount(document.body, <PopupContext>
    <TextModifiers value={Observer.immutable([
        {
            check: '!',
            return: (match) => <span style={{ color: 'red' }}>{match}</span>,
        },
        {
            check: '?',
            return: (match) => {
                const hover = Observer.mutable(false);
                return <span
                    isHovered={hover}
                    style={{ cursor: 'pointer', color: hover.bool('purple', 'pink') }}
                >{match}</span>
            },
        },
        {
            check: /hello/gi,
            return: (match) => <div><div style={{ background: 'blue' }}>{match}</div></div>,
            atomic: true,
        },
        { // vscode style inline button.
            check: /world/gi,
            return: (match) => {
                const hover = Observer.mutable(false);
                const CtrlKey = Observer.mutable(false);

                document.addEventListener('keydown', e => {
                    if (e.key === 'Control') CtrlKey.set(true);
                });
                document.addEventListener('keyup', e => {
                    if (e.key === 'Control') CtrlKey.set(false);
                });

                const specialButton = Observer.all([hover, CtrlKey]).map(([h, c]) => h && c);

                return <div isHovered={hover} style={{ cursor: specialButton.bool('pointer', 'inherit'), background: specialButton.bool('blue', 'red') }}>{match}</div>
            },
            atomic: false,
        },
        {
            check: /button/gi,
            return: (match) => <Button type='contained'>{match}</Button>,
            atomic: true,
        },
        {
            check: /:([a-zA-Z0-9_]+):/g,
            return: (match) => {
                const key = match.slice(1, -1); // remove surrounding colons
                const emoji = emojis[key];
                return emoji ? <span>{emoji}</span> : match;
            }
        }
    ])} >
        <TextRich style={{ background: 'black', color: 'white' }} value={value} />
    </TextModifiers>

    <Select options={['javascript', 'python', 'markdown']} value={language} />

    <TextModifiers value={modifiers} >
        <TextRich style={{ background: 'black', color: 'white' }} value={value2} />
    </TextModifiers>
</PopupContext>);
