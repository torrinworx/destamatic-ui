import { h, mount } from 'destam-dom';
import '@material/button/dist/mdc.button.css';

import { MDCRipple } from '@material/ripple';


const Button = ({ label, type, onClick, Icon }) => {
    let Class = ""
    switch (type) {
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
        <div class="mdc-button__ripple" />
        <span class="mdc-button__label">{label}</span>
    </button>;
};


export default Button;
