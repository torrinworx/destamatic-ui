import { Observer } from 'destam';
import { mount } from 'destam-dom';
import { Button, TextField, Typography, TextModifiers } from 'destamatic-ui';

const value = Observer.mutable('Hello World! --> :frog: :heart: :turtle: --> ????');

const emojis = {
    frog: '🐸',
    smile: '😄',
    heart: '❤️',
    fire: '🔥',
    turtle: '🐢',
};

mount(document.body, <>
    <Typography type='p1' label='The Typography component is a useful way to standardize fonts, sizes, colors, and styles accross multiple different components.' />
    <Typography type='h1' label='Header h1' />
    <Typography type='h2' label='Header h2' />
    <Typography type='h3' label='Header h3' />
    <Typography type='h4' label='Header h4' />
    <Typography type='h5' label='Header h5' />
    <Typography type='h6' label='Header h6' />
    <Typography type='p1' label='Paragraph p1' />
    <Typography type='p2' label='Paragraph p2' />
    <Typography type='p1' label="Typography has a built in modifier system that let's you reactively update text when a regex pattern is met or when a string is matched:" />
    <TextField theme='fill' value={value} />
    <TextModifiers value={[
        {
            check: '!',
            return: (match) => <span style={{ color: 'red' }}>{match}</span>,
        },
        {
            check: '?',
            return: (match) => {
                const hover = Observer.mutable(false);
                return <span
                    isHovered={hover}
                    style={{ cursor: 'pointer', color: hover.bool('purple', 'pink') }}
                    onClick={() => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", '_blank')}
                >{match}</span>
            },
        },
        {
            check: /hello/gi,
            return: (match) => <Button type='contained' onClick={() => alert(match)}>{match}</Button>,
        },
        {
            check: /:([a-zA-Z0-9_]+):/g,
            return: (match) => {
                const key = match.slice(1, -1);
                const emoji = emojis[key];
                return emoji ? <span>{emoji}</span> : match;
            }
        },
        {
            check: /-->/g,
            return: (match) => <span style={{ fontWeight: 'bold', color: 'green' }}>→</span>,
        }
    ]} >
        <Typography label={value} />
    </TextModifiers>
</>);
