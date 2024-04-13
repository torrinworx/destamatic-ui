import { h } from 'destam-dom';
import useRipples from '../util/ripple.js';

const Button = ({ label = "Button", type = "text", onClick, Icon }) => {
    let Class = "";

    switch (type) {
        case "text":
            break;
        case "outlined":
            Class = "mdc-button--outlined";
            break;
        case "contained":
            Class = "mdc-button--raised";
            break;
    }

    const [ripples, createRipple] = useRipples();

    return <button
        class={`mdc-button ${Class} ${Icon && "mdc-button--icon-leading"}`}
        $onclick={(event) => {
            createRipple(event);
            onClick && onClick(event);
        }}
        style="position: relative; overflow: hidden;"
    >
        {Icon ? <i class="material-icons mdc-button__icon" aria-hidden="true">{Icon}</i> : null}
        {!["icon", "icon-outlined", "icon-contained"].includes(type) ? <span class="mdc-button__label">{label}</span> : null}
        {ripples}
    </button>;
};

export default Button;
