const icons = import.meta.glob('/node_modules/@material-design-icons/svg/**/*.svg', { query: '?raw' });

/**
 * Retrieves a raw <svg> string for a given "style:name" or just "name" (defaults to filled).
 * e.g. name="outlined:face" => /node_modules/@material-design-icons/svg/outlined/face.svg
 * Returns a Promise<string | null>, where the string is the raw <svg>...</svg>.
 */
export default async (name) => {
	const [maybeStyle, maybeIcon] = name.split(':', 2);
	const style = maybeIcon ? maybeStyle : 'filled';
	const path = `/node_modules/@material-design-icons/svg/${style}/${maybeIcon || maybeStyle}.svg`;

	if (icons[path]) {
		return await icons[path]().then(s => s.default);
	} else return null;
};

// TODO: Error message to tell users that the library @material-design-icons/svg isn't installed instead of only
// returning null. We donn't directly import it via `import` like with feather icons because it's just making requests
// to an external site.
