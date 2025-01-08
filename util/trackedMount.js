import { OArray, mount } from 'destam-dom';
import { atomic } from 'destam/Network';

const trackedMount = (children) => {
	const elems = OArray();

	const node = {
		insertBefore: (node, before) => atomic(() => {
			const nodePos = elems.indexOf(node);
			const beforePos = before ? elems.indexOf(before) : elems.length;

			if (nodePos >= 0) {
				if (nodePos === beforePos - 1) return;
				elems.splice(nodePos, 1);
			}

			elems.splice(beforePos, 0, node);
		}),
		replaceChild: (newNode, oldNode) => atomic(() => {
			let i;

			i = elems.indexOf(newNode);
			if (i >= 0) elems.splice(i, 1);

			i = elems.indexOf(oldNode);
			elems[i] = newNode;
		}),
		removeChild: (node) => {
			const i = elems.indexOf(node);
			elems.splice(i, 1);
		},
	};

	// insert a virtual element here to manage the context and cleanup.
	const virtual = (elem, item, before, context) => {
		return mount(node, children, () => null, context);
	};

	return [elems, virtual];
};

export default trackedMount;
