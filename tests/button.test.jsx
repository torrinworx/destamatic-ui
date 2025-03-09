import { mount } from 'destam-dom';
import { Button } from 'destamatic-ui';
import { describe, it, expect } from 'vitest';

import './document.js';

describe('Button component', () => {
  it('should render a button with the correct label', () => {
    const elem = document.createElement('body');
    mount(elem, <Button label='Click me' />);

    // Simplified expectation: only check the structure and the text content of the button
    const tree = elem.tree();

    // Check the structure of the body
    expect(tree.name).toBe('body');
    
    // Check there's at least one child element
    expect(tree.children.length).toBeGreaterThan(0);

    // Check the first child is a button
    const button = tree.children[0];
    expect(button.name).toBe('button');
    
    // Check the button's text content
    expect(button.children).toContain('Click me');
  });
});
