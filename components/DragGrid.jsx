import { h } from './h';
import { OArray } from "destam-dom";

import Drag from './Drag';

const DragGrid = ({ items, orientation = 'column' }) => {
    if (!(items instanceof OArray) && Array.isArray(items)) items = OArray(items);

    const Draggable = ({ each: item }) => <Drag constrainToParent>
        <div style={{ border: '2px solid gray', borderRadius: '5px' }}>
            {item}
        </div>
    </Drag>;

    return <div style={{ display: 'flex', flexDirection: orientation }}>
        <Draggable each={items} />
    </div>;
};

export default DragGrid;
