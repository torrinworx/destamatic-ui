import { h as destam_h, mount} from 'destam-dom';
import Observer, {observerGetter, shallowListener} from 'destam/Observer';

// This h element overrides the default behavoior that destam-dom gives for
// overriding styles. destam-dom will never try to be more fancy than the browser
// let's us be if it means adding extra logic to the library. However, we can
// make our own extensions on top of destam-dom to add features we may want.
//
// This custom implementation adds these features on top of those already added
// by destam-dom:
// 1. Support for onClick/onInput style event listeners.
// 2. Support for OObjects as style objects and removing footguns there.
// 3. Numbers in the style will be interpreted as pxs
// From: https://github.com/Nefsen402/destam-dom/blob/main/examples/custom-h.jsx

const h = (name, props, ...children) => {
	if (typeof name === 'string') {
		name = document.createElement(name);
	}

	// Don't do anything fancy for custom nodes
	if (!(name instanceof Node)) {
		return destam_h(name, props, ...children);
	}

	const signals = [];

	// handle onEvent properties
	for (const o of Object.keys(props)) {
		if (o.length >= 3 && o.startsWith('on') && o[2].toLowerCase() !== o[2]) {
			const handler = props[o];
			const handlerName = o.substring(2).toLowerCase();
			delete props[o];

			signals.push(() => {
				name.addEventListener(handlerName, handler);
				return () => name.removeEventListener(handlerName, handler);
			});
		}
	}

	let style = props.style;
	delete props.style;
	if (style) {
		let apply = style => {
			if (typeof style === 'string') {
				return style;
			}

			let dynamicProps = [];

			const set = (key, value) => {
				if (value instanceof Observer) {
					dynamicProps.push([key, value]);
				} else if (typeof value === 'number') {
					name.style[key] = value + 'px';
				} else {
					name.style[key] = value;
				}
			};

			const reset = () => {
				// clear the old styles
				name.setAttribute('style', "");

				// set new styles
				for (let o of Object.keys(style)) {
					set(o, style[o]);
				}
			};

			reset();
			if (!style[observerGetter] && dynamicProps.length === 0) {
				return null;
			}

			return () => {
				const propListeners = new Map();
				const dynamicSet = (key, value) => {
					if (propListeners.has(key)) {
						propListeners.get(key)();
						propListeners.delete(key);
					}

					propListeners.set(key, shallowListener(value, () => set(key, value.get())));
					set(key, value.get());
				};

				for (const [key, value] of dynamicProps) {
					dynamicSet(key, value);
				}

				const observer = style[observerGetter] &&
						shallowListener(style[observerGetter], commit => {
					// has the entire object been switched out?
					for (let delta of commit) {
						if (delta.getParent() !== style) {
							reset();
							return;
						}
					}

					for (let delta of commit) {
						if (delta.value instanceof Observer) {
							dynamicSet(delta.ref, delta.value);
						} else {
							set(delta.ref, delta.value);
						}
					}
				});

				return () => {
					if (observer) observer();
					for (let l of propListeners.values()) l();
				};
			};
		};

		if (style instanceof Observer) {
			let removeListener;
			signals.push(() => shallowListener(style, () => {
				const listener = apply(style.get());
				removeListener = listener && listener();
			}));

			const listener = apply(style.get());
			signals.push(() => {
				removeListener = listener && listener();
				return () => removeListener && removeListener();
			});
		} else {
			const listener = apply(style);
			if (listener) signals.push(listener);
		}
	}

	const handler = destam_h(name, props, ...children);
	if (!signals.length) {
		return handler;
	}

	return (elem, val, before) => {
		const rem = mount(elem, handler, before);
		let sigs = signals.map(signal => signal());

		return () => {
			rem();
			for (const sig of sigs) sig();
		};
	};
};

export default h;
