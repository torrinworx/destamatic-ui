import { Observer } from 'destam-dom';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	divider: {
		width: 4,
		cursor: 'ew-resize',
		background: '#E5E7EB'
	}
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
	 * @param {Observer<number>} [props.leftWindowPercentage] - Observable number from 0 to 1 to determine tiling window sizes on render and during dragging.
	 * @param {int} [props.leftOffset=0] - Number of pixels on the left of the page taken up by navigation bars, menu, etc.
	 * @param {number} [props.leftMin=20] - Number from 0 to 1 representing the minimum width percentage taken up by the left tile.
	 * @param {number} [props.leftMax=80] - Number from 0 to 1 representing the maximum width percentage taken up by the left tile.
	 * @param {Object} [props.style] - Custom styles to apply to the button.
	 *
	 * @returns {JSX.Element} The rendered draggable window divider element.
	 */
	const Divider = ({
		leftWindowPercentage,
		leftOffset = 0,
		leftMin = 0.2,
		leftMax = 0.8,
		style
	}, cleanup) => {
		if (!(leftWindowPercentage instanceof Observer)) leftWindowPercentage = Observer.mutable(0.5);

		let resizingWindow = false;
		const pageWidth = (window.innerWidth - leftOffset);

		const handleMouseDown = () => {
			resizingWindow = true;
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		};

		const handleMouseMove = (e) => {
			if (!resizingWindow) return;
			if (e.clientX < pageWidth * leftMin + leftOffset || e.clientX > pageWidth * leftMax + leftOffset) return;

			leftWindowPercentage.set((e.clientX - leftOffset) / pageWidth);
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

		return <div theme='divider' style={style} onMouseDown={handleMouseDown} />;
	};

	return Divider;
});
