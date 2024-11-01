import { h } from './h';
import { OArray, OObject, Observer } from 'destam-dom';

import Link from './Link';
import Theme from './Theme';
import Checkbox from './Checkbox';
import CodeBlock from './CodeBlock';
import Typography from './Typography';

const emphasis = (line) => {
    const tokens = [];
    const regex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s"([^"]+)")?\))|(\*\*\*|___)(.+?)(\*\*\*|___)|(\*\*|__)(.+?)(\*\*|__)|(\*|_)(.+?)(\*|_)/g;
    let lastIndex = 0;

    // Match and process the line
    line.replace(regex, (match, link, linkText, linkUrl, linkTitle, boldItalicStart, boldItalicText, boldItalicEnd, boldStart, boldText, boldEnd, italicStart, italicText, italicEnd, offset) => {
        // Push the preceding plain text if any
        if (lastIndex < offset) {
            tokens.push(line.slice(lastIndex, offset));
        }

        // Process and push the match
        if (link) {
            tokens.push(
                <Link 
                    href={linkUrl} 
                    title={linkTitle || undefined} 
                >
                    {linkText}
                </Link>
            );
        } else if (boldItalicStart) {
            tokens.push(
                <em key={offset}>
                    <strong>{boldItalicText}</strong>
                </em>
            );
        } else if (boldStart) {
            tokens.push(
                <strong key={offset}>
                    {boldText}
                </strong>
            );
        } else if (italicStart) {
            tokens.push(
                <em key={offset}>
                    {italicText}
                </em>
            );
        }

        // Update the last index position
        lastIndex = offset + match.length;
    });

    // Push any remaining plain text
    if (lastIndex < line.length) {
        tokens.push(line.slice(lastIndex));
    }

    return tokens;
};

const renderList = (lines) => {
    let nestLevel = 0;
    const nodes = lines.map(line => {
        const currentLevel = line.search(/\S/) / 2;  // Assuming two spaces per indentation level

        // Check if the line starts with a number followed by a dot and space, typical of Markdown ordered lists
        if (/^\s*\d+\.\s/.test(line)) {
            // Remove the numbering from the line
            line = line.replace(/^\s*\d+\.\s/, '');
        }

        let listItem = <li>{emphasis(line.trim())}</li>;

        // Logic to nest further if the detected indentation is deeper
        if (currentLevel > nestLevel) {
            listItem = <ul>{listItem}</ul>;  // Start a new nested list
            nestLevel = currentLevel;  // Update the nesting level
        } else if (currentLevel < nestLevel) {
            nestLevel = currentLevel;  // Adjust nesting level if indentation decreases
        }
        
        return listItem;
    });

    return nodes;
};

const Element = ({ each: e }) => {
    let line = e.line;
    const block = e.block;
    const position = e.position;

    if (position === 'end') return null;

    if (block === 'code' && Array.isArray(line)) {
        const first_line = line.shift();
        const language = first_line.slice(3);
        line.pop();
        return <CodeBlock language={language} code={line.join('\n')}/>;
    };

    if (block === 'quote' && Array.isArray(line)) {
        return <blockquote theme='blockquote'>
            {line.map(l => {
                l = emphasis(l.startsWith('> ') ? l.slice(2) : l);
                return l;
            })}
        </blockquote>;
    };

    if (block === 'ul' && Array.isArray(line)) {
        return <ul>{renderList(line)}</ul>;
    };

    if (block === 'ol' && Array.isArray(line)) {
        return <ol>{renderList(line)}</ol>;
    };

    if (line.startsWith('# ')) {
        return <Typography type='h1'>{emphasis(line.slice(2))}</Typography>;
    } else if (line.startsWith('## ')) {
        return <Typography type='h2'>{emphasis(line.slice(3))}</Typography>;
    } else if (line.startsWith('### ')) {
        return <Typography type='h3'>{emphasis(line.slice(4))}</Typography>;
    } else if (line.startsWith('#### ')) {
        return <Typography type='h4'>{emphasis(line.slice(5))}</Typography>;
    } else if (line.startsWith('##### ')) {
        return <Typography type='h5'>{emphasis(line.slice(6))}</Typography>;
    } else if (line.startsWith('###### ')) {
        return <Typography type='h6'>{emphasis(line.slice(7))}</Typography>;
    } else if (line.startsWith('- ')) {
        if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
            const checked = line.startsWith('- [x] ');
            return <Checkbox items={[{label: emphasis(line.slice(6)), value: checked}]} />;
        };
    } else if (/^\d+\. /.test(line)) {
        return <Typography type='p1'>{emphasis(line.slice(line.indexOf(' ') + 1))}</Typography>;
    };

    return <Typography type='p1'>{emphasis(line)}</Typography>;
};

const blockContext = (line, prevBlock, prevPosition) => {
    // Code Blocks:
    if (line.startsWith('```') && prevBlock !== 'code') {
        return { block: 'code', position: 'start' };
    } else if (line.startsWith('```') && prevBlock === 'code' && prevPosition === 'middle') {
        return { block: 'code', position: 'end' };
    } else if (prevBlock === 'code' && prevPosition !== 'end') {
        return { block: prevBlock, position: 'middle' };

    // Block Quotes:
    } else if (line.startsWith('> ')) {
        return { block: 'quote', position: 'floating' };

    // Ordered Lists with indentation handling:
    } else if (/^\s*\d+\.\s/.test(line)) {
        return { block: 'ol', position: 'middle' };
    } else if (prevBlock === 'ol' && !/^\s*\d+\.\s/.test(line)) {
        return { block: null, position: 'end' };

    // Unordered Lists with indentation handling:
    } else if (/^\s*-\s/.test(line)) {
        return { block: 'ul', position: 'middle' };
    } else if (prevBlock === 'ul' && !/^\s*-\s/.test(line)) {
        return { block: null, position: 'end' };

    // Non block lines:
    } else {
        return { block: null, position: null };
    }
};

const elementsFromStr = (markdown) => {
    const lines = markdown.split('\n')
    let currentBlock = null;
    let currentPosition = 'middle';
    const elements = OArray([]);
    let buffer = [];

    lines.forEach(line => {
        const context = blockContext(line, currentBlock, currentPosition);
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
                elements.push(OObject({ line: buffer, block: blockContext(buffer[0]).block }));
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

const elementsFromOArray = (markdown) => {
};

const getElements = (markdown) => {
    if (markdown instanceof Observer) {
        return elementsFromStr(markdown.get());
    } else if (markdown instanceof OArray) {
        return elementsFromOArray(markdown);
    };
};

const Markdown = ({ markdown }) => {
    if (!(markdown instanceof Observer) && typeof markdown === 'string') {
        markdown = Observer.mutable(markdown);
    }

    const elements = OArray(getElements(markdown));

    markdown.watch(delta => {
        const newElements = elementsFromStr(delta.value);

        // Remove removed lines from elements
        if (newElements.length < elements.length) {
            elements.splice(newElements.length, elements.length - newElements.length);
        };

        // Update updated lines in elements
        newElements.forEach((newEl, i) => {
            if (i < elements.length) {
                if (elements[i].line !== newEl.line) {
                    elements[i] = newEl;
                }
            // If new line create new line in elements
            } else {
                elements.push(newEl);
            };
        });
    });

    return <Element each={elements} />;
};

export default Markdown;
