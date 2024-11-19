import { h } from './h';
import { Observer } from 'destam-dom';

const Drag = ({ children, onDragStart, onDrag, onDragEnd, snapBack = false, lag = 0.1 }) => {
    if (lag < 0.1) lag = 0.1;
    if (lag > 1) lag = 1;

    const isDragging = Observer.mutable(false);
    const currentPosition = Observer.mutable({ x: 0, y: 0 });
    const originalPosition = Observer.mutable({ x: 0, y: 0 });
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
        // Continue animation frame to keep the element catching up
        if (isDragging.get()) {
            animationFrameId = requestAnimationFrame(updatePosition);
        }
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        isDragging.set(true);
        parentElement = e.currentTarget.parentNode;

        targetPosition.x = e.clientX - parentElement.left - offset.get().x;
        targetPosition.y = e.clientY - parentElement.top - offset.get().y;

        if (parentElement) {
            const parentRect = parentElement.getBoundingClientRect();
            offset.set({
                x: e.clientX - parentRect.left - currentPosition.get().x,
                y: e.clientY - parentRect.top - currentPosition.get().y,
            });
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        if (onDragStart) onDragStart(e);

        // Start animation frame on mousedown to begin updating
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updatePosition);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging.get() || !parentElement) return;
        const parentRect = parentElement.getBoundingClientRect();

        targetPosition.x = e.clientX - parentRect.left - offset.get().x;
        targetPosition.y = e.clientY - parentRect.top - offset.get().y;

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
            top: currentPosition.map(pos => `${pos.y}px`),
            transition: isDragging.map(i => i ? '' : 'left 0.3s ease, top 0.3s ease')
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
