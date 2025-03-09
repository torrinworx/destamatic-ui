import { Observer, OArray } from 'destam';

import { svg } from '../utils/h';
import createContext from '../utils/Context';
import ThemeContext from '../utils/ThemeContext';
console.log(DOMParser);

const parser = new DOMParser();

export const Icons = createContext(() => null, (next, prev) => {
	if (!Array.isArray(next)) next = [next];

	next = next.map(pack => {
		// if the pack is not a function (we expect it to be an object in this case)
		// convert it into the function representation.
		if (typeof pack !== 'function') {
			return iconName => pack[iconName];
		}

		return pack;
	});

	// slot in the prev icon pack
	next.splice(0, 0, prev);

	// combine all the icon packs
	return async name => {
		for (let i = next.length - 1; i >= 0; i--) {
			const icon = await next[i](name);
			if (icon) return icon;
		}

		return null;
	};
});

export const Icon = Icons.use(iconPack => ThemeContext.use(h => {
	return ({ name, size = 24, ref: Ref, style, ...props }, cleanup) => {
		if (!(name instanceof Observer)) name = Observer.immutable(name);
		if (!(size instanceof Observer)) size = Observer.immutable(size);
		if (!Ref) Ref = <svg:svg />;

		const oldIconAttrs = []; // non-parent attributes, to remove on name change
		const libClass = Observer.mutable('');
		const children = OArray();

		cleanup(name.effect(iconName => {
			Promise.resolve(iconPack(iconName)).then(svg => {
				// remove all the old attributes
				for (const name of oldIconAttrs.splice(0, oldIconAttrs.length)) {
					Ref.removeAttribute(name);
				}

				// clear the svg from all children so that we can append our new children
				children.splice(0, children.length);

				if (!svg) return;

				if (typeof svg === 'string') {
					svg = parser.parseFromString(svg, 'image/svg+xml').children[0];
				} else {
					svg = svg.cloneNode(true);
				}

				for (let i = 0; i < svg.attributes.length; i++) {
					const attr = svg.attributes[i];
					if (attr.nodeName === 'class') {
						libClass.set(attr.nodeValue);
					} else {
						oldIconAttrs.push(attr.nodeName); // track it so we can remove it next load() call
						Ref.setAttribute(attr.nodeName, attr.nodeValue);
					}
				}

				// append the children of the parsed svg
				while (svg.firstElementChild) {
					const child = svg.firstElementChild;
					svg.removeChild(child)
					children.push(child);
				}
			});
		}));

		return <Ref
			class={libClass}
			style={{ width: size, height: size, ...style }}
			{...props}
			theme="icon"
		>{children}</Ref>;
	};
}));
