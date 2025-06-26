import { mark } from './h';
import Observer from 'destam/Observer';
import Popup from './Popup';
import Shown from './Shown';
import ThemeContext from './ThemeContext';

import { mount } from 'destam-dom';
import trackedMount from '../../util/trackedMount';

const clamp = (x, l, h) => Math.max(l, Math.min(h, x));

const calculate = (bounds, rot, popup) => {
	rot--;

	let x, y;
	let xProp, yProp;
	if (rot < 8) {
		const cardinals = [
			bounds.left, bounds.top,
			bounds.right, bounds.top,
			bounds.right, bounds.bottom,
			bounds.left, bounds.bottom
		];

		const cardIndex = rot & 0x6;
		x = cardinals[cardIndex];
		y = cardinals[cardIndex + 1];

		xProp = ['right', 'left'][(rot & 1) ^ (rot >> 2)];
		yProp = ['top', 'bottom'][(rot & 1) ^ ((rot >> 1) & 1) ^ (rot >> 2)];
	} else {
		// check if there is enough space for this configuration.
		if ([
			bounds.top,
			window.innerWidth - bounds.right,
			window.innerHeight - bounds.bottom,
			bounds.left,
		][rot - 8] < (rot & 1 ? popup.width : popup.height)) {
			return null;
		}

		xProp = ['left', 'left', 'left', 'right'][rot - 8];
		yProp = ['bottom', 'top', 'top', 'top'][rot - 8];

		x = (rot & 1) ?
			(rot & 2 ? bounds.left : bounds.right) :
			bounds.left + bounds.width / 2 - popup.width / 2;

		y = (rot & 1) ?
			bounds.top + bounds.height / 2 - popup.height / 2 :
			(rot & 2) ? bounds.bottom : bounds.top;

		if (rot & 1) {
			y = clamp(y, 0, window.innerHeight - popup.height);
		} else {
			x = clamp(x, 0, window.innerWidth - popup.width);
		}
	}

	if (xProp === 'right') {
		x = window.innerWidth - x;
	}

	if (yProp === 'bottom') {
		y = window.innerHeight - y;
	}

	return {
		[xProp]: x,
		[yProp]: y,
		maxWidth: window.innerWidth - x,
		maxHeight: window.innerHeight - y,
	};
};

const getBounds = (elems) => {
	let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;

	for (const elem of elems) {
		const bounds = elem.getBoundingClientRect();

		left = Math.min(left, bounds.left);
		right = Math.max(right, bounds.right);
		top = Math.min(top, bounds.top);
		bottom = Math.max(bottom, bounds.bottom);
	}

	return {
		left, right, top, bottom,
		width: right - left,
		height: bottom - top,
	};
};

