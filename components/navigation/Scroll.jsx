import Theme from '../utils/Theme.jsx';
import ThemeContext from '../utils/ThemeContext.jsx';
import Shown from '../utils/Shown';
import Observer from 'destam/Observer';
import useAbort from '../../util/abort';

Theme.define({
	scroll_body: {
		position: 'relative',
		overflow: 'visible',
	},

	scroll_bar: {
		$size: 4,

		position: 'absolute',
		right: 0,
		bottom: 0,
		width: '$size$px',
		height: '$size$px',
		borderRadius: '$div($size, 2)px',
		pointerEvents: 'none',
	},

	scroll_bar_active: {
		background: '$shiftBrightness($invert($color_top), 0.4)',
		pointerEvents: 'auto',
	},

	scroll_body_vertical: {
		overflowY: 'clip',
	},

	scroll_body_horizontal: {
		overflowX: 'clip',
	},

	scroll_hovered: {
		background: '$shiftBrightness($invert($color_top), 0.6)',
	},
});

export default ThemeContext.use(h => {
	const Scroll = ({ children, vertical = true, horizontal = true, autoHide = true, invertScroll = false, style }, cleanup, mounted) => {
		if (!(vertical instanceof Observer)) vertical = Observer.immutable(vertical);
		if (!(horizontal instanceof Observer)) horizontal = Observer.immutable(horizontal);
		if (!(autoHide instanceof Observer)) autoHide = Observer.immutable(autoHide);
		if (!(invertScroll instanceof Observer)) invertScroll = Observer.immutable(invertScroll);

		const Div = <raw:div />;
		const Content = <raw:div />;

		const bounds = Observer.mutable();
		const scrollX = Observer.mutable(0);
		const scrollY = Observer.mutable(0);
		const active = Observer.mutable(false);
		const actuallyActive = Observer.all([active, autoHide]).map(([active, autoHide]) => !autoHide || active);

		const move = (x, y) => {
			const b = bounds.get();
			const max = type => b['client_' + type] - b['scroll_' + type];

			if (horizontal.get()) scrollX.set(Math.min(Math.max(x, max('horizontal')), 0));
			if (vertical.get()) scrollY.set(Math.min(Math.max(y, max('vertical')), 0));
		};

		const Bar = ({ type, scroll }, cleanup) => {
			const hovered = Observer.mutable(false);
			const down = Observer.mutable(null);

			const size = bounds.map(bounds => {
				if (!bounds) return 0;

				return bounds['client_' + type] * bounds['client_' + type] / bounds['scroll_' + type];
			});

			cleanup(down.effect(useAbort((signal, event) => {
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

				window.addEventListener('mouseup', cancel, { signal });
				window.addEventListener('mousemove', update, { signal });
			})));

			return <div
				onMouseDown={e => {
					e.preventDefault();
					down.set(e);
				}}
				isHovered={hovered}
				theme={[
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

		const wheel = e => {
			e.preventDefault();

			let x = e.deltaX;
			let y = e.deltaY;

			if (e.shiftKey === !invertScroll.get()) {
				let tmp = x;
				x = y;
				y = tmp;
			}

			move(scrollX.get() - x, scrollY.get() - y);
		};

		mounted(() => {
			const update = () => {
				bounds.set({
					scroll_horizontal: Content.clientWidth,
					scroll_vertical: Content.clientHeight,
					client_horizontal: Div.clientWidth,
					client_vertical: Div.clientHeight,
				});

				move(scrollX.get(), scrollY.get());
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
			observer.observe(Content, { subtree: true, attributes: true, childList: true });
			update();

			cleanup(useAbort(signal => {
				window.addEventListener('resize', update, { signal });
			})())
		});

		return <Div
			theme={[
				"scroll",
				"body",
				vertical.map(v => v ? 'vertical' : null),
				horizontal.map(v => v ? 'horizontal' : null),
			]}
			onWheel={wheel}
			onMouseWheel={wheel}
			isHovered={active}
			style={style}
		>
			<Content
				style={{
					position: 'relative',
					top: scrollY,
					left: scrollX,
					display: 'inline-block',
					minWidth: '100%',
					textWrap: vertical.map(v => v ? 'wrap' : 'nowrap'),
				}}
			>
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

	return Scroll;
});
