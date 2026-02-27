import { mount } from 'destam-dom';
import { Toggle } from '@destamatic/ui';
import { describe, it, expect, vi } from 'vitest';
import { Observer } from 'destam-dom';

const createFakeEvent = () => ({
	currentTarget: {
		getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 })
	},
	target: {
		getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 })
	},
	preventDefault: vi.fn(),
});

const findNodeByName = (node, name) => {
	if (!node || typeof node !== 'object') return null;
	if (node.name === name) return node;

	const children = Array.isArray(node.children) ? node.children : [];
	for (const child of children) {
		const found = findNodeByName(child, name);
		if (found) return found;
	}

	return null;
};

describe('Toggle', () => {
	it('Should render a Toggle with switch role', () => {
		const elem = document.createElement('body');
		mount(elem, <Toggle />);
		const tree = elem.tree();

		expect(tree.children.length).toBeGreaterThan(0);

		const toggle = tree.children[0];
		expect(toggle.name).toBe('button');
		expect(toggle.attributes.role).toBe('switch');

		const thumb = findNodeByName(toggle, 'span');
		expect(thumb).not.toBeNull();
	});

	it('Should toggle value on click', () => {
		const elem = document.createElement('body');
		const value = Observer.mutable(false);
		const fakeEvent = createFakeEvent();

		mount(elem, <Toggle value={value} />);

		const tree = elem.tree();
		const toggle = tree.children[0];

		toggle.eventListeners.click.forEach(handler => handler(fakeEvent));
		expect(value.get()).toBe(true);
	});

	it('Should call onChange and onClick handlers', () => {
		const elem = document.createElement('body');
		const value = Observer.mutable(false);
		const onChangeMock = vi.fn();
		const onClickMock = vi.fn();
		const fakeEvent = createFakeEvent();

		mount(elem, (
			<Toggle
				value={value}
				onChange={onChangeMock}
				onClick={onClickMock}
			/>
		));

		const tree = elem.tree();
		const toggle = tree.children[0];

		toggle.eventListeners.click.forEach(handler => handler(fakeEvent));

		expect(onChangeMock).toHaveBeenCalledWith(true, fakeEvent);
		expect(onClickMock).toHaveBeenCalledWith(fakeEvent);
	});

	it('Should not toggle when disabled', () => {
		const elem = document.createElement('body');
		const value = Observer.mutable(false);
		const onChangeMock = vi.fn();
		const onClickMock = vi.fn();
		const fakeEvent = createFakeEvent();

		mount(elem, (
			<Toggle
				value={value}
				disabled={true}
				onChange={onChangeMock}
				onClick={onClickMock}
			/>
		));

		const tree = elem.tree();
		const toggle = tree.children[0];

		toggle.eventListeners.click.forEach(handler => handler(fakeEvent));

		expect(value.get()).toBe(false);
		expect(onChangeMock).not.toHaveBeenCalled();
		expect(onClickMock).not.toHaveBeenCalled();
	});
});
