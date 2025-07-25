import { Observer, mount, OObject } from 'destam-dom';
import {
    Theme,
    ThemeContext,
    Typography,
    Button,
    Icon,
    LoadingDots,
    DropDown,
    TextField,
    TextArea,
    Slider,
    Tabs,
    Paper,
    ColorPicker,
    Date as DateComponent,
    PopupContext
} from 'destamatic-ui';
import color from 'destamatic-ui/util/color';

const DemoPage = () => {
    const handleClick = () => {
        console.log('Button clicked');
    };

    const text = Observer.mutable('');

    const date = Observer.mutable(new Date());

    const specialTheme = OObject({
        special: OObject({
            $color: 'green'
        })
    });

    return <div $style={{
        fontFamily: 'Roboto, sans-serif',
        padding: '20px',
        inset: '0px',
        position: 'absolute',
    }}>
        <Tabs style={{ width: '100%' }}>
            <mark:tab name="one">
                One
            </mark:tab>
            <mark:tab name="two">
                Two
            </mark:tab>
            <mark:tab name="Three">
                Three
            </mark:tab>
        </Tabs>

        <div theme="center" style={{ flexDirection: 'column' }}>
            <ColorPicker value={specialTheme.observer.path(['special', '$color'])
                .setter((val, set) => set(color.toCSS(val)))} />

            <Theme value={specialTheme}>
                <ThemeContext value="special">
                    <DateComponent value={date} />
                </ThemeContext>
            </Theme>
            <Button onClick={() => {
                let d = new Date(date.get());
                d.setFullYear(d.getFullYear() + 1);
                date.set(d);
            }}>Advance one Year</Button>
            <div>
                {date.map(d => d.toString())}
            </div>
        </div>

        <Typography type="h1" label="Destamatic UI Demo" />
        <Typography type="h2" label="Typography" />
        <Typography type="h3" label="Heading 3 Regular" />
        <Typography type="h3_bold" label="Heading 3 Bold" />
        <Typography type="p1" label="Paragraph 1 Regular" />
        <Typography type="p1_bold" label="Paragraph 1 Bold" />
        <Typography type="p2" label="Paragraph 2 Regular" />
        <Typography type="p2_bold" label="Paragraph 2 Bold" />

        <Typography type="h2" $style={{ marginTop: '20px' }} label="Buttons" />
        <div $style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Button label="Text Button" type="text" onClick={handleClick} />
            <Button label="Contained Button" type="contained" onClick={handleClick} />
            <Button label="Outlined Button" type="outlined" onClick={handleClick} />
            <Button
                label="Icon Outline"
                type="outlined"
                onClick={handleClick}
                icon={<Icon name="feather" />}
            />
            <Button
                label="Icon Contained"
                type="contained"
                onClick={handleClick}
                icon={<Icon name="feather" />}
            />
        </div>
        <Theme value={{
            primary: {
                $color: 'pink',
                $color_hover: 'blue',
                $color_top: 'white',
            },

            myContent: {
                color: 'red',
            },

            button_contained: {
                background: 'linear-gradient($color, $hue($color, 0.1))'
            }
        }}>
            <div $style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <Button label="Text Button" type="text" onClick={handleClick} />
                <Button label="Contained Button" type="contained" onClick={handleClick} />
                <Button label="Outlined Button" type="outlined" onClick={handleClick} />
                <Button
                    label="Icon Outline"
                    type="outlined"
                    onClick={handleClick}
                    icon={<Icon name="feather" />}
                />
                <Button
                    label="Icon Contained"
                    type="contained"
                    onClick={handleClick}
                    icon={<Icon name="feather" />}
                />
            </div>

            <Typography type="h2" $style={{ marginTop: '20px' }} label="Dropdown" />
            <DropDown label="Click to Toggle">
                <div theme="myContent">
                    Dropdown Content
                </div>
            </DropDown>
        </Theme>

        <Typography type="h2" $style={{ marginTop: '20px' }} label="Loading Dots" />
        <LoadingDots />

        <Typography type="h2" $style={{ marginTop: '20px' }} label="Slider" />
        <Slider min={0} max={100} value={Observer.mutable(0)} />

        <Paper>
            <Typography type="h2" $style={{ marginTop: '20px' }} label="Inputs" />
            <TextField placeholder="Type here..." style={{ marginBottom: '10px', width: '100%' }} value={text} />
            <TextArea placeholder="Enter more text here..." style={{ width: '100%' }} value={text} />
        </Paper>
    </div>;
};

mount(document.body, <PopupContext>
    <DemoPage />
</PopupContext>);
