import { Observer } from 'destam-dom';
import { HeadContext } from '../Head/Head.jsx';

const Title = HeadContext.use(api => {
    return ({ children, text, group = 'title' }, cleanup) => {
        const content =
            (children && children.length > 0) ? children : (text || '');

        const obs = (content instanceof Observer)
            ? content
            : Observer.immutable(content);

        const node = <raw:title $textContent={obs} />;

        const remove = api.addUnique(group, node);
        cleanup(remove);

        return null;
    };
});

export default Title;
