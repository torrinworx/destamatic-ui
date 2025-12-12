import { Observer } from 'destam-dom';
import { HeadContext } from './Head';

const Title = HeadContext.use(api => {
    return ({ children, text, group = 'title' }, cleanup) => {
        let content;
        if (children && children.length > 0) {
            content = children;
        } else {
            content = text || '';
        }

        if (!(content instanceof Observer)) {
            content = Observer.immutable(content);
        }

        const node = <raw:title $textContent={content} />;

        const remove = api.addUnique(group, node);
        cleanup(remove);

        return null;
    };
});

export default Title;
