import { mount, Observer } from 'destam-dom';
import FeatherIcons from "destamatic-ui/components/icons/FeatherIcons";
import { Button, Modal, ModalContext, ThemeContext, popups, TextField, Typography, Icons } from 'destamatic-ui';

const globalState = Observer.mutable(true);

const value = {
    modals: {
        // basic modal
        test1: ModalContext.use(m => {
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

        // disable click away and esc button
        test3: ModalContext.use(m => {
            return () => <div style={{ width: '500px', height: '500px', background: 'green' }}>
                you can't escape!
                <Button type='contained' label='Exit' onClick={() => m.current = false} />
            </div>;
        }),

        // cross modal context
        page1: ModalContext.use(m => {
            return () => {
                m.value = '';

                return <div style={{ width: '500px', height: '500px', background: 'blue' }}>
                    Welcome to Page 1.
                    <br />
                    clicking this button will move you to page2 without losing context

                    <TextField placholder='Enter some context' value={m.observer.path('value')} />
                    <Button type='contained' label='page2' onClick={() => {
                        m.label = 'Page 2'
                        m.current = 'page2'
                    }} />
                </div>
            };
        }),
        page2: ModalContext.use(m => {
            console.log(m);
            return () => <div style={{ width: '500px', height: '500px', background: 'green' }}>
                Here is your context from page1!!!
                <br />
                {m.value}
                <Button type='contained' label='Exit' onClick={() => m.current = false} />
            </div>;
        }),

        // Custom modal template:
        template: ModalContext.use(m => {
            return () => <div style={{ width: '500px', height: '500px', background: 'orange' }}>
                Custom template!
            </div>;
        })
    },
    // place any state you want into value when sending it to ModalContext, it will get sent to the modal automatically.
    globalState,
};

// Any component can use the Modals context to retreive the currently displayed modal.
const Comp = ModalContext.use(m => ThemeContext.use(h => {
    const Comp = () => <div>
        <Button type='contained' label='Test1' onClick={() => {
            m.label = 'Test 1'
            m.current = 'test1'
        }} />
        <Button type='contained' label='Test2' onClick={() => {
            m.someContext = 'some extra context here';
            m.label = 'Test 2'
            m.current = 'test2';
        }} />
        <Button type='contained' label='Test3' onClick={() => {
            m.noEsc = true;
            m.noClickEsc = true;
            m.label = 'Test 3'
            m.current = 'test3';
        }} />
        <Button type='contained' label='Page1' onClick={() => {
            m.label = 'Page 1';
            m.current = 'page1';
        }} />
        <Button type='contained' label='Template' onClick={() => {
            const customTemplate = ({ m, children }) => {
                return <div style={{ background: 'purple' }}>
                    <Typography type='p1' label={m.observer.path('label').map(l => `this is the label: ${l}`)} />
                    These are the child elements:
                    {children}
                </div>;
            };

            m.label = 'Template';
            m.template = customTemplate;
            m.current = 'template';
        }} />
    </div>;
    return Comp
}));

globalState.effect(g => console.log(g));

mount(document.body, <div>
    <Icons value={[FeatherIcons]}>
        <ModalContext value={value}>
            <Comp />
            <Modal />
            {popups}
        </ModalContext>
    </Icons>
</div>);
