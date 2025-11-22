/* node:coverage disable */

// global.DOMParser = window.DOMParser;
global.DOMParser = class DOMParserStub {
    parseFromString(str, type) {
        return {
            body: {
                innerHTML: str,
            },
        };
    }
};

global.Node = class Node {
    constructor(name) {
        this.name = name;
        this.childNodes = [];
        this.attributes = {};
        this.eventListeners = {};

        const style = {};
        Object.defineProperty(this, 'style', {
            get: () => style,
            enumerable: true,
        });
    }

    set textContent(content) {
        if (this.name === '') {
            this.textContent_ = String(content);
        } else if (content === '') {
            for (const child of this.childNodes) {
                child.parentElement = null;
            }

            this.childNodes.splice(0, this.childNodes.length);
        } else {
            throw new Error("not supported");
        }
    }

    get children() {
        return this.childNodes.filter(e => e.name);
    }

    get textContent() {
        if (this.name === '') {
            return this.textContent_;
        }

        throw new Error("not supported");
    }

    get firstChild() {
        return this.childNodes[0] ?? null;
    }

    get lastChild() {
        return this.childNodes[this.childNodes.length - 1] ?? null;
    }

    get nextSibling() {
        if (!this.parentElement) throw new Error("does not belong to a parent");
        let c = this.parentElement.childNodes;
        let i = c.indexOf(this);
        return c[i + 1] ?? null;
    }

    get previousSibling() {
        if (!this.parentElement) throw new Error("does not belong to a parent");
        let c = this.parentElement.childNodes;
        let i = c.indexOf(this);
        return c[i - 1] ?? null;
    }

    append(node) {
        node.remove();
        node.parentElement = this;
        this.childNodes.push(node);
    }

    prepend(node) {
        node.remove();
        node.parentElement = this;
        this.childNodes.unshift(node);
    }

    insertBefore(node, before) {
        if (!before) {
            this.append(node);
            return;
        }

        if (node === before) {
            return;
        }

        node.remove();
        node.parentElement = this;

        const i = this.childNodes.indexOf(before);
        if (i === -1) throw new Error("node not found");
        this.childNodes.splice(i, 0, node);
    }

    replaceChild(node, before) {
        const i = this.childNodes.indexOf(before);
        if (i === -1) throw new Error("node not found");

        node.remove();
        node.parentElement = this;
        before.parentElement = null;
        this.childNodes[i] = node;
        return node;
    }

    removeChild(child) {
        const i = this.childNodes.indexOf(child);
        if (i === -1) throw new Error("node not found");
        child.parentElement = null;
        this.childNodes.splice(i, 1);
        return child;
    }

    remove() {
        if (document.activeElement === this) document.activeElement = null;

        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
    }

    replaceWith(node) {
        if (!this.parentElement) throw new Error("does not belong to a parent");
        this.parentElement.replaceChild(node, this);
    }

    setAttribute(name, val) {
        this.attributes[name] = String(val);
    }

    toggleAttribute(name, val) {
        if (!val) {
            delete this.attributes[name];
        } else {
            this.attributes[name] = '';
        }
    }

    focus() {
        document.activeElement = this;
    }

    tree() {
        if (this.name === '') {
            return this.textContent_;
        }

        const ret = { ...this };
        delete ret.parentElement;

        delete ret.childNodes;
        if (this.childNodes.length) {
            ret.children = this.childNodes.map(child => child.tree());
        }

        if (!Object.keys(this.attributes).length) {
            delete ret.attributes;
        }

        if (!Object.keys(this.style).length) {
            delete ret.style;
        }

        return ret;
    }

    addEventListener(type, listener) {
        if (!(type in this.eventListeners)) {
            this.eventListeners[type] = [];
        }
        this.eventListeners[type].push(listener);
    }

    removeEventListener(type, listener) {
        if (!(type in this.eventListeners)) return;
        const idx = this.eventListeners[type].indexOf(listener);
        if (idx !== -1) {
            this.eventListeners[type].splice(idx, 1);
        }
    }

    // Dummy dispatchEvent
    dispatchEvent(event) {
        const listeners = this.eventListeners[event.type];
        if (listeners) {
            listeners.forEach(listener => listener.call(this, event));
        }
    }
};

global.document = {
    createElement: name => new Node(name),
    createElementNS: (space, name) => {
        const node = new Node(name);
        node.namespace = space;
        return node;
    },
    createTextNode: text => {
        const node = new Node('');
        node.textContent = text;
        return node;
    },
};

global.document.dummy = {
    removeChild(child) { },
    replaceChild(newNode, oldNode) { },
    insertBefore(newNode, before) { },
};

global.document.head = new Node('head');
