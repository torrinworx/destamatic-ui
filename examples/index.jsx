import { h } from 'destam-dom';
import { Observer, mount } from 'destam-dom';
import Popup, {popups} from '../src/components/Popup';
import {
    Theme,
    Typography,
    Button,
    Icon,
    LoadingDots,
    DropDown,
    Input,
    TextArea,
    Drawer,
    Chevron,
    KebabMenu,
} from '../src';

const DemoPage = () => {
    const handleClick = () => {
        console.log('Button clicked');
    };

    const drawerOpen = Observer.mutable(false);

    const kebabValue = Observer.mutable({x: 0, y: 0});

    return <div $style={{
        fontFamily: 'Roboto, sans-serif',
        padding: '20px',
        inset: '0px',
        position: 'absolute',
    }}>
        <Popup placement={{x: 100, y: 100}} style={{background: 'white'}}>
            <Typography variant="h1">Destamatic UI Demo</Typography>
            <Typography variant="h2">Typography</Typography>
            <Typography variant="h3">Heading 3 Regular</Typography>
            <Typography variant="h3" bold>Heading 3 Bold</Typography>
            <Typography variant="p1">Paragraph 1 Regular</Typography>
            <Typography variant="p1" bold>Paragraph 1 Bold</Typography>
            <Typography variant="p2">Paragraph 2 Regular</Typography>
            <Typography variant="p2" bold>Paragraph 2 Bold</Typography>
        </Popup>

        <Typography variant="h1">Destamatic UI Demo</Typography>
        <Typography variant="h2">Typography</Typography>
        <Typography variant="h3">Heading 3 Regular</Typography>
        <Typography variant="h3" bold>Heading 3 Bold</Typography>
        <Typography variant="p1">Paragraph 1 Regular</Typography>
        <Typography variant="p1" bold>Paragraph 1 Bold</Typography>
        <Typography variant="p2">Paragraph 2 Regular</Typography>
        <Typography variant="p2" bold>Paragraph 2 Bold</Typography>

        <Typography variant="h2" $style={{marginTop: '20px'}}>Buttons</Typography>
        <div $style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Button label="Text Button" type="text" onClick={handleClick} />
            <Button label="Contained Button" type="contained" onClick={handleClick} />
            <Button label="Outlined Button" type="outlined" onClick={handleClick} />
            <Button
                label="Icon Outline"
                type="outlined"
                onClick={handleClick}
                Icon={<Icon libraryName="feather" iconName="feather" />}
            />
            <Button
                label="Icon Contained"
                type="contained"
                onClick={handleClick}
                Icon={<Icon libraryName="feather" iconName="feather" />}
            />
        </div>

        <Typography variant="h2" $style={{marginTop: '20px'}}>Loading Dots</Typography>
        <LoadingDots />

        <Typography variant="h2" $style={{marginTop: '20px'}}>Dropdown</Typography>
        <DropDown label="Click to Toggle">
            <div $style={{ padding: '10px', border: `1px solid ${Theme.Colours.secondary.base}` }}>
                Dropdown Content
            </div>
        </DropDown>

        <Typography variant="h2" $style={{marginTop: '20px'}}>Inputs</Typography>
        <Input placeholder="Type here..." $style={{ marginBottom: '10px' }} />
        <TextArea placeholder="Enter more text here..." style={{ width: '100%' }} />

        <Typography variant="h2" $style={{marginTop: '20px'}}>Drawer</Typography>
        <Drawer open={drawerOpen}>
            <div>
                <Typography variant="p1">Drawer Content</Typography>
            </div>
        </Drawer>

        <Typography variant="h2" $style={{marginTop: '20px'}}>Chevron</Typography>
        <div>
            <Chevron />
        </div>

        <div $style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
        }}>
            <KebabMenu anchor='down-left'>
                <div $style={{
                    background: 'grey',
                    borderRadius: '10px',
                }}>
                    <Button label='hello' />
                    <br />
                    <Button label='world' />
                </div>
            </KebabMenu>
        </div>
    </div>;
};

mount(document.body, <>
    <DemoPage />
    {popups}
</>);
