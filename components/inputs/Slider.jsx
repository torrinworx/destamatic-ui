import { Observer } from 'destam-dom';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import useAbort from '../../util/abort';

Theme.define({
	slider: {
		$size: 25,

		width: '100%',
		height: '$size$px',
		position: 'relative',
	},

	slider_track: {
		background: '$shiftBrightness($color, 0.1)',

		position: 'absolute',
		top: '50%',
		width: '100%',
		height: '8px',
		borderRadius: '4px',
		transform: 'translateY(-50%)',
		cursor: 'pointer',
	},

	slider_track_hovered: {
		background: '$shiftBrightness($color_hover, 0.1)',
	},

	slider_thumb: {
		width: `$size$px`,
		height: `$size$px`,
		background: '$color',

		position: 'absolute',
		top: '50%',
		borderRadius: '50%',
		cursor: 'pointer',
		transform: 'translateY(-50%)'
	},

	slider_thumb_hovered: {
		background: '$color_hover',
	},

});

export default ThemeContext.use(h => {
	/**
	 * Slider component for selecting a value from a range.
	 *
	 * @param {Object} props - The properties object.
	 * @param {Observer<number>} [props.min=Observer.mutable(0)] - Observable minimum value of the slider.
	 * @param {Observer<number>} [props.max=Observer.mutable(100)] - Observable maximum value of the slider.
	 * @param {Observer<number>} [props.OValue=Observer.mutable(50)] - Observable value for the slider's position.
	 * @param {Observer<boolean>} [props.disabled] - Observable boolean to determine if the slider is disabled.
	 * @param {Object} [props.style] - Custom styles to apply to the slider container.
	 * @param {Object} [props.trackStyle] - Custom styles to apply to the track element.
	 * @param {Object} [props.thumbStyle] - Custom styles to apply to the thumb element.
	 * @param {...Object} props - Additional properties to spread onto the slider container element.
	 *
	 * @returns {JSX.Element} The rendered slider element.
	 */
	const Slider = Theme.use(themer => ({
		min,
		max,
		value,
		hover,
		disabled,
		styleThumb,
		styleTrack,
		children,
		theme,
		...props
	}, cleanup, mount) => {
		if (!(min instanceof Observer)) min = Observer.immutable(min ?? 0);
		if (!(max instanceof Observer)) max = Observer.immutable(max ?? 1);
		if (!(value instanceof Observer)) value = Observer.immutable(value ?? 0);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover ?? false);
		if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled ?? false);

		const TrackRef = <raw:div />;
		const dragging = Observer.mutable(false);
		const size = themer(theme, 'slider', 'thumb').vars('size');

		cleanup(dragging.effect(event => {
			if (!event) return;
			if (disabled.get()) return;

			const rect = TrackRef.getBoundingClientRect();
			const trackWidth = rect.width - size.get();
			const clickX = event.clientX - rect.left - size.get() / 2;
			const minVal = min.get();
			const maxVal = max.get();
			const newValue = minVal + ((clickX / trackWidth) * (maxVal - minVal));
			value.set(Math.min(Math.max(newValue, minVal), maxVal));
		}));

		cleanup(dragging.map(Boolean).effect(useAbort((signal, started) => {
			if (!started) return;

			const reset = () => dragging.set(false);
			const move = e => dragging.set(e);

			window.addEventListener('mousemove', move, {signal});
			window.addEventListener('mouseup', reset, {signal});
		})));

		const percentage = Observer.all([value, size, min, max]).map(([value, thumbWidth, min, max]) => {
			const ratio = (value - min) / (max - min);

			const prc = Math.min(Math.max(ratio, 0), 1);
			return `calc(${prc * 100}% - (${thumbWidth * prc}px))`;
		});

		const Ref = <raw:div />;

		const renderHover = Observer.all([dragging, hover]).map(([a, b]) => a || b)

		return <Ref
			{...props}
			theme="slider"
		>
			<TrackRef
				theme={[
					"slider", "track",
					renderHover.map(h => h ? 'hovered' : null),
					disabled.map(d => d ? 'disabled' : null),
				]}
				style={styleTrack}
				isHovered={hover}
				onMouseDown={event => {
					event.preventDefault();
					dragging.set(event);
				}}
				children={children}
			/>
			<div
				theme={[
					"slider", "thumb",
					dragging.map(h => h ? 'hovered' : null),
					disabled.map(d => d ? 'disabled' : null),
				]}
				style={{
					left: percentage,
					...styleThumb,
				}}
				isHovered={hover}
				onMouseDown={event => {
					event.preventDefault();
					dragging.set(event);
				}}
			/>
		</Ref>;
	});

	return Slider;
});
