import { Observer } from 'destam';

import { svg } from '../utils/h';
import suspend from '../utils/Suspend';
import createContext from '../utils/Context';

export const Context = createContext({});
export const Icons = ({ icons, children }) => <Context value={icons} children={children} />;

export const Icon = Context.use((iconsFromContext) => {
	return suspend(() => <span />, async ({
		name,
		size = 24,
		ref: Ref,
		style: styleProps,
		...props
	}) => {
		if (!(name instanceof Observer)) name = Observer.mutable(name);
		if (!(size instanceof Observer)) size = Observer.mutable(size);

		if (!Ref) Ref = <raw:div />;

		const renderIcon = async (iconName) => {
			Ref.innerHTML = '';

			const iconFn = iconsFromContext[iconName];
			if (!iconFn) return; // TODO: No icon found, throw warning/error

			// Load the raw SVG string
			const rawSvg = await iconFn();
			if (!rawSvg) return; // TODO: function didn't return valid string, throw error/warning

			const parser = new DOMParser();
			const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
			const newSvg = doc.documentElement;

			newSvg.setAttribute('width', size.get());
			newSvg.setAttribute('height', size.get());
			Object.assign(newSvg.style, styleProps);
			Ref.appendChild(newSvg);
		};

		await renderIcon(name.get());
		name.watch(() => renderIcon(name.get()));

		return <Ref style={{ width: size, height: size }} {...props} />;
	});
});
