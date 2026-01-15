import { Button, Stage, StageContext, TextField, Typography, Popup, PopupContext, Observer } from 'destamatic-ui';

const pages = {
    acts: {
        Home: ({ }) => {
            return <div style={{ background: 'red' }}>
                Home page content
            </div>;
        },
        About: ({ }) => {
            return <div style={{ background: 'blue' }}>
                About page content
            </div>;
        },
        Team: ({ }) => {
            return <div style={{ background: 'green' }}>
                Team page content
            </div>;
        },
        Careers: ({ }) => {
            return <div style={{ background: 'orange' }}>
                Careers page content
            </div>;
        },
    },
    template: ({ s, children }) => {
        return <div style={{ width: '100%', height: '100%', background: 'purple' }}>
            <div theme='row_spread'>
                <Typography
                    type='h2'
                    label={s.observer.path(['props', 'label'])
                        .map(l => l ? l : '')}
                />
            </div>
            {children}
        </div>;
    },
    urlRouting: true,
};

const Pages = StageContext.use(s => (_, __, mounted) => {
    const buttons = [
        {
            label: 'Home',
            onClick: () => s.open({ name: 'Home', label: 'Home' })
        },
        {
            label: 'About',
            onClick: () => s.open({ name: 'About', label: 'About' })
        },
        {
            label: 'Team',
            onClick: () => s.open({ name: 'Team', label: 'Team' })
        },
        {
            label: 'Careers',
            onClick: () => s.open({ name: 'Careers', label: 'Careers' })
        }
    ];

    const Buttons = ({ each }) => <Button type='contained' label={each.label} onClick={each.onClick} />

    mounted(() => {
        s.open({ name: 'Home', label: 'Home' });
    });

    return <div>
        <Typography type='h2' label='Pages' />
        <Typography type='p1' label='Stages can be used to create a page system given a list of components.' />
        <div theme='row' style={{ height: 500 }}>
            <div theme='column' style={{ width: 100 }}>
                <Buttons each={buttons} />
            </div>
            <Stage />
        </div>
    </div>;
});

const timer = Observer.timer(1000);

const modals = {
    acts: {
        // basic modal
        basic: ({ }) => {
            return <div style={{ width: '500px', height: '500px', background: 'red' }}>
                test
            </div>;
        },

        // modal with context from where it was invoked.
        state: ({ timer, someContext }) => {
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
        trapped: ({ stage }) => {
            return <div style={{ width: '500px', height: '500px', background: 'green' }}>
                you can't escape!
                <Button type='contained' label='Exit' onClick={() => stage.close()} />
            </div>;
        },

        // cross modal context
        page1: ({ stage }) => {
            const val = Observer.mutable();

            return <div style={{ width: '500px', height: '500px', background: 'blue' }}>
                Welcome to Page 1.
                <br />
                clicking this button will move you to page2 without losing context

                <TextField placholder='Enter some context' value={val} />
                <Button type='contained' label='page2' onClick={() => {
                    stage.open({ name: 'page2', label: 'Page 2', val })
                }} />
            </div>
        },
        page2: ({ val }) => {
            return <div style={{ width: '500px', height: '500px', background: 'green' }}>
                Here is your context from page1!!!
                <br />
                {val}
            </div>;
        },

        // Custom modal template:
        template: ({ }) => {
            return <div style={{ width: '500px', height: '500px', background: 'orange' }}>
                Custom template!
            </div>;
        }
    },
    // place any state you want into value when sending it to StageContext, it will get sent to the modal automatically.
    timer,
};

const Modals = StageContext.use(s => () => <>
    <Typography type='h3' label='Modals' />
    <Typography type='p1' label='Stages can also be used to create modals in combination with the Popup component. This is the Stage systems default template.' />

    <Button type='contained' label='Basic' onClick={() => {
        s.open({ name: 'basic', label: 'Basic Modal' })
    }} />
    <Button type='contained' label='State' onClick={() => {
        s.open({ name: 'state', someContext: 'some extra context here', label: 'Modal with state' });
    }} />
    <Button type='contained' label='Trapped' onClick={() => {
        s.open({ name: 'trapped', label: 'Trapped!', noEsc: true, noClickEsc: true });
    }} />
    <Button type='contained' label='Paged' onClick={() => {
        s.open({ name: 'page1', label: 'Page 1' });
    }} />
    <Button type='contained' label='Template' onClick={() => {
        const customTemplate = ({ s, children }) => {
            console.log(s);
            return <Popup style={{ inset: 0 }}>
                <div theme='stageOverlay' onClick={() => !s.noClickEsc ? s.close() : null} />
                <div theme='stageWrapper' style={{ background: 'purple' }}>
                    <Typography
                        type='p1'
                        label={`this is the label: ${s.label}`}
                    />
                    These are the child elements:
                    {children}
                </div>
            </Popup>;
        };

        s.open({ name: 'template', template: customTemplate, label: 'Template' });
    }} />
</>);

const Example = () => {
    return <PopupContext>
        <Typography type='h1' label='Stage' />
        <Typography type='p1' label='A Stage allows you to display, transition between, template, and control different components.' />
        <StageContext value={pages}>
            <Pages />
        </StageContext>
        <StageContext value={modals}>
            <Modals />
            <Stage />
            <Popup />
        </StageContext>
    </PopupContext>;
};

export default {
    example: Example,
    header: 'Stage',
};

