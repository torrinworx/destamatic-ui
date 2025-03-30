import { mark } from './h';
import Observer from 'destam/Observer';
import { assert } from 'destam/util';

/**
 * Conditionally renders components based on a value and multiple cases.
 *
 * This component supports marks, which are special elements that do not render
 * visually but instead hold metadata. This metadata can be read by the Switch
 * component to implement special behavior. Two marks are supported:
 *
 * - `<mark:case>`: Marks a child component to be shown when its associated case matches the value.
 * - `<mark:default>`: Marks a child component to be shown when no case matches the value.
 *
 * If a component is not marked, it will default to the `<mark:default>` case.
 *
 * ## Parameters:
 * - `value`: An observer holding the switch state. Cases will be matched against
 *   its value.
 * - `cases`: Enables an alternative mode where multiple boolean observers determine
 *   the active case. This should be an object where:
 *   - Keys represent possible case values.
 *   - Values are observers, and the first truthy observer determines the active case.
 *   - If multiple observers are truthy, priority is given to the first matching key.
 *
 * Note that `value` and `cases` are mutually exclusive. The component will assert
 * if both are present.
 */
const Switch = ({children, value, cases}) => {
	assert(!value || !cases);

	if (cases) {
		const entries = Object.entries(cases);

		value = Observer
			.all(entries.map(e => Observer.immutable(e[1])))
			.map(cases => {
				for (let i = 0; i < cases.length; i++) {
					if (!cases[i]) continue;

					return entries[i][0];
				}

				return null;
			});
	}

	const defaults = [];
	const rendered = new Map();

	for (const c of children) {
		 if (c instanceof mark) {
			if (c.name === 'case') {
				let case_ = rendered.get(c.props.value);
				if (!case_) rendered.set(c.props.value, case_ = []);

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
		return rendered.get(val) ?? defaults;
	});
};

export default Switch;
