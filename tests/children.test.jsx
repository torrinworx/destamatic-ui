import { mount, OArray } from 'destam-dom';
import { describe, it, expect } from 'vitest';

import './document.js';

describe('Child elements', () => {
    it('should create a list of child elements', () => {
        const elem = document.createElement("body");
        const items = OArray([1, 2]);

        mount(elem, items);

        expect(elem.tree()).toEqual({
            name: 'body',
            children: ["1", "2"],
        });
    });
});
