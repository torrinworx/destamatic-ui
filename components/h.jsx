import { h as destam_h, mount, getFirst} from 'destam-dom';
import Observer, {observerGetter, shallowListener} from 'destam/Observer';

import Theme from './Theme';

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

export const sizeProperties = new Set([
	'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
	'top', 'left', 'right', 'bottom',
	'margin', 'marginTop', 'marginLeft', 'marginRight', 'marginBottom',
	'padding', 'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom',
	'inset', 'borderRadius',
	'fontSize',
	'outlineWidth', 'borderWidth', 'outline', 'border',
]);

export const h = (name, props, ...children) => {
	if (typeof name === 'string') {
		name = document.createElement(name);
	}

	// Don't do anything fancy for custom nodes
	if (!(name instanceof Node)) {
		return destam_h(name, props, ...children);
	}

	const signals = [];

	if (props) {
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
			} else if (o.length >= 3 && o.startsWith('is') && o[2].toLowerCase() !== o[2]) {
				const handlers = {
					Focused: ['focus', 'blur'],
					Hovered: ['mouseenter', 'mouseleave']
				};

				const handlerName = o.substring(2);
				const handler = handlers[handlerName];
				if (!handler) {
					throw new Error("No handler for " + handlerName);
				}

				const obs = props[o];
				delete props[o];

				signals.push(() => {
					let enter = () => obs.set(true);
					let leave = () => obs.set(false);
					name.addEventListener(handler[0], enter);
					name.addEventListener(handler[1], leave);
					return () => {
						name.removeEventListener(handler[0], enter);
						name.removeEventListener(handler[1], leave);
					};
				});
			}
		}

		{
			let _class = '';
			if ('class' in props) {
				class_ = ' ' + props.class;
				delete props.class;
			}

			let theme;
			if (!props.theme) {
				theme = [];
			} else if (Array.isArray(props.theme)) {
				theme = props.theme;
			} else {
				theme = props.theme.split('_');
			}

			signals.push(() => {
				let remove;
				let removed;

				queueMicrotask(() => {
					if (removed) return;
					const cl = Theme.search(name)(...theme);

					remove = cl.effect(cl => {
						name.setAttribute('class', cl + _class);
					}).remove;
				});

				return () => {
					removed = true;
					if (remove) remove();
				};
			})

			delete props.theme;
		}

		let style = props.style;
		delete props.style;
		if (style) {
			let apply = style => {
				if (typeof style === 'string') {
					name.setAttribute('style', style);
					return;
				}

				let dynamicProps = [];

				const set = (key, value) => {
					if (value instanceof Observer) {
						dynamicProps.push([key, value]);
					} else if (typeof value === 'number' && sizeProperties.has(key)) {
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
	}

	const handler = destam_h(name, props, ...children);
	if (!signals.length) {
		return handler;
	}

	return (elem, val, before) => {
		const rem = mount(elem, handler, before);
		let sigs = signals.map(signal => signal(elem, val, before));

		return arg => {
			if (arg === getFirst) return rem(getFirst);

			rem();
			for (const sig of sigs) sig();
		};
	};
};

export const svg = (name, props, ...children) => {
	name = document.createElementNS("http://www.w3.org/2000/svg", name);
	return h(name, props, ...children);
};

/**
 * The <mark:> tag can be used anytime where you have a component that might want
 * to give special behaviour to only some of its children. The component that
 * takes in the children should loop over the children, find all marks and do
 * any processing it needs with them. It should throw an error if the component
 * does not understand a given mark.
 *
 * Mark names can be anything <mark:birthdayparty> can be a mark and it will be
 * valid. It's up to the component above it to make sure the mark is sane.
 *
 * Note that marks can also have props:
 * <mark:birthdayparty cakeFlavour="cocholate">
 *
 * The return value of a mark component looks like this:
 * {
 *    name: string,
 *    props: {
 *       children: Array,
 *       ...
 *    }
 * }
 */
export const mark = (name, props, ...children) => {
	const obj = Object.create(mark.prototype);
	obj.name = name;
	props.children = children;
	obj.props = props;
	return obj;
};

mark.prototype = Object.create(Object.prototype);
