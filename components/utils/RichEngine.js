import { Observer } from 'destam';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export default class RichEngine {
    constructor({ valueObs, displayMapObs, wrapperObs, cursorElemObs, measureElemObs, lastMovedObs }) {
        this.value = valueObs;
        this.displayMap = displayMapObs;
        this.wrapper = wrapperObs;       // scroll container
        this.cursor = cursorElemObs;
        this.measureElem = measureElemObs; // Typography element
        this.lastMoved = lastMovedObs || Observer.mutable(Date.now());

        this.selection = Observer.mutable({ anchor: 0, focus: 0 });
        this.lastDirection = Observer.mutable('right');

        this.segments = [];
        this.length = 0;
        this.edgesAllowed = [];
        this.prevStrict = [];
        this.nextStrict = [];
        this.leftSegmentAt = [];
        this.rightSegmentAt = [];

        this.regionStartById = new Map();
        this.regionLenById = new Map();
        this.kindById = new Map();

        this.undoStack = [];
        this.redoStack = [];

        this._rebuildScheduled = false;
        this._raf = null;

        this._scheduleRebuild();

        const schedule = () => this._scheduleRebuild();
        if (this.displayMap?.observer?.effect) this.displayMap.observer.effect(schedule);
        else if (this.displayMap?.effect) this.displayMap.effect(schedule);
        this.value.effect(schedule);

        this._settingNativeSelection = false;

        this.selection.effect(sel => {
            this._updateCursor(sel);
            this._syncNativeSelection();
        });
        this._ensureScrollRaf = null;
    }

    // ----- selection helpers -----
    getSelection() { return this.selection.get(); }
    setSelection(anchor, focus, direction = 'right') {
        const len = this._getLength();
        const a = this._boundToLength(anchor ?? 0, len);
        const f = this._boundToLength(focus ?? 0, len);
        this.lastDirection.set(direction);
        const cur = this.selection.get();
        if (cur.anchor !== a || cur.focus !== f) this.selection.set({ anchor: a, focus: f });
    }
    setCaret(i, direction = 'right') { this.setSelection(i, i, direction); }
    selectAll() { this.setSelection(0, this._getLength(), 'right'); }

    getSelectedText() {
        const val = this.value.get() || '';
        const { anchor, focus } = this.selection.get();
        const start = Math.min(anchor, focus);
        const end = Math.max(anchor, focus);
        return val.slice(start, end);
    }

    // ----- movement -----
    prevIndex(i) {
        const len = this._getLength();
        i = clamp(i, 0, len);
        if (this.prevStrict?.length === len + 1) return this.prevStrict[i] ?? Math.max(0, i - 1);
        return Math.max(0, i - 1);
    }
    nextIndex(i) {
        const len = this._getLength();
        i = clamp(i, 0, len);
        if (this.nextStrict?.length === len + 1) return this.nextStrict[i] ?? Math.min(len, i + 1);
        return Math.min(len, i + 1);
    }
    moveLeft(extend = false) {
        const { anchor, focus } = this.selection.get();
        const f = this.prevIndex(focus);
        extend ? this.setSelection(anchor, f, 'left') : this.setCaret(f, 'left');
    }
    moveRight(extend = false) {
        const { anchor, focus } = this.selection.get();
        const f = this.nextIndex(focus);
        extend ? this.setSelection(anchor, f, 'right') : this.setCaret(f, 'right');
    }

    _rangeFromPoint(x, y) {
        if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
        const pos = document.caretPositionFromPoint?.(x, y);
        if (!pos) return null;
        const r = document.createRange();
        r.setStart(pos.offsetNode, pos.offset);
        r.collapse(true);
        return r;
    }

    _caretClientPoint() {
        const { side, rect } = this.indexToEdge(this.selection.get().focus, this.lastDirection.get());
        if (!rect) return null;
        const x = side === 'left' ? rect.left : rect.right;
        const y = rect.top + rect.height / 2;
        return { x, y, rect };
    }

    moveUp(extend = false) {
        this._moveVertical(-1, extend);
    }

    moveDown(extend = false) {
        this._moveVertical(1, extend);
    }

    _moveVertical(dir, extend) {
        const base = this._caretClientPoint();
        if (!base) return;

        const step = Math.max(8, base.rect.height || 16);
        const x = base.x;
        const y = base.y + dir * step;

        const r = this._rangeFromPoint(x, y);
        if (!r) return;

        const idx = this._indexFromDom(r.startContainer, r.startOffset, x);
        if (idx == null) return;

        const cur = this.selection.get();
        const newDir = idx >= cur.focus ? 'right' : 'left';

        if (extend) this.setSelection(cur.anchor, idx, newDir);
        else this.setCaret(idx, newDir);
    }

    _lineStartIndex(i) {
        const val = this.value.get() || '';
        i = clamp(i, 0, val.length);
        const j = val.lastIndexOf('\n', i - 1);
        return j === -1 ? 0 : (j + 1);
    }

    _lineEndIndex(i) {
        const val = this.value.get() || '';
        i = clamp(i, 0, val.length);
        const j = val.indexOf('\n', i);
        return j === -1 ? val.length : j;
    }

    moveLineStart(extend = false) {
        const cur = this.selection.get();
        const idx = this._lineStartIndex(cur.focus);
        const dir = idx >= cur.focus ? 'right' : 'left';
        extend ? this.setSelection(cur.anchor, idx, dir) : this.setCaret(idx, dir);
    }

    moveLineEnd(extend = false) {
        const cur = this.selection.get();
        const idx = this._lineEndIndex(cur.focus);
        const dir = idx >= cur.focus ? 'right' : 'left';
        extend ? this.setSelection(cur.anchor, idx, dir) : this.setCaret(idx, dir);
    }

    moveDocStart(extend = false) {
        const cur = this.selection.get();
        extend ? this.setSelection(cur.anchor, 0, 'left') : this.setCaret(0, 'left');
    }

    moveDocEnd(extend = false) {
        const end = this._getLength();
        const cur = this.selection.get();
        extend ? this.setSelection(cur.anchor, end, 'right') : this.setCaret(end, 'right');
    }

    // ----- word nav (VSCode-ish) -----
    _isWhitespace(ch) { return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'; }
    _isWordChar(ch) { return !!ch && /[A-Za-z0-9_]/.test(ch); }
    _charClass(ch) {
        if (this._isWhitespace(ch)) return 'ws';
        if (this._isWordChar(ch)) return 'word';
        return 'punct';
    }

    wordLeftIndex(i) {
        const val = this.value.get() || '';
        i = clamp(i, 0, val.length);
        if (i === 0) return 0;
        while (i > 0 && this._isWhitespace(val[i - 1])) i--;
        if (i === 0) return 0;
        const cls = this._charClass(val[i - 1]);
        while (i > 0 && this._charClass(val[i - 1]) === cls) i--;
        return i;
    }

    wordRightIndex(i) {
        const val = this.value.get() || '';
        i = clamp(i, 0, val.length);
        const N = val.length;
        if (i >= N) return N;
        while (i < N && this._isWhitespace(val[i])) i++;
        if (i >= N) return N;
        const cls = this._charClass(val[i]);
        while (i < N && this._charClass(val[i]) === cls) i++;
        return i;
    }

    moveWordLeft(extend = false) {
        const { anchor, focus } = this.selection.get();
        const f = this.wordLeftIndex(focus);
        extend ? this.setSelection(anchor, f, 'left') : this.setCaret(f, 'left');
    }
    moveWordRight(extend = false) {
        const { anchor, focus } = this.selection.get();
        const f = this.wordRightIndex(focus);
        extend ? this.setSelection(anchor, f, 'right') : this.setCaret(f, 'right');
    }

    // ----- edits -----
    _makeSnapshot() {
        return { value: this.value.get() || '', selection: { ...this.selection.get() }, direction: this.lastDirection.get() };
    }
    _restoreSnapshot(snap) {
        this.value.set(snap.value);
        this.lastDirection.set(snap.direction || 'right');
        this.setSelection(snap.selection.anchor, snap.selection.focus, snap.direction || 'right');
        this.updateCursor();
    }
    _pushUndoSnapshot() {
        this.undoStack.push(this._makeSnapshot());
    }

    undo() {
        const snap = this.undoStack.pop();
        if (!snap) return;
        this.redoStack.push(this._makeSnapshot());
        this._restoreSnapshot(snap);
    }
    redo() {
        const snap = this.redoStack.pop();
        if (!snap) return;
        this.undoStack.push(this._makeSnapshot());
        this._restoreSnapshot(snap);
    }

    insertText(text) {
        this._pushUndoSnapshot();
        this.redoStack.length = 0;

        const val = this.value.get() || '';
        const { anchor, focus } = this.selection.get();
        const start = Math.min(anchor, focus);
        const end = Math.max(anchor, focus);
        this.value.set(val.slice(0, start) + text + val.slice(end));
        this.setCaret(start + text.length, 'right');
        this.ensureCaretVisibleSoon();
    }

    deleteSelection() {
        const { anchor, focus } = this.selection.get();
        if (anchor === focus) return false;

        this._pushUndoSnapshot();
        this.redoStack.length = 0;

        const val = this.value.get() || '';
        const start = Math.min(anchor, focus);
        const end = Math.max(anchor, focus);
        this.value.set(val.slice(0, start) + val.slice(end));
        this.setCaret(start, 'right');
        return true;
    }

    _prevCodePointIndex(val, i) {
        if (!val || i <= 0) return 0;
        const cp = val.codePointAt(i - 1);
        return i - (cp > 0xFFFF ? 2 : 1);
    }
    _nextCodePointIndex(val, i) {
        const len = (val || '').length;
        if (!val || i >= len) return len;
        const cp = val.codePointAt(i);
        return i + (cp > 0xFFFF ? 2 : 1);
    }

    deleteBackward() {
        const { anchor, focus } = this.selection.get();
        if (anchor !== focus) return this.deleteSelection();

        const val = this.value.get() || '';
        const start = this._prevCodePointIndex(val, focus);
        if (start === focus) return;

        this._pushUndoSnapshot();
        this.redoStack.length = 0;

        this.value.set(val.slice(0, start) + val.slice(focus));
        this.setCaret(start, 'right');
        this.ensureCaretVisibleSoon();
    }

    deleteForward() {
        const { anchor, focus } = this.selection.get();
        if (anchor !== focus) return this.deleteSelection();

        const val = this.value.get() || '';
        const end = this._nextCodePointIndex(val, focus);
        if (end === focus) return;

        this._pushUndoSnapshot();
        this.redoStack.length = 0;

        this.value.set(val.slice(0, focus) + val.slice(end));
        this.setCaret(focus, 'right');
    }

    deleteWordBackward() {
        const { anchor, focus } = this.selection.get();
        if (anchor !== focus) return this.deleteSelection();

        const val = this.value.get() || '';
        const start = this.wordLeftIndex(focus);
        if (start === focus) return;

        this._pushUndoSnapshot();
        this.redoStack.length = 0;

        this.value.set(val.slice(0, start) + val.slice(focus));
        this.setCaret(start, 'right');
    }

    deleteWordForward() {
        const { anchor, focus } = this.selection.get();
        if (anchor !== focus) return this.deleteSelection();

        const val = this.value.get() || '';
        const end = this.wordRightIndex(focus);
        if (end === focus) return;

        this._pushUndoSnapshot();
        this.redoStack.length = 0;

        this.value.set(val.slice(0, focus) + val.slice(end));
        this.setCaret(focus, 'right');
    }

    // ----- indexing / mapping -----
    reindex() {
        this._rebuildIndex();
        this.updateCursor();
        this._syncNativeSelection();
    }

    _domPointForIndex(i, bias = 'right') {
        const wrapperEl = this.wrapper.get();
        if (!wrapperEl) return null;

        i = this._boundToLength(i, this._getLength());

        // Prefer a segment on the side we are moving towards
        const segLeft = this.leftSegmentAt[i];
        const segRight = this.rightSegmentAt[i];

        let seg = null;
        if (bias === 'left') seg = segLeft || segRight;
        else seg = segRight || segLeft;

        // Fallback: if we can't find any segment, place caret at start of measureEl/wrapper
        const measureEl = this.measureElem.get();
        if (!seg) {
            const host = measureEl || wrapperEl;
            return { kind: 'container', node: host, offset: 0 };
        }

        const node = this._ensureNode(seg);
        if (!node) {
            const host = measureEl || wrapperEl;
            return { kind: 'container', node: host, offset: 0 };
        }

        // Atomic: position before/after the element node
        if (seg.kind === 'atomic') {
            const parent = node.parentNode;
            if (!parent) return { kind: 'container', node: node, offset: 0 };

            const idx = Array.prototype.indexOf.call(parent.childNodes, node);
            const off = idx + (bias === 'right' ? 1 : 0);
            return { kind: 'container', node: parent, offset: Math.max(0, off) };
        }

        // Non-atomic: find text position inside node from global index
        const info = this._getRegionInfo(seg, node);
        const regionStart = info.regionStart;
        const textLen = (node.textContent || '').length;

        const local = clamp(i - regionStart, 0, textLen);
        const pt = this._textNodeAtOffset(node, local);

        return { kind: 'text', node: pt.node, offset: pt.offset };
    }

    _textNodeAtOffset(ancestor, offset) {
        // Walk text nodes and find which one contains the boundary
        const walker = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT);
        let n = walker.nextNode();

        // If there's no text nodes at all, fallback to ancestor
        if (!n) return { node: ancestor, offset: 0 };

        while (n) {
            const len = (n.nodeValue || '').length;
            if (offset <= len) return { node: n, offset };
            offset -= len;
            n = walker.nextNode();
        }

        // If offset is past end, clamp to end of last text node
        // (walker is exhausted; we need to re-walk to find last)
        const walker2 = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT);
        let last = walker2.nextNode();
        let cur = last;
        while (cur) { last = cur; cur = walker2.nextNode(); }

        return { node: last || ancestor, offset: (last?.nodeValue || '').length };
    }

    _syncNativeSelection() {
        // guard against recursion / selectionchange noise
        if (this._settingNativeSelection) return;

        const wrapperEl = this.wrapper.get();
        if (!wrapperEl) return;

        // Only show native selection when focused (optional but usually nicer)
        if (document.activeElement !== wrapperEl) return;

        const sel = window.getSelection();
        if (!sel) return;

        const { anchor, focus } = this.selection.get();
        const start = Math.min(anchor, focus);
        const end = Math.max(anchor, focus);

        const startPt = this._domPointForIndex(start, 'left');
        const endPt = this._domPointForIndex(end, 'right');
        if (!startPt || !endPt) return;

        const range = document.createRange();

        try {
            range.setStart(startPt.node, startPt.offset);
            range.setEnd(endPt.node, endPt.offset);

            this._settingNativeSelection = true;
            sel.removeAllRanges();
            sel.addRange(range);
        } finally {
            this._settingNativeSelection = false;
        }
    }

    setSelectionFromNativeSelection(windowSelection, clickX) {
        if (!windowSelection || windowSelection.rangeCount === 0) return;
        const anchorIndex = this._indexFromDom(windowSelection.anchorNode, windowSelection.anchorOffset, clickX);
        const focusIndex = this._indexFromDom(windowSelection.focusNode, windowSelection.focusOffset, clickX);
        if (anchorIndex == null || focusIndex == null) return;
        const dir = focusIndex >= anchorIndex ? 'right' : 'left';
        this.setSelection(anchorIndex, focusIndex, dir);
    }

    updateCursor() { this._updateCursor(this.selection.get()); }

    wakeCaret() {
        this.lastMoved.set(Date.now());
        const el = this.cursor.get();
        if (el) el.style.opacity = '1';
    }

    ensureCaretVisibleSoon(padding = 8) {
        if (this._ensureScrollRaf) cancelAnimationFrame(this._ensureScrollRaf);
        this._ensureScrollRaf = requestAnimationFrame(() => {
            this._ensureScrollRaf = null;
            this.ensureCaretVisible(padding);
            this.wakeCaret();
        });
    }

    ensureCaretVisible(padding = 8) {
        const sel = this.selection.get();
        if (sel.focus == null) return;

        const { side, rect } = this.indexToEdge(sel.focus, this.lastDirection.get());
        const wrapper = this.wrapper.get();
        if (!wrapper || !rect) return;

        const wRect = wrapper.getBoundingClientRect();
        const originX = wRect.left + wrapper.clientLeft;
        const originY = wRect.top + wrapper.clientTop;

        // IMPORTANT: use right edge when caret is on the right side
        const caretViewportX = ((side === 'left') ? rect.left : rect.right) - originX;

        const w = wrapper.clientWidth;
        if (caretViewportX < padding) wrapper.scrollLeft += (caretViewportX - padding);
        else if (caretViewportX > w - padding) wrapper.scrollLeft += (caretViewportX - (w - padding));

        // optional vertical (safe to keep)
        const caretTop = rect.top - originY;
        const caretBot = rect.bottom - originY;
        const h = wrapper.clientHeight;

        if (caretTop < padding) wrapper.scrollTop += (caretTop - padding);
        else if (caretBot > h - padding) wrapper.scrollTop += (caretBot - (h - padding));

        const prevLeft = wrapper.scrollLeft;
        const prevTop = wrapper.scrollTop;

        if (wrapper.scrollLeft !== prevLeft || wrapper.scrollTop !== prevTop) {
            this.wakeCaret();
        }
    }

    // ----- core caret draw -----
    _updateCursor(sel) {
        const caret = sel?.focus;
        const cursorEl = this.cursor.get();
        const wrapperEl = this.wrapper.get();
        if (!cursorEl || !wrapperEl || caret == null) return;

        this.lastMoved.set(Date.now());
        cursorEl.style.opacity = '1';

        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = requestAnimationFrame(() => {
            const { side, rect } = this.indexToEdge(caret, this.lastDirection.get());
            if (!rect) return;

            const wRect = wrapperEl.getBoundingClientRect();
            const originX = wRect.left + wrapperEl.clientLeft;
            const originY = wRect.top + wrapperEl.clientTop;

            // X in content coords
            const visualX = (side === 'left' ? rect.left : rect.right) - originX;
            const contentX = visualX + (wrapperEl.scrollLeft || 0);

            // Height: prefer computed line-height, but trust rect.height when reasonable
            const measureEl = this.measureElem.get();
            let fontSizePx = 16;
            let lineHeightPx = 16;

            if (measureEl) {
                const cs = getComputedStyle(measureEl);

                const fs = parseFloat(cs.fontSize);
                if (!Number.isNaN(fs) && fs > 0) fontSizePx = fs;

                const lhRaw = cs.lineHeight;
                if (lhRaw && lhRaw !== 'normal') {
                    const lhNum = parseFloat(lhRaw);
                    if (!Number.isNaN(lhNum) && lhNum > 0) {
                        lineHeightPx = lhRaw.endsWith('px') ? lhNum : (lhNum * fontSizePx);
                    }
                } else {
                    lineHeightPx = fontSizePx * 1.2;
                }
            }

            // Y MUST come from rect, otherwise multiline caret sticks to the top line
            const visualTop = rect.top - originY;
            const topContent = visualTop + (wrapperEl.scrollTop || 0);

            // If rect.height looks sane, use it (better with inline nodes)
            const rectH = rect.height || 0;
            const height = (rectH > 2 && rectH < 200) ? rectH : lineHeightPx;

            const caretWidth = clamp(Math.round((fontSizePx / 16) * 2), 1, 4);

            cursorEl.style.left = `${contentX}px`;
            cursorEl.style.top = `${topContent}px`;
            cursorEl.style.height = `${height}px`;
            cursorEl.style.width = `${caretWidth}px`;
        });
    }

    _getLength() { return (this.value.get() || '').length | 0; }
    _boundToLength(i, len) { return clamp((i ?? 0) | 0, 0, len); }

    _scheduleRebuild() {
        if (this._rebuildScheduled) return;
        this._rebuildScheduled = true;
        queueMicrotask(() => {
            this._rebuildScheduled = false;
            this._rebuildIndex();
            this.updateCursor();
        });
    }

    _rebuildIndex() {
        this.segments = Array.from(this.displayMap);
        this.length = this._getLength();

        const N = this.length;
        this.edgesAllowed = new Array(N + 1).fill(false);
        this.leftSegmentAt = new Array(N + 1);
        this.rightSegmentAt = new Array(N + 1);
        this.regionStartById.clear();
        this.regionLenById.clear();
        this.kindById.clear();

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

            const prevStart = this.regionStartById.get(id);
            this.regionStartById.set(id, prevStart == null ? start : Math.min(prevStart, start));

            if (seg.kind !== 'atomic') {
                this.regionLenById.set(id, (this.regionLenById.get(id) || 0) + 1);
            } else {
                const span = Math.max(1, end - start);
                this.regionLenById.set(id, Math.max(this.regionLenById.get(id) || 0, span));
            }
        }

        this.edgesAllowed[0] = true;
        this.edgesAllowed[N] = true;

        this._buildEdgeTables();

        const cur = this.selection.get();
        const a = this._boundToLength(cur.anchor ?? 0, N);
        const f = this._boundToLength(cur.focus ?? 0, N);
        if (a !== cur.anchor || f !== cur.focus) this.selection.set({ anchor: a, focus: f });
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

    // ----- mapping: unchanged from your existing engine (kept short) -----
    indexToEdge(i, preferredSide = this.lastDirection.get()) {
        i = this._boundToLength(i, this._getLength());

        const segLeft = this.leftSegmentAt[i];
        const segRight = this.rightSegmentAt[i];

        let seg = null;
        let side = 'left';

        if (preferredSide === 'left') {
            if (segLeft) { seg = segLeft; side = 'left'; }
            else if (segRight) { seg = segRight; side = 'right'; }
        } else {
            if (segRight) { seg = segRight; side = 'right'; }
            else if (segLeft) { seg = segLeft; side = 'left'; }
        }

        if (!seg) {
            const wrapper = this.wrapper.get();
            if (!wrapper) return { node: null, side: 'left', rect: null };
            const w = wrapper.getBoundingClientRect();
            const rect = { left: w.left, right: w.left, top: w.top, bottom: w.bottom, width: 0, height: w.height };
            return { node: wrapper, side: 'left', rect };
        }

        const node = this._ensureNode(seg);
        if (!node) return { node: null, side, rect: null };

        if (seg.kind === 'atomic') return { node, side, rect: this._nodeRect(node) };

        const info = this._getRegionInfo(seg, node);
        const regionStart = info.regionStart;
        const textLen = info.textLength;

        let charIndex = side === 'left' ? (i - regionStart) : (i - regionStart - 1);
        charIndex = clamp(charIndex, 0, textLen - 1);

        const rect = this._charRect(node, charIndex) || this._nodeRect(node);
        return { node, side, rect };
    }

    _indexFromDom(node, nodeOffset, clickX) {
        if (!node) return null;
        const wrapperEl = this.wrapper.get();
        if (!wrapperEl) return null;

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

        const localOffset = this._textOffsetWithinAncestor(elem, node, nodeOffset);
        const bounded = clamp(localOffset, 0, boundedLen);
        return this._boundToLength(regionStart + bounded, this._getLength());
    }

    _ascendToDisplayElement(node, stopAt) {
        let cur = node;
        while (cur && cur !== stopAt) {
            if (cur.nodeType === Node.ELEMENT_NODE) {
                if (cur.hasAttribute('displayId') || cur.hasAttribute('data-display-id')) return cur;
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
            if (n === node) return offset + clamp(nodeOffset || 0, 0, (n.nodeValue || '').length);
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
                const range = document.createRange();
                range.setStart(textNode, remaining);
                range.setEnd(textNode, remaining + 1);
                return range.getBoundingClientRect();
            }
            remaining -= len;
            textNode = walker.nextNode();
        }
        return ancestor.getBoundingClientRect();
    }

    _nodeRect(node) {
        const range = document.createRange();
        range.selectNode(node);
        return range.getBoundingClientRect();
    }

    _ensureNode(seg) {
        const node = seg.node;
        if (node && node.nodeType === 1) return node;

        const wrapper = this.wrapper.get();
        if (!wrapper || !seg.displayId) return null;

        let el = wrapper.querySelector(`[displayId="${seg.displayId}"]`);
        if (!el) el = wrapper.querySelector(`[data-display-id="${seg.displayId}"]`);
        if (el) seg.node = el;
        return el;
    }

    _getRegionInfo(seg, nodeMaybe) {
        const id = seg.displayId;
        const regionStart = this.regionStartById.get(id) ?? seg.start;
        const kind = this.kindById.get(id) || seg.kind;

        const node = nodeMaybe || this._ensureNode(seg);

        let textLength;
        if (node) textLength = (node.textContent || '').length;
        else textLength = kind === 'atomic' ? Math.max(1, (seg.end - seg.start)) : (this.regionLenById.get(id) || 1);

        return { regionStart, textLength: Math.max(1, textLength | 0) };
    }
}