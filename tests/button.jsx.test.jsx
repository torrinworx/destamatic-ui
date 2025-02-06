import {test} from 'node:test';
import assert from 'node:assert';
import './document.js';

import { Observer, OArray, mount, h } from 'destam-dom';
import { atomic } from 'destam/Network.js';

import Button from '../components/inputs/Button.jsx';

test("array item swap", () => {
	const elem = document.createElement("body");
	const items = OArray();

	mount(elem, items);

	items.push(1, 2, 3, 4, 5);
	atomic(() => {
		let tmp = items[1];
		items[1] = items[3];
		items[3] = tmp;
	});

	assert.deepEqual(elem.tree(), {
		name: 'body',
		children: "1 4 3 2 5".split(" "),
	});
});