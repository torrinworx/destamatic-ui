import { mount } from 'destam-dom';
import { TextField } from '@destamatic/ui';
import { describe, it, expect, vi } from 'vitest';
import Observer from 'destam/Observer';

const createInputEvent = (value = '') => ({
	currentTarget: {
		getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 })
	},
	target: {
		value,
		getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 })
	},
	preventDefault: vi.fn(),
});

describe('TextField', () => {
	it('Should render a TextField input', () => {
		const elem = document.createElement('body');
		mount(elem, <TextField />);
		const tree = elem.tree();

		expect(tree.children.length).toBeGreaterThan(0);
		const input = tree.children[0];
		expect(input.name).toBe('input');
	});

	it('Should set aria-label from placeholder when missing', () => {
		const elem = document.createElement('body');
		mount(elem, <TextField placeholder="Email" />);
		const tree = elem.tree();
		const input = tree.children[0];

		expect(input.attributes['aria-label']).toBe('Email');
	});

	it('Should update mutable value on input', () => {
		const elem = document.createElement('body');
		const value = Observer.mutable('');
		const event = createInputEvent('hello');

		mount(elem, <TextField value={value} />);
		const tree = elem.tree();
		const input = tree.children[0];

		input.eventListeners.input.forEach(handler => handler(event));
		expect(value.get()).toBe('hello');
	});

	it('Should not update immutable value and should reset input value', () => {
		const elem = document.createElement('body');
		const event = createInputEvent('oops');

		mount(elem, <TextField value="locked" />);
		const input = elem.childNodes[0];

		input.eventListeners.input.forEach(handler => handler(event));
		expect(input.value).toBe('locked');
	});

	it('Should prevent input changes when disabled', () => {
		const elem = document.createElement('body');
		const value = Observer.mutable('');
		const event = createInputEvent('nope');

		mount(elem, <TextField value={value} disabled={true} />);
		const tree = elem.tree();
		const input = tree.children[0];

		input.eventListeners.input.forEach(handler => handler(event));
		expect(value.get()).toBe('');
	});

	it('Should call onEnter and prevent default', () => {
		const elem = document.createElement('body');
		const onEnterMock = vi.fn();
		const event = createInputEvent();
		event.key = 'Enter';

		mount(elem, <TextField onEnter={onEnterMock} />);
		const tree = elem.tree();
		const input = tree.children[0];

		input.eventListeners.keydown.forEach(handler => handler(event));
		expect(onEnterMock).toHaveBeenCalledWith(event);
		expect(event.preventDefault).toHaveBeenCalled();
	});

	it('Should prevent key input when value is immutable', () => {
		const elem = document.createElement('body');
		const event = createInputEvent();
		event.key = 'a';

		mount(elem, <TextField value="locked" />);
		const tree = elem.tree();
		const input = tree.children[0];

		input.eventListeners.keydown.forEach(handler => handler(event));
		expect(event.preventDefault).toHaveBeenCalled();
	});

	it('Should render password type when password is true', () => {
		const elem = document.createElement('body');
		mount(elem, <TextField password={true} />);
		const tree = elem.tree();
		const input = tree.children[0];

		expect(input.attributes.type).toBe('password');
	});
});
