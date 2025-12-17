import { Observer } from 'destam-dom';
import { HeadContext } from '../Head/Head.jsx';

const Meta = HeadContext.use(api => {
    return ({ name, content, property, httpEquiv, charset }, cleanup) => {
        if (!(content instanceof Observer)) {
            content = Observer.immutable(content);
        }

        const props = {};
        if (name) props.name = name;
        if (property) props.property = property;
        if (httpEquiv) props['http-equiv'] = httpEquiv;
        if (charset) props.charset = charset;
        props.content = content;

        const node = <raw:meta {...props} />;

        const remove = api.add(node);
        cleanup(remove);

        return null;
    };
});

export default Meta;
