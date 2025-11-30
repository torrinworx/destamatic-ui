import { Observer } from 'destam-dom';
import { HeadContext } from './Head';

/**
 * <Script> – wraps <script> in <head>.
 *
 * Props:
 *  - src?: URL of external script.
 *  - children?: inline script text (string or Observer).
 *  - type?: script type (e.g., 'application/ld+json').
 *  - async, defer, crossOrigin, noModule, integrity, referrerPolicy, etc.
 *  - group?: override semantics; by default, if src present -> `script:src:${src}`,
 *    else (inline) `script:inline:${type || 'default'}` unless explicit group is provided.
 */
const Script = HeadContext.use(api => {
    return ({
        src,
        children,
        type,
        group,
        ...props
    }, cleanup) => {
        let content = children;

        if (content == null) content = '';
        if (!(content instanceof Observer)) {
            content = Observer.immutable(content);
        }

        // Default grouping:
        //  - external: one script per URL
        //  - inline: one script per type unless group is specified
        const computedGroup =
            group ??
            (src
                ? `script:src:${src}`
                : `script:inline:${type || 'default'}`);

        // Note: when `src` is present, browsers generally ignore textContent,
        // but we still set it via $textContent for completeness.
        const node = <raw:script
            src={src}
            type={type}
            $textContent={content}
            {...props}
        />;

        const remove = computedGroup
            ? api.addUnique(computedGroup, node)
            : api.add(node);

        cleanup(remove);
        return null;
    };
});

export default Script;