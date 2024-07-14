import h from './h';
import { OArray, OObject, Observer } from 'destam-dom';
import Theme from './Theme';

const Element = ({ each: e }) => {
    const line = e.line;
    const block = e.block;
    const position = e.position;

    if (position === 'end') return null;

    if (block === 'code' && Array.isArray(line)) {
        line.shift()
        line.pop()
        return <div 
            $style={{
                backgroundColor: Theme.Colours.secondary.base,
                borderRadius: Theme.borderRadius,
                padding: '10px',
                overflow: 'scroll'
            }}
        >
            {line.map((l) => <pre><code $style={Theme.Markdown.code}>{l}</code></pre>)}
        </div>;
    }

    if (block === 'quote' && Array.isArray(line)) {
        return <blockquote $style={Theme.Markdown.blockquote}>
        {line.map(l => {
            if (l.startsWith('> ')) {
                return l.slice(2);
            } else {
                return l;
            }
        })}
    </blockquote>;
    }

    if (line.startsWith('# ')) {
        return <h1 $style={Theme.Markdown.h1}>{line.slice(2)}</h1>;
    } else if (line.startsWith('## ')) {
        return <h2 $style={Theme.Markdown.h2}>{line.slice(3)}</h2>;
    } else if (line.startsWith('### ')) {
        return <h3 $style={Theme.Markdown.h3}>{line.slice(4)}</h3>;
    } else if (line.startsWith('#### ')) {
        return <h3 $style={Theme.Markdown.h4}>{line.slice(5)}</h3>;
    } else if (line.startsWith('##### ')) {
        return <h3 $style={Theme.Markdown.h5}>{line.slice(6)}</h3>;
    } else if (line.startsWith('###### ')) {
        return <h3 $style={Theme.Markdown.h6}>{line.slice(7)}</h3>;
    } else if (line.startsWith('> ')) {
        return <blockquote $style={Theme.Markdown.blockquote}>{line.slice(2)}</blockquote>;
    } else if (line.startsWith('- ')) {
        return <ul $style={Theme.Markdown.ul}><li>{line.slice(2)}</li></ul>;
    } else if (line.startsWith('* ')) {
        return <ul $style={Theme.Markdown.ul}><li>{line.slice(2)}</li></ul>;
    } else if (/^\d+\. /.test(line)) {
        return <ol $style={Theme.Markdown.ol}><li>{line.slice(line.indexOf(' ') + 1)}</li></ol>;
    }

    return <p $style={Theme.Markdown.p}>{line}</p>;
};

const determineBlockContext = (line, prevBlock, prevPosition) => {
    // Code Blocks:
    if (line.startsWith("```") && prevBlock !== 'code') {
        return { block: 'code', position: 'start' };
    } else if (line.startsWith("```") && prevBlock === 'code' && prevPosition === 'middle') {
        return { block: 'code', position: 'end' };
    } else if (prevBlock === 'code' && prevPosition !== 'end') {
        return { block: prevBlock, position: 'middle' };

    // Block Quotes:
    } else if (line.startsWith('> ')) {
        return {block: 'quote', position: 'floating'}
    } else if (prevBlock === 'floating' && line.startsWith('> ')) {
        return { block: 'quote', position: 'floating' }

    // Non block lines:
    } else {
        return { block: null, position: null }
    }
};

const getElements = (markdown) => {
    const lines = markdown.split('\n');
    let currentBlock = null;
    let currentPosition = 'middle';
    const elements = [];
    let buffer = [];

    lines.forEach(line => {
        const context = determineBlockContext(line, currentBlock, currentPosition);
        currentBlock = context.block;
        currentPosition = context.position;

        if (currentBlock && (currentPosition === 'start' || currentPosition === 'middle')) {
            buffer.push(line);
        } else if (currentBlock && currentPosition === 'end') {
            buffer.push(line);
            elements.push(OObject({ line: buffer, block: currentBlock }));
            buffer = [];
        } else if (currentBlock && currentPosition === 'floating') {
            buffer.push(line);
        } else {
            if (buffer.length > 0) {
                elements.push(OObject({ line: buffer, block: determineBlockContext(buffer[0]).block }));
                buffer = [];
            }
            elements.push(OObject({ line, block: currentBlock }));
        }
    });

    // If items still in buffer and no end of block
    if (buffer.length > 0) {
        buffer.forEach(bufferedLine => {
            elements.push(OObject({ line: bufferedLine, block: null, position: null }));
        });
    }

    return elements;
};

const Markdown = ({ markdown }) => {
    if (typeof markdown === 'string') {
        markdown = Observer.mutable(markdown);
    }

    const elements = OArray(getElements(markdown.get()));

    markdown.watch(delta => {
        const newElements = getElements(delta.value);

        // Remove removed lines from elements
        if (newElements.length < elements.length) {
            elements.splice(newElements.length, elements.length - newElements.length);
        }

        // Update updated lines in elements
        newElements.forEach((newEl, i) => {
            if (i < elements.length) {
                if (elements[i].line !== newEl.line) {
                    elements[i] = newEl;
                }
            // If new line create new line in elements
            } else {
                elements.push(newEl);
            }
        });
    });

    return <Element each={elements} />;
};

export default Markdown;
