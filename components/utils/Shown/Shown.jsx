import { mark } from './h.jsx';
import Observer from 'destam/Observer';

import categories from '../../util/categories.js';

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
	const [truthy, falsy] = categories(children, ['then', 'else'], 'then');

	return Observer.immutable(value).map(val => (!!val ^ invert) ? truthy : falsy);
};

export default Shown;
