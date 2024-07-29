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
    Markdown,
    CodeBlock
} from '../src';

const DemoPage = Theme.use(theme => () => {
    const handleClick = () => {
        console.log('Button clicked');
    };

    const drawerOpen = Observer.mutable(false);

    const kebabValue = Observer.mutable({x: 0, y: 0});

    const markdown = Observer.mutable(`
# h1, **bold** *italic* ***bold and italic***
## h2, **bold** *italic* ***bold and italic***
### h3, **bold** *italic* ***bold and italic***
#### h4, **bold** *italic* ***bold and italic***
##### h5, **bold** *italic* ***bold and italic***
###### h6, **bold** *italic* ***bold and italic***

**bold** *italic*

***bold and italic combined***

> This is a quote block. 
> This is part of the same quote block

This is not a quote block

\`\`\`javascript
// This is a code block

// with multiple lines

const main = () => {
    for (let i = 0; i < 100; i++) {
        console.log("Hello World!");
    };
};

main()

\`\`\`

# This is a header between two code blocks

\`\`\`python
# This is a code block

# with multiple lines

def main():
    for i in 100:
        print("Hello World!")

main()

\`\`\`

My favorite search engine is [Duck Duck Go](https://duckduckgo.com "The best search engine for privacy").

# This is a link in a header: [Duck Duck Go](https://duckduckgo.com "The best search engine for privacy")

# TODO:

#### This is a bold link in a header: **[Duck Duck Go](https://duckduckgo.com "The best search engine for privacy")**

#### This is an italic link in a header: *[Duck Duck Go](https://duckduckgo.com "The best search engine for privacy")*

#### This is a bold italic link in a header ***[Duck Duck Go](https://duckduckgo.com "The best search engine for privacy")***

**this is bold**
- this is a point with a dash \`-\`
* this is a point with a star \`*\``);
    
    const python = `
def main():
    for i in 100:
        print("Hello World!")

main()
    `
    const javascript = `
const main = () => {
    for (let i = 0; i < 100; i++) {
        console.log("Hello World!");
    };
};

main()
    `

    return <div $style={{
        fontFamily: 'Roboto, sans-serif',
        padding: '20px',
        inset: '0px',
        position: 'absolute',
    }}>
        <CodeBlock language='python' code={python} />
        <CodeBlock language='javascript' code={javascript} />

        <Markdown markdown={markdown} />
        <TextArea value={markdown} style={{width: "1000px", height: "500px"}}/>
        {/* <Popup placement={{x: 100, y: 100}} style={{background: 'white'}}>
            <Typography type="h1">Destamatic UI Demo</Typography>
            <Typography type="h2">Typography</Typography>
            <Typography type="h3">Heading 3 Regular</Typography>
            <Typography type="h3" bold>Heading 3 Bold</Typography>
            <Typography type="p1">Paragraph 1 Regular</Typography>
            <Typography type="p1" bold>Paragraph 1 Bold</Typography>
            <Typography type="p2">Paragraph 2 Regular</Typography>
            <Typography type="p2" bold>Paragraph 2 Bold</Typography>
        </Popup> */}

        <Typography type="h1">Destamatic UI Demo</Typography>
        <Typography type="h2">Typography</Typography>
        <Typography type="h3">Heading 3 Regular</Typography>
        <Typography type="h3" bold>Heading 3 Bold</Typography>
        <Typography type="p1">Paragraph 1 Regular</Typography>
        <Typography type="p1" bold>Paragraph 1 Bold</Typography>
        <Typography type="p2">Paragraph 2 Regular</Typography>
        <Typography type="p2" bold>Paragraph 2 Bold</Typography>

        <Typography type="h2" $style={{marginTop: '20px'}}>Buttons</Typography>
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
        <Theme value={{
            Button: {
                contained: { base: { backgroundColor: 'pink' } },
                outlined: { base: { backgroundColor: 'pink' } },
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
                    Icon={<Icon libraryName="feather" iconName="feather" />}
                />
                <Button
                    label="Icon Contained"
                    type="contained"
                    onClick={handleClick}
                    Icon={<Icon libraryName="feather" iconName="feather" />}
                />
            </div>
        </Theme>

        <Typography type="h2" $style={{marginTop: '20px'}}>Loading Dots</Typography>
        <LoadingDots />

        <Typography type="h2" $style={{marginTop: '20px'}}>Dropdown</Typography>
        <DropDown label="Click to Toggle">
            <div $style={{ padding: '10px', border: `1px solid ${theme.Colours.secondary.base}` }}>
                Dropdown Content
            </div>
        </DropDown>

        <Typography type="h2" $style={{marginTop: '20px'}}>Inputs</Typography>
        <Input placeholder="Type here..." $style={{ marginBottom: '10px' }} />
        <TextArea placeholder="Enter more text here..." style={{ width: '100%' }} />

        <Typography type="h2" $style={{marginTop: '20px'}}>Drawer</Typography>
        <Drawer open={drawerOpen}>
            <div>
                <Typography type="p1">Drawer Content</Typography>
            </div>
        </Drawer>

        <Typography type="h2" $style={{marginTop: '20px'}}>Chevron</Typography>
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
});

mount(document.body, <>
    <DemoPage />
    {popups}
</>);
