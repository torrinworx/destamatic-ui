import h from "./h";

import { Observer } from "destam-dom";

// Glorified Icon with animation on hover.
const Chevron = ({hover, anchor = 'right' }) => {
    if (!hover) {
        hover = Observer.mutable(false);
    }

    const time = '0.3s' // Time in seconds for ease animation
    const originalLength = 50; // Original length of the chevron parts
    const lengthAdjustment = 10 // subtracts from length when in hovered state
    const thiccc = '8px' // The thickness of the line
    const overlapAdjustment = '5px' // The overlap between the two divs that create the chevron
    const angle = 45; // Angle of rotation in degrees
    const borderRadius = 6;

    const value = hover.map(h => h ? `${calculateLength(originalLength, angle) - lengthAdjustment}px` : `${originalLength}px`)

    const transformMappings = {
        right: angle,
        left: -angle,
        top: angle,
        bottom: -angle
    };

    const dimensions = {
        width: {
            right: thiccc,
            left: thiccc,
            top: value,
            bottom: value
        }[anchor],
        height: {
            right: value,
            left: value,
            top: thiccc,
            bottom: thiccc
        }[anchor]
    }

    const top = {
        transform: hover.map(h => h ? `rotate(${transformMappings[anchor]}deg)` : 'none'),
        transformOrigin: {
            right: 'bottom left',
            left: 'bottom right',
            top: 'bottom right',
            bottom: 'top right',
        }[anchor],
        borderRadius: `${borderRadius}px`,
        ...(anchor === "right" || anchor === "left" ? 
            {top: hover.map(h => h ? '0px' : overlapAdjustment)} : 
            {left: hover.map(h => h ? '0px' : overlapAdjustment)}
        ),
        ...dimensions
    }

    const bottom = {
        transform: hover.map(h => h ? `rotate(${-transformMappings[anchor]}deg)` : 'none'),
        transformOrigin: {
            right: 'top left',
            left: 'top right',
            top: 'bottom left',
            bottom: 'top left'
        }[anchor],
        borderRadius: `${borderRadius}px`,
        ...(anchor === "right" || anchor === "left" ? 
            {bottom: hover.map(h => h ? '0px' : overlapAdjustment)} : 
            {right: hover.map(h => h ? '0px' : overlapAdjustment)}
        ),
        ...dimensions
    }

    const commonStyle = {
        transition: `transform ${time} ease, top ${time} ease, bottom ${time} ease, right ${time} ease, left ${time} ease, height ${time} ease, width ${time} ease`,
        backgroundColor: hover.map(h => h ? '#ff0000' : '#0000ff')
    };

    const calculateLength = (originalLength, angleDegrees) => {
        const angleRadians = (angleDegrees * Math.PI) / 180;
        return originalLength / Math.cos(angleRadians);
    };

    return <div
        $onmouseenter={() => hover.set(true)}
        $onmouseleave={() => hover.set(false)}
        >
        <div
        $style={{
            display: 'flex',
            flexDirection: {
                right: 'column',
                left: 'column',
                top: 'row',
                bottom: 'row'
            }[anchor],
            justifyContent: 'center',
            alignItems: 'center',
            ...(anchor === "right" || anchor === "left" ? 
                {
                    height: '60px',
                    margin: '0px 10px 0px 10px'
                } : 
                {
                    width: '60px',
                    margin: '10px 0px 10px 0px'

                }
            ),
        }}
    >
        <div $style={{
            ...top,
            ...commonStyle,
            position: 'relative',
        }}/>
        <div $style={{
            ...bottom,
            ...commonStyle,
            position: 'relative',
        }}/>
        </div>
    </div>;
};

export default Chevron;
