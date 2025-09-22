import { Observer } from 'destam';

export default class TextEngine {
    constructor({ valueObs, displayMapObs, wrapperObs, cursorElemObs, lastMovedObs }) {
        this.value = valueObs;               // Observer<string>
        this.displayMap = displayMapObs;     // OArray of normalized segments
        this.wrapper = wrapperObs;           // Observer<HTMLElement>
        this.cursor = cursorElemObs;         // Observer<HTMLElement>
        this.lastMoved = lastMovedObs || Observer.mutable(Date.now());

        // Selection in absolute text indices
        this.selection = Observer.mutable({ anchor: 0, focus: 0 });
        this.lastDirection = Observer.mutable('right'); // 'left' | 'right'

        // Derived tables
        this.segments = [];
        this.length = 0;
        this.edgesAllowed = [];
        this.prevStrict = [];
        this.nextStrict = [];
        this.leftSegmentAt = [];
        this.rightSegmentAt = [];

        // Region summaries (by displayId) so we can map DOM → absolute index
        this.regionStartById = new Map();
        this.regionLenById = new Map();
        this.kindById = new Map();

        // Coalesced rebuild scheduling
        this._rebuildScheduled = false;
        this._raf = null;

        // Initial build
        this._scheduleRebuild();

        // Rebuild when display map or value changes
        const schedule = () => this._scheduleRebuild();

        // Some OArray versions expose .observer, others have .effect on observer
        if (this.displayMap?.observer?.effect) {
            this.displayMap.observer.effect(schedule);
        } else if (this.displayMap?.effect) {
            this.displayMap.effect(schedule);
        }

        // When the raw value changes, just schedule a rebuild; don't clamp here
        this.value.effect(schedule);

        // Redraw cursor whenever selection changes
        this.selection.effect(sel => this._updateCursor(sel));
    }

    // ---------- Public API ----------

    getSelection() {
        return this.selection.get();
    }

    setSelection(anchor, focus, direction = 'right') {
        const len = this._getLength();
        const a = this._boundToLength(anchor ?? 0, len);
        const f = this._boundToLength(focus ?? 0, len);
        this.lastDirection.set(direction);
        const cur = this.selection.get();
        if (cur.anchor !== a || cur.focus !== f) {
            this.selection.set({ anchor: a, focus: f });
        }
    }

    setCaret(i, direction = 'right') {
        const len = this._getLength();
        i = this._boundToLength(i ?? 0, len);
        this.lastDirection.set(direction);
        const cur = this.selection.get();
        if (cur.anchor !== i || cur.focus !== i) {
            this.selection.set({ anchor: i, focus: i });
        }
    }

    moveLeft(extend = false) {
        const { anchor, focus } = this.selection.get();
        const f = this.prevIndex(focus);
        if (extend) this.setSelection(anchor, f, 'left');
        else this.setCaret(f, 'left');
    }

    moveRight(extend = false) {
        const { anchor, focus } = this.selection.get();
        const f = this.nextIndex(focus);
        if (extend) this.setSelection(anchor, f, 'right');
        else this.setCaret(f, 'right');
    }

    prevIndex(i) {
        const len = this._getLength();
        i = Math.max(0, Math.min(i, len));
        // If we have a table built, use it; otherwise fall back to i - 1
        if (this.prevStrict && this.prevStrict.length === len + 1) {
            const p = this.prevStrict[i];
            return p == null ? Math.max(0, i - 1) : p;
        }
        return Math.max(0, i - 1);
    }

    nextIndex(i) {
        const len = this._getLength();
        i = Math.max(0, Math.min(i, len));
        // If we have a table built, use it; otherwise fall back to i + 1
        if (this.nextStrict && this.nextStrict.length === len + 1) {
            const n = this.nextStrict[i];
            return n == null ? Math.min(len, i + 1) : n;
        }
        return Math.min(len, i + 1);
    }

