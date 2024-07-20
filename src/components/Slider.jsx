import h from './h';
import { Observer } from 'destam-dom';
import Shared from './Shared';

// Note: We are using a custom track and thumb component to get around the
// destam-dom limitations with pseudo elements. Currently, we cannot style these.

const Thumb = ({
    position,
    style,
    onDragStart,
    hover,
    disabled
}) => {
    const backgroundColor = disabled.map(d =>
        d ? Shared.Theme.Colours.primary.disabled
        : hover.get() ? Shared.Theme.Colours.primary.hover : Shared.Theme.Colours.primary.base
    );

    const cursor = disabled.map(d => d ? 'not-allowed' : 'pointer');

    const thumbStyle = {
        position: 'absolute',
        top: '50%',
        left: position,
        width: '25px',
        height: '25px',
        backgroundColor,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        cursor,
        transition: Shared.Theme.transition,
        ...style
    };

    return <div
        $style={thumbStyle}
        onMouseEnter={() => hover.set(true)}
        onMouseLeave={() => hover.set(false)}
        onMouseDown={onDragStart}
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
                ? Shared.Theme.Colours.secondary.darker
                : Shared.Theme.Colours.secondary.base
            ),
            borderRadius: '4px',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            transition: Shared.Theme.transition,
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
 * @param {number} [props.min=0] - The minimum value of the slider.
 * @param {number} [props.max=100] - The maximum value of the slider.
 * @param {Observer<number>} [props.OValue] - Observable value for the slider's position.
 * @param {Observer<boolean>} [props.disabled] - Observable boolean to determine if the slider is disabled.
 * @param {Object} [props.style] - Custom styles to apply to the slider container.
 * @param {Object} [props.trackStyle] - Custom styles to apply to the track element.
 * @param {Object} [props.thumbStyle] - Custom styles to apply to the thumb element.
 * @param {...Object} props - Additional properties to spread onto the slider container element.
 * 
 * @returns {JSX.Element} The rendered slider element.
 */
const Slider = ({
    min = 0,
    max = 100,
    OValue = Observer.mutable((min + max) / 2),
    style,
    trackStyle,
    thumbStyle,
    hover = Observer.mutable(false),
    disabled = Observer.mutable(false),
    ...props
}, _, mount) => {
    const trackRef = Observer.mutable(null);
    const dragging = Observer.mutable(false);

    const updateValueFromEvent = (event) => {
        const trackElement = trackRef.get();
        if (!trackElement) return;

        const rect = trackElement.getBoundingClientRect();
        const trackWidth = rect.width;
        const clickX = event.clientX - rect.left;
        const newValue = min + ((clickX / trackWidth) * (max - min));
        OValue.set(Math.min(Math.max(newValue, min), max));
    };

    const handleMouseDown = (event) => {
        event.preventDefault();
        if (disabled.get()) return;
        dragging.set(true);
        updateValueFromEvent(event);
    };

    const handleMouseMove = (event) => {
        if (dragging.get() && !disabled.get()) {
            updateValueFromEvent(event);
        }
    };

    const handleMouseUp = () => {
        dragging.set(false);
    };

    const percentage = OValue.map((value) => {
        const trackElement = trackRef.get();
        if (!trackElement) return '50%';

        const ratio = (value - min) / (max - min);
        const thumbOffsetPercentage = (25 / 2) / trackElement.getBoundingClientRect().width * 100;
        return Math.min(Math.max(ratio * 100, thumbOffsetPercentage), 100 - thumbOffsetPercentage) + '%';
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
            transition: Shared.Theme.transition,
            ...style
        }}
        {...props}
    >
        <Track
            style={trackStyle}
            onMouseDown={handleMouseDown}
            ref={trackRef}
            hover={hover}
        />
        <Thumb
            position={percentage}
            onDragStart={handleMouseDown}
            style={thumbStyle}
            hover={hover}
            disabled={disabled}
        />
    </Ref>;
};

export default Slider;
