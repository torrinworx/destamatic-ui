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
const Drag = ({ children, onDragStart, onDrag, onDragEnd, snapBack = false, lag = 0.1, constrainToParent = false }) => {
    if (lag < 0.1) lag = 0.1;
    if (lag > 1) lag = 1;

    const isDragging = Observer.mutable(false);
    const currentPosition = Observer.mutable({ x: 0, y: 0 });
    const originalPosition = Observer.mutable({ x: 0, y: 0 });
    const offset = Observer.mutable({ x: 0, y: 0 });
    const targetPosition = { x: 0, y: 0 };

    let parentElement = null;
    let draggableElement = null;
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
        draggableElement = e.currentTarget;
        parentElement = draggableElement.parentNode;

        const elementRect = draggableElement.getBoundingClientRect();
        const parentRect = parentElement.getBoundingClientRect();

        offset.set({
            x: e.clientX - elementRect.left,
            y: e.clientY - elementRect.top
        });

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        if (onDragStart) onDragStart(e);

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updatePosition);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging.get() || !parentElement || !draggableElement) return;

        const parentRect = parentElement.getBoundingClientRect();

        if (constrainToParent) {
            targetPosition.x = Math.min(
                Math.max(e.clientX - parentRect.left - offset.get().x, 0),
                parentRect.width - draggableElement.offsetWidth
            );
            targetPosition.y = Math.min(
                Math.max(e.clientY - parentRect.top - offset.get().y, 0),
                parentRect.height - draggableElement.offsetHeight
            );
        } else {
            targetPosition.x = e.clientX - parentRect.left - offset.get().x;
            targetPosition.y = e.clientY - parentRect.top - offset.get().y;
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
            currentPosition.set(originalPosition.get());
        }
        if (onDragEnd) onDragEnd(e);
    };

    return <div
        style={{
            cursor: 'move',
            userSelect: 'none',
            position: 'relative',
            left: currentPosition.map(pos => `${pos.x}px`),

            // Strang offset of 3.7px that happens on load of component that impacts the position calculation:
            top: currentPosition.map(pos => `${pos.y - 3.7}px`),
            lineHeight: 0,
            margin: 0,
            padding: 0,
            display: 'inline-block',
            boxSizing: 'border-box'
        }}
        onMouseDown={(e) => {
            if (!isDragging.get()) {
                originalPosition.set(currentPosition.get());
            }
            handleMouseDown(e);
        }}
    >
        {children}
    </div>;
};

export default Drag;
