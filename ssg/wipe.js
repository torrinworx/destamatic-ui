/**
 * Remove all existing children from document.body.
 * Intended to be called before mounting an SPA
 * over SSG‑rendered HTML.
 */
const wipe = () => {
    const body = document.body;
    if (!body) return;

    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }
};

export default wipe;
