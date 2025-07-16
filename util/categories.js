import { mark } from '../components/utils/h';

export default (children, categories, def) => {
	const out = [];
	const maps = new Map();
	for (const cat of categories) {
		const arr = [];
		out.push(arr);
		maps.set(cat, arr);
	}

	for (const child of children) {
		if (child instanceof mark) {
			const arr = maps.get(child.name);
			if (!arr) {
				throw new Error("Element accepts the following marks: " + categories.join(", "));
			}

			arr.push(...child.props.children);
		} else if (def) {
			maps.get(def).push(child);
		} else {
			throw new Error("Element does not accept toplevel elements. Marks of the following must be provided: " + categories.join(", "))
		}
	}

	return out;
};