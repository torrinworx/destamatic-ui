import { mount } from 'destam-dom';
import { Button } from 'destamatic-ui';
import { describe, it, expect } from 'vitest';

describe('Inputs/Button', () => {
	it('Renders a Button.', () => {
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
});
