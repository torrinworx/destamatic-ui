import { h } from 'destam-dom';

const TextField = ({}) => {
    return<label class="mdc-text-field mdc-text-field--filled">
        <span class="mdc-text-field__ripple"></span>
        <span class="mdc-floating-label" id="my-label-id">Hint text</span>
        <input class="mdc-text-field__input" type="text" aria-labelledby="my-label-id" />
        <span class="mdc-line-ripple"></span>
    </label>
};

export default TextField;