    reindex() {
        this._rebuildIndex();
        this.updateCursor();
    }

    insertText(text) {
        const val = this.value.get() || '';
        const { anchor, focus } = this.selection.get();
        const start = Math.min(anchor, focus);
        const end = Math.max(anchor, focus);
        const newVal = val.slice(0, start) + text + val.slice(end);
        this.value.set(newVal);
        this.setCaret(start + text.length, 'right');
    }

    _prevCodePointIndex(val, i) {
        // Move one Unicode code point left from index i
        if (!val || i <= 0) return 0;
        const cp = val.codePointAt(i - 1);
        // If surrogate pair, codePointAt(i-1) returns full code point; step 2
        return i - (cp > 0xFFFF ? 2 : 1);
    }

    _nextCodePointIndex(val, i) {
        // Move one Unicode code point right from index i
        const len = (val || '').length;
        if (!val || i >= len) return len;
        const cp = val.codePointAt(i);
        return i + (cp > 0xFFFF ? 2 : 1);
    }

    deleteBackward() {
        const { anchor, focus } = this.selection.get();
        if (anchor !== focus) {
            const start = Math.min(anchor, focus);
            const end = Math.max(anchor, focus);
            this.replaceRange(start, end, '');
            this.setCaret(start, 'right');
            return;
        }
        const val = this.value.get() || '';
        const start = this._prevCodePointIndex(val, focus);
        if (start === focus) return;
        this.replaceRange(start, focus, '');
        this.setCaret(start, 'right');
    }

    deleteForward() {
        const { anchor, focus } = this.selection.get();
        if (anchor !== focus) {
            const start = Math.min(anchor, focus);
            const end = Math.max(anchor, focus);
            this.replaceRange(start, end, '');
            this.setCaret(start, 'right');
            return;
        }
        const val = this.value.get() || '';
        const end = this._nextCodePointIndex(val, focus);
        if (end === focus) return;
        this.replaceRange(focus, end, '');
        this.setCaret(focus, 'right');
    }

    replaceRange(start, end, text) {
        const val = this.value.get() || '';
        start = Math.max(0, Math.min(start, val.length));
        end = Math.max(0, Math.min(end, val.length));
        if (end < start) [start, end] = [end, start];
        const newVal = val.slice(0, start) + text + val.slice(end);
        this.value.set(newVal);
    }

    setSelectionFromNativeSelection(windowSelection, clickX) {
        if (!windowSelection || windowSelection.rangeCount === 0) return;
        const anchorIndex = this._indexFromDom(windowSelection.anchorNode, windowSelection.anchorOffset, clickX);
        const focusIndex = this._indexFromDom(windowSelection.focusNode, windowSelection.focusOffset, clickX);
        if (anchorIndex == null || focusIndex == null) return;
        const dir = focusIndex >= anchorIndex ? 'right' : 'left';
        this.setSelection(anchorIndex, focusIndex, dir);
    }

