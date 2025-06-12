import { mount, Observer } from 'destam-dom';
import FeatherIcons from "destamatic-ui/components/icons/FeatherIcons";
import { Button, Modal, ModalContext, ThemeContext, popups, TextField, Typography, Icons, Popup } from 'destamatic-ui';

const timer = Observer.timer(1000);

const value = {
    modals: {
        // basic modal
        basic: ({}) => {
            return <div style={{ width: '500px', height: '500px', background: 'red' }}>
                test
            </div>;
        },

        // modal with context from where it was invoked.
        state: ({timer, someContext}) => {
            return <div style={{ width: '500px', height: '500px', background: 'blue' }}>
                {someContext ?? null}
                <br />
                Global state passed into modal from context declaration:
                <br />
                {timer}
                <br />
            </div>;
        },

        // disable click away and esc button
        trapped: ({modal}) => {
            return <div style={{ width: '500px', height: '500px', background: 'green' }}>
                you can't escape!
                <Button type='contained' label='Exit' onClick={() => modal.close()} />
            </div>;
        },

        // cross modal context
        page1: ({modal}) => {
            const val = Observer.mutable();

            return <div style={{ width: '500px', height: '500px', background: 'blue' }}>
                Welcome to Page 1.
                <br />
                clicking this button will move you to page2 without losing context

                <TextField placholder='Enter some context' value={val} />
                <Button type='contained' label='page2' onClick={() => {
                    modal.open({name: 'page2', label: 'Page 2', val})
                }} />
            </div>
        },
        page2: ({val}) => {
            return <div style={{ width: '500px', height: '500px', background: 'green' }}>
                Here is your context from page1!!!
                <br />
                {val}
            </div>;
        },

        // Custom modal template:
        template: ({}) => {
            return <div style={{ width: '500px', height: '500px', background: 'orange' }}>
                Custom template!
            </div>;
        }
    },
    // place any state you want into value when sending it to ModalContext, it will get sent to the modal automatically.
    timer,
};

// Any component can use the Modals context to retreive the currently displayed modal.
const Comp = ModalContext.use(m => ThemeContext.use(h => ({label}) => <div>
    <Button type='contained' label='Basic' onClick={() => {
        m.open({ name: 'basic', label: 'Basic Modal' })
    }} />
    <Button type='contained' label='State' onClick={() => {
        m.open({ name: 'state', someContext: 'some extra context here', label: 'Modal with state' });
    }} />
    <Button type='contained' label='Trapped' onClick={() => {
        m.open({ name: 'trapped', label: 'Trapped!', noEsc: true, noClickEsc: true });
    }} />
    <Button type='contained' label='Paged' onClick={() => {
        m.open({ name: 'page1', label: 'Page 1' });
    }} />
    <Button type='contained' label='Template' onClick={() => {
        const customTemplate = ({ m, children }) => {
            return <Popup style={{ inset: 0 }}>
                <div theme='modalOverlay' onClick={() => !m.noClickEsc ? m.close() : null} />
                <div theme='modalWrapper' style={{ background: 'purple' }}>
                    <Typography
                        type='p1'
                        label={`this is the label: ${label}`}
                    />
                    These are the child elements:
                    {children}
                </div>
            </Popup>;
        };

        m.open({ name: 'template', template: customTemplate, label: 'Template' });
    }} />
</div>));

mount(document.body, <div>
    <Icons value={[FeatherIcons]}>
        <ModalContext value={value}>
            <Comp />
            <Modal />
            {popups}
        </ModalContext>
    </Icons>
</div>);
