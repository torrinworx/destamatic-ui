import { mark } from './h';
import Observer from 'destam/Observer';

/**
 * Conditionally shows elements depending on the value.
 *
 * This component supports marks. Marks are special elements that are not
 * meant to be renderered, but instead hold metadata that the user might want
 * to specify. This metadata can be read by the Shown component to implement
 * special behavior. Two marks are supported:
 *
 * <mark:then> Marks any children components as being shown when the value is true.
 * <mark:else> Marks any children components as being shown when whe value is false.
 *
 * By default, if a component is not marked, it will be assumed that it will be shown
 * when the value is true.
 */
const Shown = ({children, invert = false, value}) => {
	const [truthy, falsy] = children.reduce((a, c) => {
		if (c instanceof mark) {
			let m = 0;
			if (c.name === 'then') m = 0;
			else if (c.name === 'else') m = 1;
			else throw new Error("Unknown mark name for <Shown>: " + c.name);

			a[m] = a[m].concat(c.props.children);
		} else {
			a[0].push(c);
		}

		return a;
	}, [[], []]);

	return Observer.immutable(value).map(val => (!!val ^ invert) ? truthy : falsy);
};

export default Shown;
