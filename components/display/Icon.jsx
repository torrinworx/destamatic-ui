import { Observer } from 'destam';
import suspend from '../utils/Suspend';
import createContext from '../utils/Context';
import { svg } from '../utils/h';

export const IconsContext = createContext({});

export const Icons = ({ icons, children }) => {
	return <IconsContext value={icons}>{children}</IconsContext>;
};

export const Icon = IconsContext.use((iconsFromContext) => {
	return suspend(() => <svg:svg />, async ({
		name,
		size = 24,
		ref: Ref,
		style: propsStyle,
		...props
	}) => {
		if (!Ref) Ref = <svg:svg />;
		if (!(name instanceof Observer)) name = Observer.mutable(name);
		if (!(size instanceof Observer)) size = Observer.mutable(size);

		const renderIcon = async (iconName) => {
			const iconFn = iconsFromContext[iconName];
			if (!iconFn) {
				Ref.innerHTML = '';
				return;
			}

			const raw = await iconFn();
			if (!raw) {
				Ref.innerHTML = '';
				return;
			}

			const parser = new DOMParser();
			const doc = parser.parseFromString(raw, 'image/svg+xml');
			const parsedSvg = doc.documentElement;

			Ref.innerHTML = '';

			// Remove old attributes but skip removing style if you want to preserve it
			while (Ref.attributes.length > 0) {
				const attrName = Ref.attributes[0].name;
				if (attrName !== 'style') {
					Ref.removeAttribute(attrName);
				} else {
					// skip removing 'style'
					break;
				}
			}

			// Set attributes from parsed <svg>
			for (let i = 0; i < parsedSvg.attributes.length; i++) {
				const attr = parsedSvg.attributes[i];
				Ref.setAttribute(attr.name, attr.value);
			}

			// Move the children
			while (parsedSvg.firstChild) {
				Ref.appendChild(parsedSvg.firstChild);
			}

			// Re-apply style object
			Object.assign(Ref.style, {
				// ensure these are strings or valid CSS
				height: `${size.get()}px`,
				width: `${size.get()}px`,
				...propsStyle
			});
		};

		// Render once
		await renderIcon(name.get());

		// Re-render on name change
		name.watch(() => renderIcon(name.get()));

		// Return the <Ref> element
		return <Ref {...props} theme="icon" />;
	});
});
