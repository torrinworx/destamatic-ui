// components/head/Style.jsx
import { Observer } from 'destam-dom';
import { HeadContext } from './Head';

/**
 * <Style> – wraps <style> in <head>.
 *
 * Props:
 *  - children: CSS text (string or Observer).
 *  - media?: media query string.
 *  - group?: group key for stacking/override.
 *
 * Default grouping:
 *  - If group is not provided, we group by `style:${media || 'all'}` so that
 *    last <Style> for a given media overrides the previous ones.
 *  - If you want many independent styles for same media, just pass group={null}.
 */
const Style = HeadContext.use(api => {
    return ({
        children,
        media,
        group,
        ...props
    }, cleanup) => {
        let css = children;

        if (css == null) css = '';
        if (!(css instanceof Observer)) {
            css = Observer.immutable(css);
        }

        const computedGroup =
            group ?? `style:${media || 'all'}`;

        const node = <raw:style media={media} $textContent={css} {...props} />;

        const remove = computedGroup
            ? api.addUnique(computedGroup, node)
            : api.add(node);

        cleanup(remove);
        return null;
    };
});

export default Style;