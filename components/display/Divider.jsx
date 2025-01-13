import { Observer } from 'destam-dom';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import { mark } from '../utils/h';

Theme.define({
	divider_base: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
	},
	divider_handle: {
		$width: 4,
		width: '$width$px',
		cursor: 'ew-resize',
		background: '#E5E7EB'
	},

	divider_left: {
		overflow: 'auto',
	},

	divider_right: {
		overflow: 'auto',
	},
});

export default ThemeContext.use(h => {
	/**
	 * Draggable divider component to split windows into two.
	 * The parent div should have flex display.
	 * The Divider Component should be in between the two sibling windows components within the parent div
	 * The left window div should have style={{width: leftWindowPercentage.map(w => `${w * 100}%`) }}
	 * The right window div should have style={{width: leftWindowPercentage.map(w => `${100 - w * 100}%`) }}
	 *
	 * @param {Object} props - The properties object.
	 * @param {Observer<number>} [props.value] - Observable number from 0 to 1 to determine tiling window sizes on render and during dragging.
	 * @param {number} [props.leftDefault] - Number from 0 to 1 to determine tiling window sizes on render and during dragging.
	 * @param {number} [props.min=20] - Number from 0 to 1 representing the minimum width percentage taken up by the left tile.
	 * @param {number} [props.max=80] - Number from 0 to 1 representing the maximum width percentage taken up by the left tile.
	 * @param {Object} [props.style] - Custom styles to apply to the button.
	 *
	 * @returns {JSX.Element} The rendered draggable window divider element.
	 */
	const Divider = Theme.use(themer => ({
		value,
		leftDefault = 0.5,
		min = 0.2,
		max = 0.8,
		children,
		...props
	}, cleanup) => {
		if (!(value instanceof Observer)) value = Observer.mutable(leftDefault);

		let resizingWindow = false;
		const Container = <raw:div />;

		const handleMouseDown = () => {
			resizingWindow = true;
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		};

		const handleMouseMove = (e) => {
			if (!resizingWindow) return;
			const bounds = Container.getBoundingClientRect();

			let left = (e.clientX - bounds.left) / bounds.width;
			left = Math.min(left, max);
			left = Math.max(left, min);
			value.set(left);
		};

		const handleMouseUp = () => {
			resizingWindow = false;
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		cleanup(() => {
			if (!resizingWindow) return;

			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		});

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

		const handleWidth = themer('divider_handle').vars('width');
		const styleData = Observer.all([value, handleWidth]);

		return <Container theme="divider_base" {...props}>
			<div theme="divider_left" style={{width: styleData.map(([p, w]) => `calc(${p * 100}% - ${w / 2}px)`)}}>
				{left}
			</div>
			<div theme='divider_handle' onMouseDown={handleMouseDown} />
			<div theme="divider_right" style={{width: styleData.map(([p, w]) => `calc(${(1 - p) * 100}% - ${w / 2}px)`)}}>
				{right}
			</div>
		</Container>
	});

	return Divider;
});
