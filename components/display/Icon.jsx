import { Observer, OArray } from 'destam';

import { h, svg } from '../utils/h';
import createContext from '../utils/Context';

export const Icons = createContext(() => null, (next, prev) => {
	// if next is not a function (we expect it to be an object in this case)
	// convert it into the function representation.
	if (typeof next !== 'function') {
		const icons = next;
		next = iconName => icons[iconName];
	}

	// compbine next and prev making sure that we fall back to prev if the icon
	// is not available in next
	return async iconName => {
		const icon = await next(iconName);
		if (icon) return icon;

		return await prev(iconName);
	};
});

export const Icon = Icons.use(context => {
	return ({ name, size = 24, ref: Ref, style, ...props }, cleanup) => {
		if (!(name instanceof Observer)) name = Observer.immutable(name);
		if (!(size instanceof Observer)) size = Observer.immutable(size);
		if (!Ref) Ref = <svg:svg />;

		const oldIconAttrs = []; // non-parent attributes, to remove on name change
		const libClass = Observer.mutable('');
		const children = OArray();

		cleanup(name.effect(iconName => {
			Promise.resolve(context(iconName)).then(rawSvg => {
				// remove all the old attributes
				for (const name of oldIconAttrs.splice(0, oldIconAttrs.length)) {
					Ref.removeAttribute(name);
				}

				// clear the svg from all children so that we can append our new children
				children.splice(0, children.length);

				if (!rawSvg) return;

				const parser = new DOMParser();
				const parsedSvg = parser.parseFromString(rawSvg, 'image/svg+xml').children[0];

				for (let i = 0; i < parsedSvg.attributes.length; i++) {
					const attr = parsedSvg.attributes[i];
					if (attr.nodeName === 'class') {
						libClass.set(attr.nodeValue);
					} else {
						oldIconAttrs.push(attr.nodeName); // track it so we can remove it next load() call
						Ref.setAttribute(attr.nodeName, attr.nodeValue);
					}
				}

				// append the children of the parsed svg
				while (parsedSvg.firstElementChild) {
					const child = parsedSvg.firstElementChild;
					parsedSvg.removeChild(child)
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
});
