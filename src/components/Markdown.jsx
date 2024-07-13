import h from './h';
import { OArray, OObject, Observer } from 'destam-dom';
import Theme from './Theme';

const Element = ({ each: e }) => {
    const line = e.line;
    const block = e.block;

    if (block === "code") {
        return <pre><code $style={{backgroundColor: "red"}}>{line}</code></pre>;
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
    // Implement rules to determine the context based on the line content and previous context
    if (line.startsWith("```") && previousContext !== 'code') {
        return 'code';
    } else if (line.startsWith("```") && previousContext === 'code') {
        return null; // Exiting code block
    } else {
        return previousContext; // Continue previous block context
    }
};

// Function to parse markdown text into elements
const getElements = (markdown) => {
    const lines = markdown.split('\n');
    let currentBlock = null;
    return lines.map(line => {
        currentBlock = determineBlockContext(line, currentBlock);
        return OObject({ line, block: currentBlock });
    });
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
                    console.log("update new elemenet", newEl)
                    elements[i] = newEl;
                }
            } else {
                console.log("push new element", newEl)
                elements.push(newEl);
            }
        });
    });

    return <Element each={elements} />;
};

export default Markdown;
