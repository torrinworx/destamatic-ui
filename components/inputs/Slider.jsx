import { h } from '../utils/h';
import { Observer } from 'destam-dom';
import Theme from '../utils/Theme';

Theme.define({
    slider: {
        width: '100%',
        height: '40px',
        position: 'relative',
    },

    slider_track: {
        extends: 'radius',

        background: '$shiftBrightness($color, 0.1)',

        position: 'absolute',
        top: '50%',
        width: '100%',
        height: '8px',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
    },

    slider_track_hovered: {
        background: '$shiftBrightness($color_hover, 0.1)',
    },

    slider_thumb: {
        $size: 25,

        width: `$size$px`,
        height: `$size$px`,
        background: '$color',

        position: 'absolute',
        top: '50%',
        borderRadius: '50%',
        cursor: 'pointer',
    },

    slider_thumb_hovered: {
        background: '$color_hover',
    },

});

const Thumb = ({
    position,
    style,
    dragging,
    hover,
    disabled
}) => {
};


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
    theme = "primary",
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

        const trackElement = TrackRef;
        const rect = trackElement.getBoundingClientRect();
        const trackWidth = rect.width - size.get();
        const clickX = event.clientX - rect.left - size.get() / 2;
        const minVal = min.get();
        const maxVal = max.get();
        const newValue = minVal + ((clickX / trackWidth) * (maxVal - minVal));
        value.set(Math.min(Math.max(newValue, minVal), maxVal));
    }));

    mount(() => cleanup(dragging.map(Boolean).effect(started => {
        if (!started) return;

        const reset = () => dragging.set(false);
        const move = e => dragging.set(e);

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', reset);

        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', reset);
        };
    })));

    const percentage = Observer.all([value, size, min, max]).map(([value, thumbWidth, min, max]) => {
        const trackElement = TrackRef;
        if (!trackElement) return '50%';

        const trackWidth = trackElement.getBoundingClientRect().width;
        const ratio = (value - min) / (max - min);

        // Adjust the position to ensure the thumb stays within the track
        const adjustedRatio = ratio * (trackWidth - thumbWidth) / trackWidth + thumbWidth / (2 * trackWidth);
        return `${Math.min(Math.max(adjustedRatio * 100, 0), 100)}%`;
    });

    const Ref = <raw:div />;

    const renderHover = Observer.all([dragging, hover]).map(([a, b]) => a || b)

    return <Ref
        theme={[theme, 'slider']}
        {...props}
    >
        <TrackRef
            theme={[
                theme,
                "slider", "track",
                renderHover.map(h => h ? 'hovered' : null),
                disabled.map(d => d ? 'disabled' : null),
            ]}
            isHovered={hover}
            onMouseDown={event => {
                event.preventDefault();
                dragging.set(event);
            }}
        />
        <div
            theme={[
                theme,
                "slider", "thumb",
                dragging.map(h => h ? 'hovered' : null),
                disabled.map(d => d ? 'disabled' : null),
            ]}
            style={{
                left: percentage,
                transform: 'translate(-50%, -50%)',
            }}
            isHovered={hover}
            onMouseDown={event => {
                event.preventDefault();
                dragging.set(event);
            }}
        />
    </Ref>;
});

export default Slider;