const Detached = ThemeContext.use(h => {
	const Detached = ({ children, locations = defaultLocations, enabled }, cleanup) => {
		const focused = enabled || Observer.mutable(false);
		const popupRef = <raw:div />;
		const computed = Observer.mutable(false);

		const popup = [];
		const anchor = [];
		for (const child of children) {
			if (child instanceof mark) {
				if (child.name === 'popup') {
					popup.push(...child.props.children);
				} else if (child.name === 'anchor') {
					anchor.push(...child.props.children);
				} else {
					throw new Error("Detached only accepts popup and anchor mark elements");
				}
			} else {
				anchor.push(child);
			}
		}

		const [elems, virtual] = trackedMount(anchor);

		const [focusedRender, focusedAfter] = focused.memo(2);
		cleanup(focusedAfter.effect(value => {
			if (value !== true) return;

			const bounds = popupRef.getBoundingClientRect();
			const surround = getBounds(elems);

			const ww = window.innerWidth;
			const wh = window.innerHeight;

			let fits = [];
			for (const rot of locations) {
				const calc = calculate(surround, rot, bounds);

				// an impossible orientation - ignore
				if (!calc) continue;
				if ('right' in calc) calc.left = ww - calc.right - Math.min(bounds.width, calc.maxWidth);
				if ('left' in calc) calc.right = ww - calc.left - Math.min(bounds.width, calc.maxWidth);
				if ('bottom' in calc) calc.top = wh - calc.bottom - Math.min(bounds.height, calc.maxHeight);
				if ('top' in calc) calc.bottom = wh - calc.top - Math.min(bounds.height, calc.maxHeight);

				if (rot <= 8) {
					const width = clamp(ww - calc.right, 0, ww) - clamp(calc.left, 0, ww);
					const height = clamp(wh - calc.bottom, 0, wh) - clamp(calc.top, 0, wh);
					fits.push({ weight: width * height, rot });
				} else {
					// score the best configuration based on how close the popup is to its anchor point
					const x = (calc.left + (ww - calc.right)) / 2 - surround.left
						- surround.width * [.5, 1, .5, 0][rot - 9];
					const y = (calc.top + (wh - calc.bottom)) / 2 - surround.top
						- surround.height * [0, .5, 1, .5][rot - 9];

					fits.push({ weight: 1 / Math.sqrt(x * x + y * y), rot });
				}
			}

			fits.sort((a, b) => b.weight - a.weight);

			if (!fits.length) {
				console.warn("Could not place detached component because it didn't find a possible configuration");
				focused.set(false);
			} else {
				focused.set(fits[0].rot);

				let checking = true;
				const check = () => {
					if (checking) {
						const updated = getBounds(elems);

						if (surround.left !== updated.left ||
							surround.right !== updated.right ||
							surround.top !== updated.top ||
							surround.bottom !== updated.bottom) {
							focused.set(false);
							return;
						}

						window.requestAnimationFrame(check);
					}
				};
				window.requestAnimationFrame(check);

				// poll the bounds for changes - if something changes we will hide the modal
				return () => {
					checking = false;
				};
			}
		}));

		const Contents = (_, cleanup, mounted) => {
			mounted(() => {
				computed.set(true);
			});

			cleanup(() => {
				computed.set(false);
			});

			return popup;
		};

		return <>
			{virtual}
			{elems}
			<Shown value={focusedRender.map(v => typeof v === 'number' || v === true)}>
				<Popup
					canClose={e => {
						let current = e.target;

						while (current) {
							if (elems.includes(current)) return false;
							current = current.parentElement;
						}

						return true;
					}}
					ref={popupRef}
					placement={focusedAfter.map(rot => {
						if (typeof rot !== 'number') return null;

						const bounds = getBounds(elems);
						return calculate(bounds, rot, popupRef.getBoundingClientRect());
					}).setter(() => focused.set(false))}
					style={{
						visibility: computed.map(c => c ? 'visible' : 'hidden'),
					}}
				>
					<Contents />
				</Popup>
			</Shown>
		</>;
	};

	return Detached;
});

// modes that will anchor the popup to a corner of the anchor content
Detached.TOP_LEFT_DOWN = 1;
Detached.TOP_LEFT_RIGHT = 2;
Detached.TOP_RIGHT_LEFT = 3;
Detached.TOP_RIGHT_DOWN = 4;
Detached.BOTTOM_RIGHT_UP = 5;
Detached.BOTTOM_RIGHT_LEFT = 6;
Detached.BOTTOM_LEFT_RIGHT = 7;
Detached.BOTTOM_LEFT_UP = 8;

// modes that will anchor the popup to a side of the ancher content. These
// modes should not be mixed with ones above.
Detached.TOP_CENTER = 9;
Detached.RIGHT_CENTER = 10;
Detached.BOTTOM_CENTER = 11;
Detached.LEFT_CENTER = 12;

const defaultLocations = [
	Detached.BOTTOM_LEFT_RIGHT,
	Detached.BOTTOM_RIGHT_LEFT,
	Detached.TOP_LEFT_RIGHT,
	Detached.TOP_RIGHT_LEFT,
	Detached.TOP_LEFT_DOWN,
	Detached.BOTTOM_LEFT_UP,
	Detached.TOP_RIGHT_DOWN,
	Detached.BOTTOM_RIGHT_UP,
];

export default Detached;
