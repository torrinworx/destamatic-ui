import { mount } from 'destam-dom';
import { describe, it, expect } from 'vitest';

import h from '../components/utils/h.jsx';
import Button from '../components/inputs/Button.jsx';

import './document.js';

describe('Button component', () => {
    it('should render a button with the correct label', () => {
        const elem = document.createElement('body');

        // Rendering the Button inside the body element
        mount(elem, h('div', {}, h(Button, { label: 'Click me' })));

        console.log(elem.tree());
        expect(elem.tree()).toEqual({
            name: 'body',
            children: [{
                name: 'div',
                children: [{
                    name: 'button',
                    children: ['Click me']
                }]
            }]
        });
    });
});
