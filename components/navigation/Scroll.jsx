import { h } from '../utils/h.jsx';
import Theme from '../utils/Theme.jsx';
import Shown from '../utils/Shown';
import Observer from 'destam/Observer';

Theme.define({
	scroll_body: {
		position: 'relative',
	},

	scroll_bar: {
		$size: 4,

		position: 'absolute',
		right: 0,
		bottom: 0,
		width: '$size$px',
		height: '$size$px',
		borderRadius: '$div($size, 2)px',
	},

	scroll_bar_active: {
		background: '$shiftBrightness($invert($color_top), 0.4)',
	},

	scroll_body_vertical: {
		overflowY: 'hidden',
	},

	scroll_body_horizontal: {
		overflowX: 'hidden',
	},

	scroll_hovered: {
		background: '$shiftBrightness($invert($color_top), 0.6)',
	},
});

const Scroll = ({theme = "primary", children, vertical = true, horizontal = true, autoHide = true, style}, cleanup, mounted) => {
	if (!(vertical instanceof Observer)) vertical = Observer.immutable(vertical);
	if (!(horizontal instanceof Observer)) horizontal = Observer.immutable(horizontal);
	if (!(autoHide instanceof Observer)) autoHide = Observer.immutable(autoHide);

	const Div = <raw:div />;
	const Content = <raw:div />;

	const bounds = Observer.mutable();
	const scrollX = Observer.mutable(0);
	const scrollY = Observer.mutable(0);
	const active = Observer.mutable(false);
	const actuallyActive = Observer.all([active, autoHide]).map(([active, autoHide]) => !autoHide || active);

	const Bar = ({type, scroll}, cleanup) => {
		const hovered = Observer.mutable(false);
		const down = Observer.mutable(null);

		const size = bounds.map(bounds => {
			if (!bounds) return 0;

			return bounds['client_' + type] * bounds['client_' + type] / bounds['scroll_' + type];
		});

		cleanup(down.effect(event => {
			if (!event) return;

			const off = type === 'vertical' ? event.offsetY : event.offsetX;

			const update = e => {
				const b = bounds.get();
				const clientBounds = Div.getBoundingClientRect();
				const client = type === 'vertical' ? e.clientY - clientBounds.top : e.clientX - clientBounds.left;

				scroll.set(-Math.min(Math.max(0, client - off) / (b['client_' + type] - size.get()), 1)
					* (b['scroll_' + type] - b['client_' + type]));
			};

			const cancel = e => {
				update(e);
				down.set(null);
			};

			window.addEventListener('mouseup', cancel);
			window.addEventListener('mousemove', update);

			return () => {
				window.removeEventListener('mouseup', cancel);
				window.removeEventListener('mousemove', update);
			};
		}));

		return <div
			onMouseDown={e => {
				e.preventDefault();
				down.set(e);
			}}
			isHovered={hovered}
			theme={[
				theme,
				"scroll",
				"bar",
				type,
				Observer.all([actuallyActive, bounds])
					.map(([active, bounds]) => active && bounds && bounds['scroll_' + type] > bounds['client_' + type] ? 'active' : null),
				Observer.all([down, hovered]).map(([d, h]) => d || h ? 'hovered' : null),
			]}
			style={{
				[type === 'vertical' ? 'height' : 'width']: size,
				[type === 'vertical' ? 'bottom' : 'right']: 'unset',
				[type === 'vertical' ? 'top' : 'left']: Observer.all([scroll, size, bounds]).map(([scroll, size, bounds]) => {
					if (!bounds) return 0;

					const space = bounds['client_' + type];
					const usable = space - size;

					return usable * -scroll / (bounds['scroll_' + type] - space);
				})
			}}
		/>;
	};

	mounted(() => {
		const update = () => {
			bounds.set({
				scroll_horizontal: Div.scrollWidth + scrollX.get(),
				scroll_vertical: Div.scrollHeight + scrollY.get(),
				client_horizontal: Div.clientWidth,
				client_vertical: Div.clientHeight,
			});
		};

		const observer = new MutationObserver((mutationList) => {
			let changed = false;
			for (const mutation of mutationList) {
				if (mutation.target === Content) continue;
				changed = true;
			}

			if (changed) {
				update();
			}
		});
		observer.observe(Content, {subtree: true, attributes: true, childList: true});
		update();
	});

	return <Div
		theme={[
			theme,
			"scroll",
			"body",
			vertical.map(v => v ? 'vertical' : null),
			horizontal.map(v => v ? 'horizontal' : null),
		]}
		onWheel={e => {
			let x = e.deltaX;
			let y = e.deltaY;

			if (e.shiftKey) {
				let tmp = x;
				x = y;
				y = tmp;
			}

			const b = bounds.get();
			const max = type => b['client_' + type] - b['scroll_' + type];

			scrollX.set(Math.max(Math.min(scrollX.get() - x, 0), max('horizontal')));
			scrollY.set(Math.max(Math.min(scrollY.get() - y, 0), max('vertical')));
		}}
		isHovered={active}
		style={style}
	>
		<Content style={{
			position: 'relative',
			top: scrollY,
			left: scrollX,
		}}>
			{children}
		</Content>

		<Shown value={vertical}>
			<Bar type="vertical" scroll={scrollY} />
		</Shown>
		<Shown value={horizontal}>
			<Bar type="horizontal" scroll={scrollX} />
		</Shown>
	</Div>;
};

export default Scroll;
