import { h } from '../utils/h';
import { Observer } from 'destam-dom';

import Detached from '../utils/Detached';
import Paper from '../display/Paper';
import IconComponent from '../display/Icon';
import Button from '../inputs/Button';
import Shown from '../utils/Shown';

const KebabMenu = ({Icon, shown, children, items, style, ...props}) => {
    if (!(shown instanceof Observer)) shown = Observer.mutable(false);

    if (!Icon) {
        Icon = <IconComponent libraryName='feather' iconName='more-vertical' />
    }

    if (items) {
        const Stuff = ({each: {onClick, Icon, enabled, ...props}}) => {
            if (!Icon) {
                let label = props.label;

                let i = label.indexOf(' ');
                if (i >= 0) label = label.substring(0, i);
                label = label.toLowerCase();

                const thing = {
                    rename: 'edit-2',
                    delete: 'x',
                    remove: 'x',
                    ask: 'message-circle',
                    chat: 'message-circle',
                    add: 'plus',
                    new: 'plus',
                    copy: 'copy',
                    cut: 'scissors',
                    share: 'share',
                    download: 'download',
                    export: 'download',
                    info: 'info',
                    inspect: 'layers',
                    select: 'activity',
                }[label];

                Icon = thing && <IconComponent libraryName='feather' iconName={thing} style={{paddingRight: 20, boxSizing: 'content-box'}} size={20}/>;
            }

            return <Shown value={enabled ?? true}>
                <Button
                    Icon={Icon}
                    type='text'
                    style={{
                        borderRadius: 0,
                        width: '100%',
                        padding: '25px 10px',
                        justifyContent: 'left',
                    }}
                    {...props}
                    onClick={e => {
                        shown.set(false);
                        onClick(e);
                    }}
                />
            </Shown>;
        };

        children = <Paper tight style={{minWidth: 200}}>
            <Stuff each={items} />
        </Paper>
    }

    return <Detached
        enabled={shown}
        menu={Icon}
        style={{
            border: 'none',
            ...style,
        }}
        {...props}
    >
        {children}
    </Detached>;
};

export default KebabMenu;
