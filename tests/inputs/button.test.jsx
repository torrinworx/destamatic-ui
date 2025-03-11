import { mount } from 'destam-dom';
import { Button } from 'destamatic-ui';
import { describe, it, expect, vi } from 'vitest';

describe('Button', () => {
	it('Should render a Button.', () => {
		const elem = document.createElement('body');
		mount(elem, <Button />);
		const tree = elem.tree();

		// Check there's at least one child element
		expect(tree.children.length).toBeGreaterThan(0);

		const button = tree.children[0];

		// Check the first child is a button
		expect(button.name).toBe('button');

		// Check that all button's event listeners exist
		const expectedListeners = [
			'click',
			'mousedown',
			'mouseup',
			'keydown',
			'focus',
			'blur',
			'mouseenter',
			'mouseleave'
		];
		const eventListeners = button.eventListeners;
		expectedListeners.forEach(listener => {
			expect(eventListeners).toHaveProperty(listener);
			expect(Array.isArray(eventListeners[listener])).toBe(true);
		});
	});

	it('Should render a button with a label.', () => {
		const elem = document.createElement('body');
		const testLabel = 'Submit';
		mount(elem, <Button label={testLabel} />);

		const tree = elem.tree();

		// Check there's a button present
		expect(tree.children.length).toBeGreaterThan(0);

		const button = tree.children[0];
		expect(button.name).toBe('button');

		// Check the button's text content is the new label
		expect(button.children).toContain(testLabel);
	});

	it('Should render all button types without error', () => {
		const elem = document.createElement('body');
		const buttonTypes = ['text', 'contained', 'outlined'];

		buttonTypes.forEach(type => {
			mount(elem, <Button type={type} />);
			const tree = elem.tree();
			const button = tree.children[0];

			expect(button.name).toBe('button');

			elem.innerHTML = '';
		});
	});

	it('Should call onMouseDown, onMouseUp, and onClick when triggered', () => {
		const elem = document.createElement('body');
	  
		// Create mock functions
		const onMouseDownMock = vi.fn();
		const onMouseUpMock = vi.fn();
		const onClickMock = vi.fn();
	  
		// Mount a Button with these props
		mount(elem, (
		  <Button
			onMouseDown={onMouseDownMock}
			onMouseUp={onMouseUpMock}
			onClick={onClickMock}
		  />
		));
	  
		// Retrieve node and event listeners
		const tree = elem.tree();
		const button = tree.children[0];
		
		// Provide a minimal event object that won't crash Ripple (rippe throws a hissy fit)
		const fakeEvent = {
		  currentTarget: {
			getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 })
		  },
		  target: {
			getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 })
		  }
		};
	  
		// Trigger the listeners with fakeEvent
		button.eventListeners.mousedown.forEach(handler => handler(fakeEvent));
		button.eventListeners.mouseup.forEach(handler => handler(fakeEvent));
		button.eventListeners.click.forEach(handler => handler(fakeEvent));
	  
		// Check if our mock functions were called
		expect(onMouseDownMock).toHaveBeenCalled();
		expect(onMouseUpMock).toHaveBeenCalled();
		expect(onClickMock).toHaveBeenCalled();
	  });
});