    indexToEdge(i, preferredSide = this.lastDirection.get()) {
        i = this._boundToLength(i, this._getLength());

        const segLeft = this.leftSegmentAt[i];
        const segRight = this.rightSegmentAt[i];

        // No segments yet (empty value or not rendered) → pin to wrapper left
        if (!segLeft && !segRight && this.segments.length === 0) {
            const wrapper = this.wrapper.get();
            if (!wrapper) return { node: null, side: 'left', rect: null };
            const w = wrapper.getBoundingClientRect();
            const rect = { left: w.left, right: w.left, top: w.top, bottom: w.bottom, width: 0, height: w.height };
            return { node: wrapper, side: 'left', rect };
        }

        let seg = null;
        let side = 'left';

        if (preferredSide === 'left') {
            if (segLeft) { seg = segLeft; side = 'left'; }
            else if (segRight) { seg = segRight; side = 'right'; }
        } else {
            if (segRight) { seg = segRight; side = 'right'; }
            else if (segLeft) { seg = segLeft; side = 'left'; }
        }

        // If still no owner, pick nearest legal edge owner using prev/next strict
        if (!seg) {
            const leftEdge = (this.prevStrict && this.prevStrict[i] != null) ? this.prevStrict[i] : 0;
            const rightEdge = (this.nextStrict && this.nextStrict[i] != null) ? this.nextStrict[i] : this._getLength();
            const dL = i - leftEdge;
            const dR = rightEdge - i;

            if (dL <= dR && this.leftSegmentAt[leftEdge]) {
                seg = this.leftSegmentAt[leftEdge];
                side = 'left';
            } else if (this.rightSegmentAt[rightEdge]) {
                seg = this.rightSegmentAt[rightEdge];
                side = 'right';
            } else if (this.leftSegmentAt[leftEdge]) {
                seg = this.leftSegmentAt[leftEdge];
                side = 'left';
            }
        }

        // Last fallback to wrapper if we still can't find a segment
        if (!seg) {
            const wrapper = this.wrapper.get();
            if (!wrapper) return { node: null, side: 'left', rect: null };
            const w = wrapper.getBoundingClientRect();
            const rect = { left: w.left, right: w.left, top: w.top, bottom: w.bottom, width: 0, height: w.height };
            return { node: wrapper, side: 'left', rect };
        }

        // Resolve DOM node
        const node = this._ensureNode(seg);
        if (!node) {
            const wrapper = this.wrapper.get();
            if (!wrapper) return { node: null, side: 'left', rect: null };
            const w = wrapper.getBoundingClientRect();
            const rect = { left: w.left, right: w.left, top: w.top, bottom: w.bottom, width: 0, height: w.height };
            return { node: wrapper, side, rect };
        }

        if (seg.kind === 'atomic') {
            const rect = this._nodeRect(node);
            return { node, side, rect };
        }

        // Non-atomic: measure single char rect
        const info = this._getRegionInfo(seg, node);
        const regionStart = info.regionStart;
        const textLen = info.textLength;

        let charIndex = side === 'left' ? (i - regionStart) : (i - regionStart - 1);
        charIndex = Math.max(0, Math.min(textLen - 1, charIndex));

        const rect = this._charRect(node, charIndex) || this._nodeRect(node);
        return { node, side, rect };
    }

    ensureCaretVisible(padding = 8) {
        const sel = this.selection.get();
        if (sel.focus == null) return;
        const { rect } = this.indexToEdge(sel.focus, this.lastDirection.get());
        const wrapper = this.wrapper.get();
        if (!wrapper || !rect) return;
        const wRect = wrapper.getBoundingClientRect();
        const x = rect.left - wRect.left;
        const leftNeeded = x - padding;
        const rightNeeded = x + padding;
        const scrollLeft = wrapper.scrollLeft;
        if (leftNeeded < 0) {
            wrapper.scrollLeft = scrollLeft + leftNeeded;
        } else if (rightNeeded > wRect.width) {
            wrapper.scrollLeft = scrollLeft + (rightNeeded - wRect.width);
        }
    }

    updateCursor() {
        this._updateCursor(this.selection.get());
    }

    // ---------- Internals ----------

    _getLength() {
        const val = this.value.get() || '';
        return val.length | 0;
    }

    _boundToLength(i, len) {
        if (i == null) return 0;
        return Math.max(0, Math.min(i | 0, len));
    }

    _scheduleRebuild() {
        if (this._rebuildScheduled) return;
        this._rebuildScheduled = true;
        queueMicrotask(() => {
            this._rebuildScheduled = false;
            this._rebuildIndex();
            // Keep cursor in correct place visually even if no edges yet
            this.updateCursor();
        });
    }

