import { svg } from '../utils/h';
import { Observer } from 'destam-dom';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import suspend from '../utils/Suspend';

Theme.define({
	icon: {
		display: 'inline-block',
	},
});

const icons = import.meta.glob('./icons/*.jsx');

export default ThemeContext.use(h => {
	// Need span because  “Argument 2 is not an object” happens with multiple icons with null.
	const Icon = suspend(() => <span />, async ({
		library,
		name,
		ref: Ref,
		style,
		size = '20',
		...props
	}) => {
		if (!Ref) Ref = <svg:svg />;
		if (!(library instanceof Observer)) library = Observer.mutable(library);
		if (!(name instanceof Observer)) name = Observer.mutable(name);
		if (!(size instanceof Observer)) size = Observer.mutable(size);

		const libDriver = Observer.mutable(null);

		const updateDriver = async () => {
			const found = Object.keys(icons).find(filePath => {
				const parts = filePath.split('/');
				return parts[parts.length - 1].replace('.jsx', '') === library.get();
			});

			if (!found) {
				console.warn(`Icon library "${library.get()}" not found.`);
				libDriver.set(null);
				return;
			}

			const mod = await import(/* @vite-ignore */ found);
			libDriver.set(mod.default);
		};

		await updateDriver();
		library.watch(updateDriver);

		// Parse returned SVG string, transfer attributes/children to Ref from driver
		const render = async () => {
			const driverFn = libDriver.get();

			if (!driverFn) {
				Ref.innerHTML = '';
				return;
			}

			const raw = await driverFn(name.get());

			if (!raw) {
				Ref.innerHTML = '';
				return;
			}

			// Parse the string into an actual SVG DOM
			const parser = new DOMParser();
			const doc = parser.parseFromString(raw, 'image/svg+xml');
			const parsedSvg = doc.documentElement;

			Ref.innerHTML = ''; // Remove old contents in Ref

			for (let i = 0; i < parsedSvg.attributes.length; i++) {
				const attr = parsedSvg.attributes[i];
				Ref.setAttribute(attr.nodeName, attr.nodeValue);
			}

			while (parsedSvg.firstChild) {
				Ref.appendChild(parsedSvg.firstChild);
			}
		};

		await render(); // inintial render
		name.watch(render); // re-render on name update
		libDriver.watch(render); // re-render on library update

		return <Ref
			style={{
				height: size,
				width: size,
				...style,
			}}
			{...props}
			theme="icon"
		/>;
	});

	return Icon;
});
