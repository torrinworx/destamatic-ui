import { HeadContext } from './Head';

/**
 * <Link> – wraps <link> head tag.
 *
 * Props:
 *  - rel, href, as, type, media, integrity, crossorigin, referrerPolicy, disabled, etc.
 *  - group?: explicit group name for stacking/override semantics.
 *
 * Default grouping:
 *  - If no `group` is provided and both `rel` and `href` are present,
 *    we use group = `link:${rel}:${href}` so that the same link is deduped.
 *  - Otherwise, no group => multiple instances allowed.
 */
const Link = HeadContext.use(api => {
    return ({
        rel,
        href,
        group,
        ...props
    }, cleanup) => {
        // Compute a default group for dedupe if not explicitly provided
        const computedGroup =
            group ?? (rel && href ? `link:${rel}:${href}` : undefined);

        const node = <raw:link rel={rel} href={href} {...props} />;

        const remove = computedGroup
            ? api.addUnique(computedGroup, node) // one per rel+href
            : api.add(node);                     // many allowed

        cleanup(remove);
        return null;
    };
});

export default Link;