    _rebuildIndex() {
        // Snapshot segments (OArray → array)
        this.segments = Array.from(this.displayMap);
        this.length = this._getLength();

        const N = this.length;
        this.edgesAllowed = new Array(N + 1).fill(false);
        this.leftSegmentAt = new Array(N + 1);
        this.rightSegmentAt = new Array(N + 1);
        this.regionStartById.clear();
        this.regionLenById.clear();
        this.kindById.clear();

        // Build tables from segments
        for (const seg of this.segments) {
            const start = seg.start | 0;
            const end = seg.end | 0;

            if (start >= 0 && start <= N) {
                this.edgesAllowed[start] = true;
                if (!this.leftSegmentAt[start]) this.leftSegmentAt[start] = seg;
            }
            if (end >= 0 && end <= N) {
                this.edgesAllowed[end] = true;
                if (!this.rightSegmentAt[end]) this.rightSegmentAt[end] = seg;
            }

            const id = seg.displayId;
            this.kindById.set(id, seg.kind);
            if (!this.regionStartById.has(id)) this.regionStartById.set(id, start);
            else this.regionStartById.set(id, Math.min(this.regionStartById.get(id), start));

            if (seg.kind !== 'atomic') {
                // Non-atomic fragments represent a single character edge
                const prev = this.regionLenById.get(id) || 0;
                this.regionLenById.set(id, prev + 1);
            } else {
                // Atomic spans: ensure region len at least span length
                const span = Math.max(1, end - start);
                this.regionLenById.set(id, Math.max(this.regionLenById.get(id) || 0, span));
            }
        }

        // Always allow boundary edges
        this.edgesAllowed[0] = true;
        this.edgesAllowed[N] = true;

        this._buildEdgeTables();

        // Important: do NOT clamp selection to these edges here.
        // Only bound to [0..N] so we never “teleport” to 0 during transient rebuilds.
        const cur = this.selection.get();
        const a = this._boundToLength(cur.anchor ?? 0, N);
        const f = this._boundToLength(cur.focus ?? 0, N);
        if (a !== cur.anchor || f !== cur.focus) {
            this.selection.set({ anchor: a, focus: f });
        }
    }

    _buildEdgeTables() {
        const N = this.length;
        this.prevStrict = new Array(N + 1);
        this.nextStrict = new Array(N + 1);

        let last = null;
        for (let j = 0; j <= N; j++) {
            this.prevStrict[j] = last == null ? 0 : last;
            if (this.edgesAllowed[j]) last = j;
        }

        let next = null;
        for (let j = N; j >= 0; j--) {
            this.nextStrict[j] = next == null ? j : next;
            if (this.edgesAllowed[j]) next = j;
        }
    }

    _updateCursor(sel) {
        const caret = sel?.focus;
        const cursorEl = this.cursor.get();
        const wrapperEl = this.wrapper.get();
        if (cursorEl == null || wrapperEl == null || caret == null) return;

        // Make it visible immediately
        this.lastMoved.set(Date.now());

        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = requestAnimationFrame(() => {
            const { side, rect } = this.indexToEdge(caret, this.lastDirection.get());
            if (!rect) return;
            const wrapperRect = wrapperEl.getBoundingClientRect();
            const left = side === 'left' ? rect.left - wrapperRect.left : rect.right - wrapperRect.left;
            cursorEl.style.left = `${left}px`;
            cursorEl.style.height = `${wrapperRect.height}px`;
        });
    }

