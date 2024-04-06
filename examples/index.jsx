import { h, mount } from 'destam-dom';
import '@material/button/dist/mdc.button.css';
import { MDCRipple } from '@material/ripple';

import { Icon } from '../src';

const Button = ({ label, type, onClick, Icon }) => {
    let Class = ""

    switch(type) {
        case "text":
            break;
        case "outlined":
            Class = "mdc-button--outlined"
            break;
        case "contained":
            Class = "mdc-button--raised"
            break;
    }

    return <button class={`mdc-button ${Class} ${Icon ? 'mdc-button--icon-leading' : null}`} $onclick={onClick}>
        {Icon ? <i class="material-icons mdc-button__icon" aria-hidden="true">{Icon}</i> : null}
        <div class="mdc-button__ripple"/>
        <span class="mdc-button__label">{label}</span>
    </button>;
};

const Example = () => {
    const handleClick = () => {
        console.log('Button clicked');
    };
    return <div>
        <Button label="Click Me" onClick={handleClick} />
        <Button label="Click Me" type="outlined" onClick={handleClick} />
        <Button
            label="Button"
            type="outlined"
            onClick={handleClick}
            Icon={
                <Icon libraryName="feather" iconName="feather" />
            }
        />
        <Button
            label="Button"
            type="contained"
            onClick={handleClick}
            Icon={
                <Icon libraryName="feather" iconName="feather" />
            }
        />

    </div>;
};

mount(document.body, <Example />);

document.querySelectorAll('.mdc-button').forEach(button => {
    new MDCRipple(button);
});
