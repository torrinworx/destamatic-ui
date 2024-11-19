// A wrapper that allows the child component to be draggable by the user

import { h } from './h';
import { Observer } from 'destam-dom';

const Drag = ({ children, onDragStart, onDrag, onDragEnd, snapBack = true }) => {
    const isDragging = Observer.mutable(false);
    const currentPosition = Observer.mutable({ x: 0, y: 0 });
    const originalPosition = Observer.mutable({ x: 0, y: 0 });
    const offset = Observer.mutable({ x: 0, y: 0 });

    const lagFactor = 0.1;
    const catchUpThreshold = 1;

    let parentElement = null;

    const handleMouseDown = (e) => {
        e.preventDefault();
        isDragging.set(true);
        parentElement = e.currentTarget.parentNode;

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
    };

    const handleMouseMove = (e) => {
        if (!isDragging.get() || !parentElement) return;
        const parentRect = parentElement.getBoundingClientRect();

        const targetX = e.clientX - parentRect.left - offset.get().x;
        const targetY = e.clientY - parentRect.top - offset.get().y;

        const diffX = targetX - currentPosition.get().x;
        const diffY = targetY - currentPosition.get().y;

        const newX = Math.abs(diffX) < catchUpThreshold ? targetX : currentPosition.get().x + diffX * lagFactor;
        const newY = Math.abs(diffY) < catchUpThreshold ? targetY : currentPosition.get().y + diffY * lagFactor;

        currentPosition.set({ x: newX, y: newY });

        if (onDrag) onDrag(e);
    };

    const handleMouseUp = (e) => {
        isDragging.set(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

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
