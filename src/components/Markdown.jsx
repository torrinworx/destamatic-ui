import h from './h';
import { OArray, OObject, Observer } from 'destam-dom';
import Theme from './Theme';

const Element = ({ each: e }) => {
    const line = e.line;
    const block = e.block;

    if (block === "code" && Array.isArray(line)) {
        return <div $style={{backgroundColor: 'red'}}>{line.map(l => <pre><code>{l}</code></pre>)}</div>;
    }

    if (line.startsWith('# ')) {
        return <h1 $style={Theme.Typography.h1}>{line.slice(2)}</h1>;
    } else if (line.startsWith('## ')) {
        return <h2 $style={Theme.Typography.h2.bold}>{line.slice(3)}</h2>;
    } else if (line.startsWith('### ')) {
        return <h3 $style={Theme.Typography.h3}>{line.slice(4)}</h3>;
    // h4, h5, h6 are not supported in destam-dom:
    // } else if (line.startsWith('#### ')) {
    //     return <h4 $style={Theme.Typography.h4}>{line.slice(5)}</h4>;
    // } else if (line.startsWith('##### ')) {
    //     return <h5 $style={Theme.Typography.h5}>{line.slice(6)}</h5>;
    // } else if (line.startsWith('###### ')) {
    //     return <h6 $style={Theme.Typography.h6}>{line.slice(7)}</h6>;
    }

    return <p $style={Theme.Typography.p1.regular}>{line}</p>;
};

// Function to determine the block context
const determineBlockContext = (line, previousContext) => {
    if (line.startsWith("```") && previousContext !== 'code') {
        return { block: 'code', position: 'start' };
    } else if (line.startsWith("```") && previousContext === 'code') {
        return { block: null, position: 'end' }; // Exiting code block
    } else if (previousContext === 'code') {
        return { block: 'code', position: 'middle' };
    } else {
        return { block: previousContext, position: 'middle' }; // Continue previous block context
    }
};

// Function to parse markdown text into elements
const getElements = (markdown) => {
    const lines = markdown.split('\n');
    let currentBlock = null;
    let currentPosition = 'middle';
    const elements = [];
    let buffer = [];

    lines.forEach(line => {
        const context = determineBlockContext(line, currentBlock);
        currentBlock = context.block;
        currentPosition = context.position;

        if (currentBlock === 'code') {
            if (currentPosition === 'start') {
                buffer.push(line.slice(3) + '\n'); // Start a new buffer for block
            } else if (currentPosition === 'middle') {
                if (buffer.length > 0) {
                    buffer.push(line + '\n'); // Accumulate lines in the buffer
                } else {
                    elements.push(OObject({ line, block: currentBlock, position: currentPosition }));
                }
            } else if (currentPosition === 'end') {
                console.log(line)
                if (buffer.length > 0) {
                    buffer.push(line.slice(-3) + '\n'); // End the block and wrap accumulated lines
                    elements.push(OObject({ line: buffer.join(''), block: 'code', position: 'single' }));
                    buffer = []; // Clear the buffer
                }
            }
        } else {
            if (buffer.length > 0) {
                elements.push(OObject({ line: buffer, block: 'code' }));
                buffer = [];
            }
            elements.push(OObject({ line, block: currentBlock, position: currentPosition }));
        }
    });

    if (buffer.length > 0) {
        // Flush remaining buffered block lines if the end wasn't found
        buffer.forEach(bufferedLine => {
            elements.push(OObject({ line: bufferedLine, block: 'code', position: 'middle' }));
        });
    }

    console.log(elements)
    return elements;
};

const Markdown = ({ markdown }) => {
    if (typeof markdown === 'string') {
        markdown = Observer.mutable(markdown);
    }

    const elements = OArray(getElements(markdown.get()));

    markdown.watch(delta => {
        const newElements = OArray(getElements(delta.value));

        // Adjust length of elements array
        if (newElements.length < elements.length) {
            elements.splice(newElements.length, elements.length - newElements.length);
        }

        newElements.forEach((newEl, i) => {
            if (i < elements.length) {
                if (elements[i].line !== newEl.line) {
                    elements[i] = newEl;
                }
            } else {
                elements.push(newEl);
            }
        });
    });

    return <Element each={elements} />;
};

export default Markdown;
