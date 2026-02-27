import { mount } from 'destam-dom';
import { describe, it, expect } from 'vitest';
import { createContext } from '@destamatic/ui';

const findText = (node, text) => {
	if (node == null) return false;
	if (typeof node === 'string') return node.includes(text);
	if (typeof node !== 'object') return false;

	const children = Array.isArray(node.children) ? node.children : [];
	return children.some(child => findText(child, text));
};

describe('Context', () => {
	it('Should use default value when no provider exists', () => {
		const elem = document.createElement('body');
		const Context = createContext('default');
		const Consumer = Context.use(value => () => <div>{value}</div>);

		mount(elem, <Consumer />);
		const tree = elem.tree();

		expect(findText(tree, 'default')).toBe(true);
	});

	it('Should provide transformed value and parent value to consumers', () => {
		const elem = document.createElement('body');
		const Context = createContext('base', (raw, parent) => ({ raw, parent }));
		let seen = null;

		const Consumer = Context.use(value => () => {
			seen = value;
			return <div />;
		});

		mount(elem, (
			<Context value="parent">
				<Context value="child">
					<Consumer />
				</Context>
			</Context>
		));

		expect(seen).not.toBeNull();
		expect(seen.raw).toBe('child');
		expect(seen.parent.raw).toBe('parent');
		expect(seen.parent.parent).toBe('base');
	});

	it('Should track child providers in the parent children list', () => {
		const elem = document.createElement('body');
		const Context = createContext(null, (raw, parent, children) => ({ raw, parent, children }));
		let parentValue = null;

		const ParentCapture = Context.use(value => () => {
			parentValue = value;
			return <div />;
		});

		mount(elem, (
			<Context value="root">
				<ParentCapture />
				<Context value="child">
					<div>Child</div>
				</Context>
			</Context>
		));

		expect(parentValue).not.toBeNull();
		expect(parentValue.children.length).toBe(1);
	});
});
