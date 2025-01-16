import { mark } from './h';
import Observer from 'destam/Observer';
import Popup from './Popup';
import Shown from './Shown';
import ThemeContext from './ThemeContext';

import { mount } from 'destam-dom';
import trackedMount from '../../util/trackedMount';

const clamp = (x, l, h) => Math.max(l, Math.min(h, x));

const calculate = (bounds, rot) => {
	const cardinals = [
		bounds.left, bounds.top,
		bounds.right, bounds.top,
		bounds.right, bounds.bottom,
		bounds.left, bounds.bottom
	];

	const cardIndex = rot & 0x6;
	let x = cardinals[cardIndex];
	let y = cardinals[cardIndex + 1];

	const xProp = ['right', 'left'][(rot & 1) ^ (rot >> 2)];
	const yProp = ['top', 'bottom'][(rot & 1) ^ ((rot >> 1) & 1) ^ (rot >> 2)];

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

		const [focusedRender, focusedAfter] = focused.memo(2);
		cleanup(focusedAfter.effect(value => {
			if (value !== true) return;

			const bounds = popupRef.getBoundingClientRect();
			const surround = getBounds(elems);

			const ww = window.innerWidth;
			const wh = window.innerHeight;

			let fits = [];
			for (const rot of locations) {
				const calc = calculate(surround, rot);

				if ('right' in calc) calc.left = ww - calc.right - Math.min(bounds.width, calc.maxWidth);
				if ('left' in calc) calc.right = ww - calc.left - Math.min(bounds.width, calc.maxWidth);
				if ('bottom' in calc) calc.top = wh - calc.bottom - Math.min(bounds.height, calc.maxHeight);
				if ('top' in calc) calc.bottom = wh - calc.top - Math.min(bounds.height, calc.maxHeight);

				const width = clamp(ww - calc.right, 0, ww) - clamp(calc.left, 0, ww);
				const height = clamp(wh - calc.bottom, 0, wh) - clamp(calc.top, 0, wh);
				fits.push({ size: width * height, rot });
			}

			fits.sort((a, b) => b.size - a.size);

			if (!fits.length) {
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

		const Contents = ({}, cleanup, mounted) => {
			mounted(() => {
				computed.set(true);
			});

			cleanup(() => {
				computed.set(false);
			});

			return popup;
		};

		const [elems, virtual] = trackedMount(anchor);
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
						return calculate(bounds, rot);
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

Detached.TOP_LEFT_DOWN = 0;
Detached.TOP_LEFT_RIGHT = 1;
Detached.TOP_RIGHT_LEFT = 2;
Detached.TOP_RIGHT_DOWN = 3;
Detached.BOTTOM_RIGHT_UP = 4;
Detached.BOTTOM_RIGHT_LEFT = 5;
Detached.BOTTOM_LEFT_RIGHT = 6;
Detached.BOTTOM_LEFT_UP = 7;

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
