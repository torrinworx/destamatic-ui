import { mount } from 'destam-dom';
import { Checkbox } from 'destamatic-ui';
import { describe, it, expect, vi } from 'vitest';
import { Observer } from 'destam-dom';

// Provide a minimal event object that won't crash Ripple (ripple throws a hissy fit)
const fakeEvent = {
	currentTarget: {
		getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 })
	},
	target: {
		getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 })
	},
	preventDefault: () => {},
};

describe('Checkbox', () => {
	it('Should render a Checkbox.', () => {
		const elem = document.createElement('body');
		mount(elem, <Checkbox />);
		const tree = elem.tree();

		// Check there's a wrapper element
		expect(tree.children.length).toBeGreaterThan(0);

		const wrapper = tree.children[0];

		// Check the first child is a div with checkboxwrapper theme
		expect(wrapper.name).toBe('div');
		expect(wrapper.attributes.class).toContain('checkboxwrapper');

		// Check there's a span inside the wrapper
		const span = wrapper.children.find(child => child.name === 'span');
		expect(span).toBeTruthy();
	});

	it('Should toggle checkbox state on mouse down', () => {
		const elem = document.createElement('body');
		const value = Observer.mutable(false);

		mount(elem, <Checkbox value={value} />);

		const tree = elem.tree();
		const wrapper = tree.children[0];
		const span = wrapper ? wrapper.children.find(child => child.name === 'span') : null;

		expect(span).not.toBeNull();

		if (span) {
			span.eventListeners.mousedown.forEach(handler => handler(fakeEvent));
			expect(value.get()).toBe(true);
		}
	});

	it('Should not toggle state when disabled', () => {
		const elem = document.createElement('body');
		const value = Observer.mutable(false);

		mount(elem, <Checkbox value={value} disabled={true} />);

		const tree = elem.tree();
		const wrapper = tree.children[0];
		const span = wrapper ? wrapper.children.find(child => child.name === 'span') : null;

		expect(span).not.toBeNull();

		if (span) {
			span.eventListeners.mousedown.forEach(handler => handler(fakeEvent));
			expect(value.get()).toBe(false);
		}
	});

	it('Should call onChange callback with correct value', () => {
		const elem = document.createElement('body');
		const onChangeMock = vi.fn();
		const value = Observer.mutable(false);

		mount(elem, <Checkbox value={value} onChange={onChangeMock} />);

		const tree = elem.tree();
		const wrapper = tree.children[0];
		const span = wrapper ? wrapper.children.find(child => child.name === 'span') : null;

		expect(span).not.toBeNull();

		if (span) {
			span.eventListeners.mousedown.forEach(handler => handler(fakeEvent));
			expect(onChangeMock).toHaveBeenCalledWith(true);
		}
	});
});
