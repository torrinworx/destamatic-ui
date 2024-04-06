import { html, Observer } from 'destam-dom';

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

    const createRipple = (event) => {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();

        const rippleX = event.clientX - rect.left - radius;
        const rippleY = event.clientY - rect.top - radius;

        const rippleStyle = `position: absolute; border-radius: 50%; width: ${diameter}px; height: ${diameter}px; top: ${rippleY}px; left: ${rippleX}px; background: rgba(0, 0, 0, 0.3); transform: scale(0); transition: transform 0.8s, opacity 0.8s;`;

        circle.style.cssText = rippleStyle;

        button.appendChild(circle);

        // Force re-layout to trigger the animation
        circle.getBoundingClientRect();

        circle.style.transform = 'scale(4)';
        circle.style.opacity = '0';

        setTimeout(() => {
            button.removeChild(circle);
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
    </button>`;
};

export default Button;