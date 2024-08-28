import {mark} from './h';
import Observer from 'destam/Observer';

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
