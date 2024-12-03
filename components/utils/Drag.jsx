import { h } from './h';
import { Observer } from 'destam-dom';

/**
 * Drag component to enable dragging of its children elements within a relative context.
 *
 * @param {Object} props - The properties object.
 * @param {JSX.Element} props.children - The element(s) to render within the draggable container.
 * @param {Function} [props.onDragStart] - Callback function to be called when dragging starts.
 * @param {Function} [props.onDrag] - Callback function to be called as the element is being dragged.
 * @param {Function} [props.onDragEnd] - Callback function to be called when dragging ends.
 * @param {boolean} [props.snapBack=false] - If true, the element will snap back to its original position upon drag end.
 * @param {number} [props.lag=0.1] - The lag factor for the drag animation, determining how fast the movement catches up. Ranges from 0.1 to 1.
 * @param {boolean} [props.constrainToParent=false] - If true, the element will be constrained within its parent boundaries.
 *
 * @returns {JSX.Element} A draggable container wrapping its children.
 */

const Drag = ({
    children,
    onDragStart,
    onDrag,
    onDragEnd,
    snapBack = false,
    lag = 0.1,
    constrainToParent = false,
    ref: Ref = <raw:div />,
    originRect = Observer.mutable()
}) => {
    if (lag < 0.1) lag = 0.1;
    if (lag > 1) lag = 1;

    const isDragging = Observer.mutable(false);
    const offset = Observer.mutable({ x: 0, y: 0 });
    const currentPosition = Observer.mutable({ x: 0, y: 0 });

    let newPos = { x: 0, y: 0 }
    let animationFrameId;

    const updatePosition = () => {
        const diffX = newPos.x - currentPosition.get().x;
        const diffY = newPos.y - currentPosition.get().y;

        if (Math.abs(diffX) > 0.1 || Math.abs(diffY) > 0.1) {
            currentPosition.set({
                x: currentPosition.get().x + diffX * lag,
                y: currentPosition.get().y + diffY * lag
            });
        }

        if (isDragging.get()) {
            animationFrameId = requestAnimationFrame(updatePosition);
        }
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        isDragging.set(true);

        const parentRect = Ref.parentElement.getBoundingClientRect();
        const dragRect = Ref.getBoundingClientRect();

        if (!originRect.get()) {
            originRect.set(dragRect);
        }

        offset.set({
            x: e.clientX - parentRect.left - currentPosition.get().x,
            y: e.clientY - parentRect.top - currentPosition.get().y
        });

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        if (onDragStart) onDragStart(e);

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updatePosition);
        }
    };

    const handleMouseMove = (e) => {
        const parentRect = Ref.parentElement.getBoundingClientRect();
        newPos.x = e.clientX - parentRect.left - offset.get().x;
        newPos.y = e.clientY - parentRect.top - offset.get().y;

        if (constrainToParent) {
            newPos.x = Math.max(
                -originRect.get().left + parentRect.left,
                Math.min(newPos.x, parentRect.right - originRect.get().right)
            );
            newPos.y = Math.max(
                -originRect.get().top + parentRect.top,
                Math.min(newPos.y, parentRect.bottom - originRect.get().bottom)
            );
        }

        if (onDrag) onDrag(e);
    };

    const handleMouseUp = (e) => {
        isDragging.set(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;

        if (snapBack) {
            currentPosition.set({ x: 0, y: 0 });
            newPos.x = 0;
            newPos.y = 0;
        }
        if (onDragEnd) onDragEnd(e);
    };

    // Meant to snap back component to new originRect
    if (snapBack) {
        originRect.watch(() => {
            
            currentPosition.set({ x: 0, y: 0 });
            newPos.x = 0;
            newPos.y = 0;
        })
    }

    return <Ref
        style={{
            cursor: 'move',
            userSelect: 'none',
            position: 'relative',
            left: currentPosition.map(pos => `${pos.x}px`),
            top: currentPosition.map(pos => `${pos.y}px`),
            lineHeight: 0,
            margin: 0,
            padding: 0,
            display: 'inline-block',
            boxSizing: 'border-box',
            transition: isDragging.map(i => i ? '' : 'left 0.5s ease, top 0.5s ease'),
        }}
        onMouseDown={handleMouseDown}
    >
        {children}
    </Ref>;
};

export default Drag;
