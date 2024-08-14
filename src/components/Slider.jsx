import { h } from './h';
import { Observer } from 'destam-dom';

import Theme from './Theme';

const thumbWidth = 25;

// Note: We are using a custom track and thumb component to get around the
// destam-dom limitations with pseudo elements. Currently, we cannot style these.
const Thumb = ({
    position,
    style,
    onDragStart,
    onDragEnd,
    hover,
    disabled
}) => {
    const backgroundColor = disabled.map(d =>
        d ? theme.Colours.primary.disabled
            : hover.get() ? theme.Colours.primary.hover : theme.Colours.primary.base
    );

    const cursor = disabled.map(d => d ? 'not-allowed' : 'pointer');

    const thumbStyle = {
        position: 'absolute',
        top: '50%',
        left: position,
        width: `${thumbWidth}px`,
        height: `${thumbWidth}px`,
        backgroundColor,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        cursor,
        transition: theme.transition,
        ...style
    };

    return <div
        $style={thumbStyle}
        onMouseEnter={() => hover.set(true)}
        onMouseLeave={() => hover.set(false)}
        onMouseDown={onDragStart}
        onMouseUp={onDragEnd}
        onTouchStart={onDragStart}
        onTouchEnd={onDragEnd}
    ></div>;
};

const Track = ({ style, onMouseDown, hover }) => {
    return <div
        $style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            width: '100%',
            height: '8px',
            backgroundColor: hover.map(h => h
                ? theme.Colours.secondary.darker
                : theme.Colours.secondary.base
            ),
            borderRadius: '4px',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            transition: theme.transition,
            ...style,
        }}
        onMouseEnter={() => hover.set(true)}
        onMouseLeave={() => hover.set(false)}
        onMouseDown={onMouseDown}
    ></div>;
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
const Slider = Theme.use(theme => ({
    min = Observer.mutable(0),
    max = Observer.mutable(100),
    OValue = Observer.mutable(50),
    style,
    trackStyle,
    thumbStyle,
    hover = Observer.mutable(false),
    disabled = Observer.mutable(false),
    onMouseDown,
    onDragStart,
    onDrag,
    onDragEnd,
    ...props
}, _, mount) => {
    if (!(min instanceof Observer)) min = Observer.mutable(min);
    if (!(max instanceof Observer)) max = Observer.mutable(max);
    if (!(OValue instanceof Observer)) OValue = Observer.mutable(OValue);
    if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
    if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);

    const trackRef = Observer.mutable(null);
    const dragging = Observer.mutable(false);

    const updateValueFromEvent = (event) => {
        const trackElement = trackRef.get();
        if (!trackElement) return;

        const rect = trackElement.getBoundingClientRect();
        const trackWidth = rect.width;
        const clickX = event.clientX - rect.left;
        const minVal = min.get();
        const maxVal = max.get();
        const newValue = minVal + ((clickX / trackWidth) * (maxVal - minVal));
        OValue.set(Math.min(Math.max(newValue, minVal), maxVal));
    };

    const handleMouseMove = (event) => {
        if (dragging.get() && !disabled.get()) {
            updateValueFromEvent(event);
            onDrag && onDrag(event);
        }
    };

    const handleMouseUp = (event) => {
        if (dragging.get()) {
            dragging.set(false);
            onDragEnd && onDragEnd(event);
        }
    };

    const handleDragStart = (event) => {
        event.preventDefault();
        if (disabled.get()) return;
        dragging.set(true);
        updateValueFromEvent(event);
        onDragStart && onDragStart(event);
    };

    const percentage = OValue.map((value) => {
        const trackElement = trackRef.get();
        if (!trackElement) return '50%';

        const trackWidth = trackElement.getBoundingClientRect().width;

        const minVal = min.get();
        const maxVal = max.get();
        const ratio = (value - minVal) / (maxVal - minVal);

        // Adjust the position to ensure the thumb stays within the track
        const adjustedRatio = ratio * (trackWidth - thumbWidth) / trackWidth + thumbWidth / (2 * trackWidth);
        return `${Math.min(Math.max(adjustedRatio * 100, 0), 100)}%`;
    });

    const Ref = <div />;

    mount(() => {
        trackRef.set(Ref.firstElementChild);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    });

    return <Ref
        $style={{
            position: 'relative',
            width: '100%',
            height: '40px',
            transition: theme.transition,
            ...style
        }}
        {...props}
    >
        <Track
            style={trackStyle}
            onMouseDown={(event) => {
                if (!disabled.get()) {
                    handleDragStart(event);
                    onMouseDown && onMouseDown(event);
                }
            }}
            ref={trackRef}
            hover={hover}
        />
        <Thumb
            position={percentage}
            onDragStart={(event) => {
                handleDragStart(event);
            }}
            onDragEnd={(event) => {
                handleMouseUp(event);
            }}
            style={thumbStyle}
            hover={hover}
            disabled={disabled}
        />
    </Ref>;
});

export default Slider;
