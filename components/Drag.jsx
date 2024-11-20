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
    constrainToParent = false
}, _, mount) => {
    if (lag < 0.1) lag = 0.1;
    if (lag > 1) lag = 1;

    const Ref = <raw:div />
    const isDragging = Observer.mutable(false);
    const currentPosition = Observer.mutable({ x: 0, y: 0 });
    const originalPosition = Observer.mutable();
    const offset = Observer.mutable({ x: 0, y: 0 });
    const targetPosition = { x: 0, y: 0 };

    let parentElement = null;
    let animationFrameId;

    const updatePosition = () => {
        const diffX = targetPosition.x - currentPosition.get().x;
        const diffY = targetPosition.y - currentPosition.get().y;

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

        const parentRect = parentElement.getBoundingClientRect();
        const dragRect = Ref.getBoundingClientRect();

        if (!originalPosition.get()) {
            originalPosition.set({
                left: dragRect.left,
                top: dragRect.top,
                right: dragRect.right,
                bottom: dragRect.bottom,
                x: 0,
                y: 0,
            });
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
        const parentRect = parentElement.getBoundingClientRect();

        // Calculate the new potential positions based on mouse movement
        let newPosX = e.clientX - parentRect.left - offset.get().x;
        let newPosY = e.clientY - parentRect.top - offset.get().y;

        if (constrainToParent) {
            newPosX = Math.max(
                -originalPosition.get().left + parentRect.left,
                Math.min(newPosX, parentRect.right - originalPosition.get().right)
            );
            newPosY = Math.max(
                -originalPosition.get().top + parentRect.top,
                Math.min(newPosY, parentRect.bottom - originalPosition.get().bottom)
            );
        }

        targetPosition.x = newPosX;
        targetPosition.y = newPosY;

        if (onDrag) onDrag(e);
    };

    const handleMouseUp = (e) => {
        isDragging.set(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;

        if (snapBack) {
            currentPosition.set(originalPosition.get());
            targetPosition.x = originalPosition.x;
            targetPosition.y = originalPosition.y;
        }
        if (onDragEnd) onDragEnd(e);
    };

    mount(() => {
        parentElement = Ref.parentElement;

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    });

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
