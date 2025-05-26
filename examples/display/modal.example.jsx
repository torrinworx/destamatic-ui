import { mount, Observer } from 'destam-dom';
import { Button, Modal, ModalContext, ThemeContext, popups, TextField } from 'destamatic-ui';


const globalState = Observer.mutable(true);

const value = {
    modals: {
        // basic modal
        test1: ModalContext.use(m => {
            console.log("modal context: ", m);
            return () => <div style={{ width: '500px', height: '500px', background: 'red' }}>
                test
            </div>;
        }),

        // modal with context from where it was invoked.
        test2: ModalContext.use(m => {
            return () => <div style={{ width: '500px', height: '500px', background: 'blue' }}>
                {m.someContext}
                <br />
                test2
            </div>;
        }),

        // disable click away
        test3: ModalContext.use(m => {
            return () => <div style={{ width: '500px', height: '500px', background: 'green' }}>
                you can't escape!
                <Button type='contained' label='Exit' onClick={() => m.current.set(false)} />
            </div>;
        }),

        // cross modal context
        page1: ModalContext.use(m => {
            return () => {
                const value = m.value = Observer.mutable('');

                return <div style={{ width: '500px', height: '500px', background: 'blue' }}>
                    Welcome to Page 1.
                    <br />
                    clicking this button will move you to page2 without losing context

                    <TextField placholder='Enter some context' value={value} />
                    <Button type='contained' label='page2' onClick={() => m.current.set('page2')} />
                </div>
            };
        }),
        page2: ModalContext.use(m => {
            return () => <div style={{ width: '500px', height: '500px', background: 'green' }}>
                Here is your context from page1!!!
                <br />
                {m.value.map(m => m)}
                <Button type='contained' label='Exit' onClick={() => m.current.set(false)} />
            </div>;
        }),
    },
    globalState,
};

// Any component can use the Modals context to retreive the currently displayed modal.
const Comp = ModalContext.use(m => ThemeContext.use(h => {
    const Comp = () => <div>
        <Button type='contained' label='Test1' onClick={() => m.current.set('test1')} />
        <Button type='contained' label='Test2' onClick={() => {
            m.someContext = 'some extra context here';
            m.current.set('test2');
        }} />
        <Button type='contained' label='Test3' onClick={() => {
            m.forced = true;
            m.keep = true
            m.current.set('test3');
        }} />
        <Button type='contained' label='Page1' onClick={() => m.current.set('page1')} />

    </div>;
    return Comp
}));

globalState.effect(g => console.log(g));

mount(document.body, <div>
    <ModalContext value={value}>
        <Comp />
        <Modal />
        {popups}
    </ModalContext>
</div>);
