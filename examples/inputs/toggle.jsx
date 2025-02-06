import { mount, Observer } from 'destam-dom';
import { Toggle } from 'destamatic-ui';

const value = Observer.mutable(false);

mount(document.body, <div style={{ display: 'flex', flexDirection: 'column', gap: 20, margin: 10 }}>
    <Toggle value={value} />
</div>);
