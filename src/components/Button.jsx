import { html, OArray, Observer } from 'destam-dom';

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

    const ripples = OArray();

    const createRipple = (event) => {
        const button = event.currentTarget;
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();

        const rippleX = event.clientX - rect.left - radius;
        const rippleY = event.clientY - rect.top - radius;

        const opacity = Observer.mutable(1);
        const scale = Observer.mutable(0);

        const circle = document.createElement('span');
        ripples.push(html`<${circle}
            $style=${{
                position: 'absolute',
                borderRadius: '50%',
                width: diameter + 'px',
                height: diameter + 'px',
                top: rippleY + 'px',
                left: rippleX + 'px',
                background: 'rgba(0, 0, 0, 0.3)',
                transform: scale.map(scale => `scale(${scale})`),
                opacity: opacity,
                transition: 'transform 0.8s, opacity 0.8s',
            }}
        />`);

        // Force re-layout to trigger the animation
        circle.getBoundingClientRect();

        opacity.set(0);
        scale.set(4);

        setTimeout(() => {
            ripples.splice(0, 1);
        }, 500); // Clean up the ripple after the animation
    };

    return html`<button
        class=${`mdc-button ${Class} ${Icon && "mdc-button--icon-leading"}`}
        $onclick=${(event) => {
            createRipple(event);
            onClick && onClick(event);
        }}
        style="position: relative; overflow: hidden;"
    >
        ${Icon ? html`<i class="material-icons mdc-button__icon" aria-hidden="true">${Icon}</i>` : null}
        ${!["icon", "icon-outlined", "icon-contained"].includes(type) ? html`<span class="mdc-button__label">${label}</span>` : null}
        ${ripples}
    </button>`;
};

export default Button;
