/* node:coverage disable */

class DOMParserStub {
    parseFromString(str, type) {
        // Very minimal fake "document" that matches what Icon.jsx expects
        // Icon.jsx uses: parser.parseFromString(...).children[0]
        const doc = {
            // children[0] should be an <svg>‑like node
            children: [],
        };

        // Build a fake Node that looks like an <svg> with one text child.
        // We only need enough to not break Icon.jsx: attributes, firstElementChild, etc.
        const svgNode = new global.Node('svg'); // uses your Node stub

        // You can optionally parse out attributes from `str` if you want,
        // but for SSG it's usually enough to just stuff the raw string in as a text node.
        const textNode = new global.Node('');
        textNode.textContent = str;
        svgNode.append(textNode);

        doc.children.push(svgNode);
        return doc;
    }
}

global.DOMParser = DOMParserStub;

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
        const str = String(content ?? '');

        if (this.name === '') {
            // This is a text node
            this.textContent_ = str;
            return;
        }

        // For element nodes: clear children, then insert a single text node
        // if the content is not empty.
        // This matches browser semantics well enough for SSG.
        // Remove all existing children:
        for (const child of this.childNodes) {
            child.parentElement = null;
        }
        this.childNodes.splice(0, this.childNodes.length);

        if (str !== '') {
            const textNode = new Node('');
            textNode.textContent_ = str;
            textNode.parentElement = this;
            this.childNodes.push(textNode);
        }
    }

    get children() {
        return this.childNodes.filter(e => e.name);
    }

    get textContent() {
        if (this.name === '') {
            return this.textContent_;
        }

        // Minimal: concatenate text children recursively
        let out = '';
        for (const child of this.childNodes) {
            out += child.textContent ?? '';
        }
        return out;
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

global.document.documentElement = new Node('html');
global.document.head = new Node('head');
global.document.body = new Node('body');

global.document.documentElement.append(global.document.head);
global.document.documentElement.append(global.document.body);

// --- window stub (new) ---

if (typeof global.window === 'undefined') {
    global.window = {
        document: global.document,
        DOMParser: global.DOMParser,
        Node: global.Node,
    };
}

// minimal location so routing code doesn't explode
if (!global.window.location) {
    global.window.location = {
        href: 'http://localhost/',
        protocol: 'http:',
        host: 'localhost',
        hostname: 'localhost',
        port: '',
        pathname: '/',
        search: '',
        hash: '',
    };
}

// minimal event handling so `window.addEventListener` works
if (typeof global.window.addEventListener !== 'function') {
    const listeners = {};

    global.window.addEventListener = (type, handler) => {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(handler);
    };

    global.window.removeEventListener = (type, handler) => {
        const arr = listeners[type];
        if (!arr) return;
        const i = arr.indexOf(handler);
        if (i !== -1) arr.splice(i, 1);
    };

    // optional: a way to fire events if you ever need it in tests
    global.window.dispatchEvent = (event) => {
        const arr = listeners[event.type] || [];
        arr.forEach(fn => fn.call(global.window, event));
    };
}

if (typeof globalThis !== 'undefined') {
    globalThis.window = global.window;
}

if (typeof global.fetch === 'function') {
    // Keep a reference to Node/Undici's fetch
    const realFetch = global.fetch;

    // Lazy require of fs & path to avoid issues if this file is ever used in browser
    const fs = await import('fs/promises').then(m => m.default || m);
    const path = await import('path').then(m => m.default || m);

    const projectRoot = process.cwd(); // your repo root when running SSG
    console.log(projectRoot)

    global.fetch = async (input, init) => {
        // Normalize to string
        const url = typeof input === 'string' ? input : input?.url;

        // Handle only absolute-path URLs like "/blog/..."
        if (typeof url === 'string' && url.startsWith('/blog/')) {
            // Map "/blog/..." -> "<projectRoot>/frontend/public/blog/..."
            const rel = url.replace(/^\/blog\//, '');
            const filePath = path.join(projectRoot, 'build', 'dist', 'blog', rel);

            try {
                const data = await fs.readFile(filePath);

                // Basic Response-like object
                return {
                    ok: true,
                    status: 200,
                    url,
                    // minimal headers mock
                    headers: new Map([['content-type', 'application/json']]),
                    // .text() and .json()
                    text: async () => data.toString('utf8'),
                    json: async () => JSON.parse(data.toString('utf8')),
                };
            } catch (err) {
                return {
                    ok: false,
                    status: 404,
                    url,
                    headers: new Map(),
                    text: async () => '',
                    json: async () => { throw new Error(`404 for ${url}`); },
                };
            }
        }

        // For anything else, fall back to real fetch (must be absolute URL in Node)
        return realFetch(input, init);
    };
}
