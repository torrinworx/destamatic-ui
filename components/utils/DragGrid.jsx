import { h } from './h';
import { OArray, Observer } from "destam-dom";
import Drag from './Drag';

const DragGrid = ({ items, orientation = 'column', onReorder }) => {
    if (!(items instanceof OArray) && Array.isArray(items)) items = OArray(items);

    items.observer.watch(() => console.log(items));

    const reorderItems = (draggedIndex, newIndex) => {
        if (draggedIndex !== newIndex) {
            const [draggedItem] = items.splice(draggedIndex, 1);
            items.splice(newIndex, 0, draggedItem);
            if (onReorder) onReorder(items);
        }
    };

    const Draggable = ({ each: item, index: draggedIndex }) => {
        const isDragging = Observer.mutable(false);

        const Ref = <raw:div />

        return <Drag
            ref={Ref}
            constrainToParent
            snapBack
            onDragStart={() => isDragging.set(true)}
            onDragEnd={() => {
                isDragging.set(false);
                console.log(Ref)
                const grid = Ref.parentElement;
                console.log(grid)
                let newIndex = [...grid.children].indexOf(Ref);
                reorderItems(draggedIndex, newIndex);
            }}
        >
            <div style={{
                border: isDragging.map(d => d ? '2px dashed gray' : '2px solid gray'),
                borderRadius: '5px',
                padding: '10px',
                margin: '5px',
            }}>
                {item}
            </div>
        </Drag>;
    };

    return <div style={{ display: 'flex', flexDirection: orientation }}>
        <Draggable each={items} />
    </div>;
};

export default DragGrid;
