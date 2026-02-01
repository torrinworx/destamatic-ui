import { Observer } from 'destam-dom';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';
import { mark } from '../../utils/h/h.jsx';
import useAbort from '../../../util/abort.js';

Theme.define({
	dividerComp_base: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
	},
	dividerComp_handle: {
		$width: 4,
		width: '$width$px',
		cursor: 'ew-resize',
		background: '#E5E7EB',
		userSelect: 'none',
	},

	dividerComp_left: {
		overflow: 'auto',
	},

	dividerComp_right: {
		overflow: 'auto',
	},
});

export default ThemeContext.use(h => {
	const Divider = Theme.use(themer => ({
		value = 0.5,
		min = 0.2,
		max = 0.8,
		children,
		...props
	}, cleanup) => {
		if (!(value instanceof Observer)) value = Observer.mutable(value);

		const Container = <raw:div />;

		const resizing = Observer.mutable(false);
		cleanup(resizing.effect(useAbort((signal, val) => {
			if (!val) return;

			document.addEventListener('mousemove', e => {
				const bounds = Container.getBoundingClientRect();

				let left = (e.clientX - bounds.left) / bounds.width;
				left = Math.min(left, max);
				left = Math.max(left, min);
				value.set(left);
			}, { signal });

			document.addEventListener('mouseup', () => {
				resizing.set(false);
			}, { signal });
		})));

		const left = [], right = [];
		for (const child of children) {
			if (child instanceof mark) {
				if (child.name === 'left') {
					left.push(...child.props.children);
					continue;
				} else if (child.name === 'right') {
					right.push(...child.props.children);
					continue;
				}
			}

			throw new Error("Divider expects children of <mark:left> or <mark:right>");
		}

		const handleWidth = themer('dividerComp_handle').vars('width');
		const styleData = Observer.all([value, handleWidth]);

		return <Container {...props} theme="dividerComp_base">
			<div theme="dividerComp_left" style={{ width: styleData.map(([p, w]) => `calc(${p * 100}% - ${w / 2}px)`) }}>
				{left}
			</div>
			<div theme='dividerComp_handle' onMouseDown={() => resizing.set(true)} />
			<div theme="dividerComp_right" style={{ width: styleData.map(([p, w]) => `calc(${(1 - p) * 100}% - ${w / 2}px)`) }}>
				{right}
			</div>
		</Container>
	});

	return Divider;
});
