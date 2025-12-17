const icons = import.meta.glob('/node_modules/@material-design-icons/svg/**/*.svg', { query: '?raw' });

const MaterialIcons = async (name) => {
	const [maybeStyle, maybeIcon] = name.split(':', 2);
	const style = maybeIcon ? maybeStyle : 'filled';
	const path = `/node_modules/@material-design-icons/svg/${style}/${maybeIcon || maybeStyle}.svg`;

	if (Object.keys(icons).length === 0) {
		console.error("The library @material-design-icons/svg isn't installed or couldn't be loaded.");
		return null;
	}

	if (icons[path]) {
		try {
			const module = await icons[path]();
			return module.default;
		} catch (err) {
			console.error("Error loading icon:", err);
			return null;
		}
	} else {
		console.warn(`Icon not found: ${name}`);
		return null;
	}
};

export default MaterialIcons;
