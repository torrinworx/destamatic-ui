import h from './h';
import { Observer } from 'destam-dom';

import Icon from './Icon';
import Shown from './Shown';

/**
 * DropDown component that toggles the visibility of its children when clicked.
 * 
 * The component displays a label and an arrow icon (either to the right or the left).
 * Clicking the label or the arrow toggles the visibility of the children components.
 * 
 * @param {Object} props - The properties object.
 * @param {JSX.Element | Array<JSX.Element>} props.children - The content to be displayed inside the dropdown when expanded.
 * @param {string} props.label - The label to be displayed next to the dropdown arrow.
 * @param {string} [props.arrow='right'] - Determines the position of the arrow relative to the label. Can be 'right' or 'left'.
 * 
 * @returns {JSX.Element} The rendered dropdown component.
 */
const DropDown = ({ children, label, arrow = 'right', style, open }) => {

    let isDroppedDown = open;

    if (!isDroppedDown){
        isDroppedDown = Observer.mutable(false);
    }

    const toggle = () => isDroppedDown.set(!isDroppedDown.get());

    return <div style={style}>
        <div
            $style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: arrow === 'right' ? 'space-between' : 'flex-start'
            }}
            $onclick={toggle}
        >
            {arrow === 'right' ? label : null}
            <div $style={{ display: 'flex', alignItems: 'center' }}>
                <i $class='chevron-icon' $style={{ cursor: 'pointer' }}>
                    {isDroppedDown.map((show) => show ? (
                        <Icon size='20' libraryName='feather' iconName='chevron-down' />
                    ) : (
                        <Icon size='20' libraryName='feather' iconName='chevron-right' />
                    ))}
                </i>
            </div>
            {arrow === 'left' ? label : null}
        </div>
        <Shown value={isDroppedDown} children={children} />
    </div>;
};

export default DropDown;
