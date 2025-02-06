import { mark } from './h';
import Observer from 'destam/Observer';

/**
 * Conditionally renders components based on a value and multiple cases.
 *
 * This component supports marks. Marks are special elements that are not
 * meant to be rendered, but instead hold metadata that the user might want
 * to specify. This metadata can be read by the Switch component to implement
 * special behavior. Two marks are supported:
 *
 * <mark:case> Marks a child component to be shown when its associated case condition matches the value.
 * <mark:default> Marks a child component to be shown when none of the case conditions match the value.
 *
 * By default, if a component is not marked, it will be assumed that it will be shown when the value matches.
 */
const SwitchCase = ({children, value}) => {
	const defaults = [];
	const cases = new Map();

	for (const c of children) {
		 if (c instanceof mark) {
			if (c.name === 'case') {
				let case_ = cases.get(c.props.value);
				if (!case_) cases.set(c.props.value, case_ = []);

				case_.push(...c.props.children);
			} else if (c.name === 'default') {
				defaults.push(...c.props.children);
			} else {
				throw new Error("Unknown mark name for <Switch>: " + c.name);
			}
		} else {
			defaults.push(c);
		}
	}

	return Observer.immutable(value).map(val => {
		return cases.get(val) ?? defaults;
	});
};

export default SwitchCase;
