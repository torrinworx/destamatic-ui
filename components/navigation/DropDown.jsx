import { h } from '../utils/h';
import { Observer } from 'destam-dom';

import Icon from '../display/Icon';
import Shown from '../utils/Shown';

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
const DropDown = ({
    children,
    label,
    arrow = 'right',
    style,
    open = Observer.mutable(false),
}) => {
    if (!(open instanceof Observer)) open = Observer.mutable(open);

    const toggle = () => open.set(!open.get());

    return <div style={style}>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: arrow === 'right' ? 'space-between' : 'flex-start',
                cursor: 'pointer',
                userSelect: 'none'
            }}
            onMouseDown={toggle}>
            {arrow === 'right' ? <span>{label}</span> : null}
            <div style={{ display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                <i class='chevron-icon' style={{ cursor: 'pointer' }}>
                    {open.map((show) => show ? (
                        <Icon size='20' libraryName='feather' iconName='chevron-down' />
                    ) : (
                        <Icon size='20' libraryName='feather' iconName='chevron-right' />
                    ))}
                </i>
            </div>
            {arrow === 'left' ? <span>{label}</span> : null}
        </div>

        <Shown value={open} children={children} />
    </div>;
};

export default DropDown;
