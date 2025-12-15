import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css'

import { Observer } from 'destam';
import { mount } from 'destam-dom';
import { Button, TextModifiers, Typography, PopupContext, RichArea } from 'destamatic-ui';

const value = Observer.mutable(`
	hello world there!?!?!?!?!?!
	:frog:
	
	atomic
	
	non-atomic
`);

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
	return list;
};

const makePrismModifiers = (lang) => {
	const grammar = Prism.languages[lang]
	if (!grammar) return []
	const patterns = extractPatterns(grammar)
	return patterns.map(([tokenClass, regex]) => {
		return {
			check: new RegExp(regex.source, regex.flags + (regex.flags.includes('g') ? '' : 'g')),
			atomic: false,
			return: match => <span class={`token ${tokenClass}`} style={{ display: 'inline-block' }}>{match}</span>
		}
	});
};

const modifiers = makePrismModifiers('javascript');
const value2 = Observer.mutable(`const makePrismModifiers = (lang) => {
	const grammar = Prism.languages[lang]
	if (!grammar) return []
	const patterns = extractPatterns(grammar)
	return patterns.map(([tokenClass, regex]) => {
		return {
			check: new RegExp(regex.source, regex.flags + (regex.flags.includes('g') ? '' : 'g')),
			atomic: false,
			return: match => <span class={'token'} style={{ display: 'inline-block' }}>{match}</span>
		}
	});
};`);

mount(document.body, <PopupContext>
	<Typography label="Fun modifiers:" type='h1' />
	<TextModifiers value={[
		{
			check: '!',
			return: (match) => <span style={{ color: 'red', display: 'inline-block' }}>{match}</span>,
		},
		{
			check: '?',
			return: (match) => {
				const hover = Observer.mutable(false);
				return <span
					isHovered={hover}
					style={{ cursor: 'pointer', color: hover.bool('purple', 'pink'), display: 'inline-block' }}
				>{match}</span>
			},
		},
		{
			check: /hello/gi,
			return: (match) => <div style={{ display: 'inline-block' }}><div style={{ background: 'blue' }}>{match}</div></div>,
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

				return <div isHovered={hover} style={{ cursor: specialButton.bool('pointer', 'inherit'), background: specialButton.bool('blue', 'red'), display: 'inline-block' }}>{match}</div>
			},
			atomic: false,
		},
		{
			check: /atomic/gi,
			return: (match) => <Button type='contained' style={{ display: 'inline-block' }}>{match}</Button>,
			atomic: true,
		},
		{
			check: /non-atomic/gi,
			return: (match) => <Button type='contained' style={{ display: 'inline-block' }}>{match}</Button>,
			atomic: false,
		},
		{
			check: /:([a-zA-Z0-9_]+):/g,
			return: (match) => {
				const key = match.slice(1, -1); // remove surrounding colons
				const emoji = emojis[key];
				return emoji ? <span style={{ display: 'inline-block' }}>{emoji}</span> : match;
			}
		}
	]} >
		<RichArea value={value} type='h1' />
	</TextModifiers>
	<Typography label="Javascript syntax highlighting:" type='h1' />
	<TextModifiers value={modifiers} >
		<RichArea value={value2} type='h1' />
	</TextModifiers>
</PopupContext>);
