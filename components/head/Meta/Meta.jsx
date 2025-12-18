import { Observer } from 'destam-dom';
import { HeadContext } from '../Head/Head.jsx';

const Meta = HeadContext.use(api => {
    return ({ name, content, property, httpEquiv, charset, group }, cleanup) => {
        if (content == null) content = '';

        if (!(content instanceof Observer)) {
            content = Observer.immutable(content);
        }

        const props = {};
        if (name) props.name = name;
        if (property) props.property = property;
        if (httpEquiv) props['http-equiv'] = httpEquiv;
        if (charset) props.charset = charset;

        if (!charset) props.content = content;

        const computedGroup =
            group ??
            (charset
                ? 'meta:charset'
                : httpEquiv
                    ? `meta:httpEquiv:${httpEquiv}`
                    : name
                        ? `meta:name:${name}`
                        : property
                            ? `meta:property:${property}`
                            : undefined);

        const node = <raw:meta {...props} />;

        const remove = computedGroup
            ? api.addUnique(computedGroup, node)
            : api.add(node);

        cleanup(remove);
        return null;
    };
});

export default Meta;