    _indexFromDom(node, nodeOffset, clickX) {
        if (!node) return null;
        const wrapperEl = this.wrapper.get();
        if (!wrapperEl) return null;

        // Climb to element with display id attribute
        const elem = this._ascendToDisplayElement(node, wrapperEl);
        if (!elem) return null;

        const id = elem.getAttribute('displayId') || elem.getAttribute('data-display-id');
        if (!id) return null;

        const kind = this.kindById.get(id) || 'fragment';
        const regionStart = this.regionStartById.get(id) ?? 0;
        const regionLen = this.regionLenById.get(id) ?? (elem.textContent || '').length;
        const boundedLen = Math.max(0, regionLen | 0);

        if (kind === 'atomic') {
            if (typeof clickX === 'number') {
                const rect = this._nodeRect(elem);
                const mid = rect.left + rect.width / 2;
                return clickX < mid ? regionStart : (regionStart + boundedLen);
            }
            return (nodeOffset || 0) <= 0 ? regionStart : (regionStart + boundedLen);
        }

        // Non-atomic: use text offset inside this element
        const localOffset = this._textOffsetWithinAncestor(elem, node, nodeOffset);
        const bounded = Math.max(0, Math.min(localOffset, boundedLen));
        const absolute = regionStart + bounded;
        return this._boundToLength(absolute, this._getLength());
    }

    _ascendToDisplayElement(node, stopAt) {
        let cur = node;
        while (cur && cur !== stopAt) {
            if (cur.nodeType === Node.ELEMENT_NODE) {
                if (cur.hasAttribute('displayId') || cur.hasAttribute('data-display-id')) {
                    return cur;
                }
            }
            cur = cur.parentNode;
        }
        return null;
    }

    _textOffsetWithinAncestor(ancestor, node, nodeOffset) {
        const walker = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT);
        let offset = 0;
        let n = walker.nextNode();
        while (n) {
            if (n === node) {
                const local = Math.max(0, Math.min(nodeOffset || 0, (n.nodeValue || '').length));
                return offset + local;
            }
            offset += (n.nodeValue || '').length;
            n = walker.nextNode();
        }
        return 0;
    }

    _charRect(ancestor, charIndex) {
        let remaining = charIndex;
        const walker = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode();
        while (textNode) {
            const len = (textNode.nodeValue || '').length;
            if (remaining < len) {
                try {
                    const range = document.createRange();
                    range.setStart(textNode, remaining);
                    range.setEnd(textNode, remaining + 1);
                    const rect = range.getBoundingClientRect();
                    return rect && rect.width !== 0 ? rect : ancestor.getBoundingClientRect();
                } catch (e) {
                    return ancestor.getBoundingClientRect();
                }
            }
            remaining -= len;
            textNode = walker.nextNode();
        }
        return ancestor.getBoundingClientRect();
    }

    _nodeRect(node) {
        try {
            const range = document.createRange();
            range.selectNode(node);
            return range.getBoundingClientRect();
        } catch (e) {
            return node.getBoundingClientRect();
        }
    }

    _ensureNode(seg) {
        const node = seg.node;
        if (node && node.nodeType === 1 && typeof node.getBoundingClientRect === 'function') {
            return node;
        }
        const wrapper = this.wrapper.get();
        if (!wrapper || !seg.displayId) return null;
        let el = wrapper.querySelector(`[displayId="${seg.displayId}"]`);
        if (!el) el = wrapper.querySelector(`[data-display-id="${seg.displayId}"]`);
        if (el) {
            seg.node = el; // cache
            return el;
        }
        return null;
    }

    _getRegionInfo(seg, nodeMaybe) {
        const id = seg.displayId;
        const regionStart = this.regionStartById.get(id) ?? seg.start;
        const kind = this.kindById.get(id) || seg.kind;

        let textLength;
        const node = nodeMaybe || this._ensureNode(seg);

        if (node) {
            textLength = (node.textContent || '').length;
            if (!this.regionLenById.has(id)) this.regionLenById.set(id, textLength);
        } else {
            if (kind === 'atomic') {
                textLength = (seg.end - seg.start) || (this.regionLenById.get(id) || 1);
            } else {
                textLength = this.regionLenById.get(id);
                if (textLength == null) {
                    textLength = this.segments.filter(s => s.displayId === id && s.kind !== 'atomic').length;
                    this.regionLenById.set(id, textLength);
                }
            }
        }

        return { regionStart, textLength: Math.max(1, textLength | 0) };
    }
}
