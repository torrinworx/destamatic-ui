import { h } from './h';
import Observer from 'destam/Observer';

/**
 * The `suspend` function is a higher-order utility designed to handle the rendering
 * of asynchronous content with a fallback (loading state) while handling lifecycle management.
 * 
 * Useful for showing a loading screen/fallback ui while content is fetched from a server.
 * 
 * @param {Function} fallback - A component function that renders the fallback UI while the main content is loading.
 * @param {Function} callback - An asynchronous function responsible for fetching data or executing other async operations.
 *                               This function receives `props` and `cleanup` as arguments.
 * 
 * @returns {Function} - A function that accepts `props` and `cleanup` parameters and provides the resolved content
 *                       or fallback component.
 */
export const suspend = (fallback, callback) => (props, cleanup) => {
	const out = Observer.mutable();
	const Fallback = (_, cleanup, mounted) => fallback(props, cleanup, mounted);

	out.set(h(Fallback));
	Promise.resolve(callback(props, cleanup)).then(x => out.set(x));

	return out.unwrap();
};

export default suspend;
