import { Observer } from 'destam-dom';

import useAbort from '../../../util/abort.js';
import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	slider: {
		$size: 25,
		$trackSize: 8,

		position: 'relative',
	},

	slider_horizontal: {
		$movementAnchor: 'left',
		$eventAnchor: 'clientX',
		$sizeAnchor: 'width',

		width: '100%',
		height: '$size$px',
	},

	slider_vertical: {
		$movementAnchor: 'top',
		$eventAnchor: 'clientY',
		$sizeAnchor: 'height',

		width: '$size$px',
		height: '100%',
	},

	slider_track: {
		background: '$saturate($shiftBrightness($color, 0.1), -1)',

		position: 'absolute',
		borderRadius: '$div($trackSize, 2)px',
		cursor: 'pointer',
	},

	slider_track_active: {
		pointerEvents: 'none',
		position: 'absolute',
		transition: 'width ease-in-out 100ms, height ease-in-out 100ms',
		background: '$shiftBrightness($color, 0.1)',
	},

	slider_vertical_track_active: {
		top: 0,
	},

	slider_horizontal_track_active: {
		left: 0,
	},

	slider_horizontal_track: {
		top: '50%',
		width: '100%',
		height: '$trackSize$px',
		transform: 'translateY(-50%)',
	},

	slider_vertical_track: {
		left: '50%',
		width: '$trackSize$px',
		height: '100%',
		transform: 'translateX(-50%)',
	},

	slider_track_hovered: {
		background: '$shiftBrightness($color_hover, 0.1)',
	},

	slider_thumb: {
		width: `$size$px`,
		height: `$size$px`,
		background: '$color',

		position: 'absolute',
		borderRadius: '50%',
		cursor: 'pointer',
	},

	slider_horizontal_thumb: {
		top: '50%',
		transform: 'translateY(-50%)'
	},

	slider_vertical_thumb: {
		left: '50%',
		transform: 'translateX(-50%)'
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
		type="horizontal",
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

		const vars = themer(theme, 'slider', type, 'thumb');
		const size = vars.vars('size');
		const movementAnchor = vars.vars('movementAnchor').get();
		const eventAnchor = vars.vars('eventAnchor').get();
		const sizeAnchor = vars.vars('sizeAnchor').get();

		cleanup(dragging.effect(event => {
			if (!event) return;
			if (disabled.get()) return;

			const rect = TrackRef.getBoundingClientRect();
			const trackWidth = rect[sizeAnchor] - size.get();
			const clickX = event[eventAnchor] - rect[movementAnchor] - size.get() / 2;
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

		const percentage = Observer.all([value, min, max]).map(([value, min, max]) => {
			const ratio = (value - min) / (max - min);
			return Math.min(Math.max(ratio, 0), 1);
		});

		const renderHover = value.isImmutable() ?
			Observer.immutable(false) :
			Observer.all([dragging, hover]).map(([a, b]) => a || b);

		return <div ref
			{...props}
			theme={["slider", type]}
		>
			<TrackRef
				theme={[
					"slider", type, "track",
					renderHover.bool('hovered', null),
					disabled.bool('disabled', null),
				]}
				style={styleTrack}
				isHovered={hover}
				onMouseDown={event => {
					if (!value.isImmutable()) {
						event.preventDefault();
						dragging.set(event);
					}
				}}
				children={children}
			/>
			<div
				theme={[
					"slider", type, "track", "active",
					renderHover.bool('hovered', null),
					disabled.bool('disabled', null),
				]}
				style={{[sizeAnchor]: percentage.map(prc => (prc * 100) + '%')}}
			/>
			{value.isImmutable() ? null : <div
				theme={[
					"slider", type, "thumb",
					dragging.map(h => h ? 'hovered' : null),
					disabled.map(d => d ? 'disabled' : null),
				]}
				style={{
					[movementAnchor]: Observer.all([percentage, size]).map(([prc, size]) => `calc(${prc * 100}% - (${size * prc}px))`),
					...styleThumb,
				}}
				isHovered={hover}
				onMouseDown={event => {
					event.preventDefault();
					dragging.set(event);
				}}
			/>}
		</div>;
	});

	return Slider;
});
