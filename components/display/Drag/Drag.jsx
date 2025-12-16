import { h } from '../../utils/h.jsx';
import Theme from '../../utils/Theme.jsx';
import { OArray, Observer } from 'destam-dom';
import { assert } from 'destam/util';
import { OArray as DestamOArray } from 'destam';
import { atomic } from 'destam/Network';
import { Insert, Delete } from 'destam';
import useAbort from '../../../util/abort.js';
import ThemeContext from '../../utils/ThemeContext.jsx';

const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

Theme.define({
	drag: {
		position: 'relative',
	},

	drag_item: {
		position: 'absolute',
		transition: 'top 250ms ease-in-out',
	},
});

export default ThemeContext.use(h => {
	const Drag = ({dragging, children, map, constrained = true, ...props}, cleanup, mounted) => {
		assert(children.length === 1, "Drag can only have one child");

		const array = children[0];
		assert(array instanceof OArray || array instanceof DestamOArray,
			"Drag only supports one child being an instance of OArray");

		const renderDragging = dragging.map(drag => {
			if (!drag) return null;

			let index;
			let target = drag.target;
			while (target) {
				if (target.parentElement === Ref) {
					index = rendered.findIndex(item => item.wrapper === target);
					break;
				}

				target = target.parentElement;
			}

			assert(index !== -1, "Could not find clicked drag component. Maybe the dragging observer is being set with something unrelated");

			const render = rendered[index];
			atomic(() => {
				rendered.splice(index, 1);
				rendered.push(render);
			});

			return render;
		});

		const draggingSelector = renderDragging.selector();

		const Elem = ({each}) => {
			const {elem, mounted, pos, wrapper: Div} = each;
			return <Div theme={['drag', 'item']} style={{
				visibility: mounted.map(m => m ? 'visible' : 'hidden'),
				top: Observer.all([pos, totalHeight]).map(([val, height]) => {
					if (constrained && mounted.get()) {
						val = clamp(val, 0, height - each.bounds.height);
					}

					return val + 'px';
				}),
				// disable transitions when dragging or isn't mounted yet
				transition: Observer.all([mounted.wait(100), draggingSelector(each)]).map(([mounted, dragging]) => {
					if (!mounted || dragging) return 'none';
					return null;
				})
			}}>
				{elem}
			</Div>;
		};

		const Ref = <raw:div />;

		const totalHeight = Observer.mutable(0);

		const createRender = (elem) => {
			const out = {
				mounted: Observer.mutable(false),
				pos: Observer.mutable(0),
				elem: map ? map(elem) : elem,
				raw: elem,
				wrapper: <raw:div />,
			};

			const observer = new MutationObserver((mutationList) => {
				if (!out.mounted.get()) return;

				let changed = false;
				for (const mutation of mutationList) {
					if (mutation.target === out.wrapper) continue;

					changed = true;
				}

				if (changed) {
					out.bounds = out.wrapper.getBoundingClientRect();
					resort();
				}
			});

			observer.observe(out.wrapper, {subtree: true, attributes: true, childList: true});
			out.observer = observer;

			return out;
		};

		const rendered = OArray(array.map(createRender));
		let isMounted = false;

		const ownChange = Symbol();
		cleanup(array.observer.shallow(1).watchCommit((deltas, meta) => {
			if (meta === ownChange) return;

			for (const delta of deltas) {
				if (delta instanceof Insert) {
					const item = createRender(delta.value);
					rendered.push(item);

					if (isMounted) {
						item.mounted.set(true);
						item.bounds = item.wrapper.getBoundingClientRect();
					}
				} else if (delta instanceof Delete) {
					const index = rendered.findIndex(({raw}) => raw === delta.prev);
					rendered[index].observer.disconnect();
					rendered.splice(index, 1);
				}
			}

			if (!isMounted) return;

			let pos = 0;
			for (const item of array) {
				const render = rendered.find(({raw}) => raw === item);

				render.pos.set(pos);
				pos += render.bounds.height;
			}

			totalHeight.set(pos);
		}));

		mounted(() => {
			for (const child of Ref.children) {
				const render = rendered.find(item => item.wrapper === child);
				render.bounds = child.getBoundingClientRect();
			}

			let pos = 0;
			for (const item of rendered) {
				item.pos.set(pos);
				pos += item.bounds.height;

				item.mounted.set(true);
			}

			totalHeight.set(pos);
			isMounted = true;
		});

		cleanup(() => {
			for (const item of rendered) {
				item.observer.disconnect();
			}
		});

		const resort = (render) => {
			// we need to resort the array
			const sorted = rendered.toSorted((a, b) => {
				const centerA = a.bounds.height / 2 + a.pos.get();
				const centerB = b.bounds.height / 2 + b.pos.get();

				return centerA - centerB;
			});

			let pos = 0;
			for (const item of sorted) {
				if (item !== render) {
					item.pos.set(pos);
				}

				pos += item.bounds.height;
			}

			totalHeight.set(pos);

			// don't overwrite the array when nothing was actually resorted
			let dif = false;
			for (let i = 0; i < array.length; i++) {
				if (array[i] !== sorted[i].raw) {
					dif = true;
					break;
				}
			}

			if (dif) {
				atomic(() => {
					array.splice(0, array.length, ...sorted.map(item => item.raw));
				}, ownChange);
			}
		};

		cleanup(renderDragging.effect(useAbort((signal, render) => {
			if (!render) return;

			const moveRender = (e, resortRender) => {
				render.pos.set(render.pos.get() + e.movementY);
				resort(resortRender);
			};

			const move = e => {
				moveRender(e, render);
			};

			const cancel = e => {
				dragging.set(null);
				moveRender(e, null);
			};

			window.addEventListener('mousemove', move, {signal});
			window.addEventListener('mouseup', cancel, {signal});
		})));

		return <Ref theme={[theme, 'drag']} style={{height: totalHeight}} {...props}><Elem each={rendered} /></Ref>;
	};

	return Drag;
});
