import { Observer } from 'destam';

import { svg } from '../utils/h';
import createContext from '../utils/Context';

export const Context = createContext({});
export const Icons = ({ value, children }) => <Context value={value} children={children} />;

export const Icon = Context.use(context => {
	return ({ name, size = 24, ref: Ref, style, ...props }) => {
		if (!(name instanceof Observer)) name = Observer.mutable(name);
		if (!(size instanceof Observer)) size = Observer.mutable(size);
		if (!Ref) Ref = <svg:svg />;

		const oldIconAttrs = []; // non-parent attributes, to remove on name change
		const libClass = Observer.mutable('');

		const load = async (iconName) => {
			oldIconAttrs.forEach(attrName => Ref.removeAttribute(attrName));
			oldIconAttrs.splice(0, oldIconAttrs.length);

			Ref.innerHTML = '';

			const iconFn = context[iconName];
			if (!iconFn) return;
			const rawSvg = await iconFn();
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

			while (parsedSvg.firstElementChild) {
				Ref.appendChild(parsedSvg.firstElementChild);
			}
		};

		load(name.get());
		name.watch(() => load(name.get()));

		return <Ref
			class={libClass}
			style={{ width: size, height: size, ...style }}
			{...props}
			theme="icon"
		/>;
	};
});
