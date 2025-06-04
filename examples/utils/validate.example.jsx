import { mount, Observer } from 'destam-dom';
import { Validate, Button, TextField } from 'destamatic-ui';

const nameF = Observer.mutable('');
const validF = Observer.mutable(true)

const nameL = Observer.mutable('');
const validL = Observer.mutable(true)
const submit = Observer.mutable(false);

mount(document.body, <div>
    <div>
        <TextField
            placeholder='First'
            value={nameF}
        />
        <Validate
            value={nameF}
            valid={validF}
            validate={value => {
                if (value.length > 40) return 'Names are limited to 40 characters.';
                if (value.length <= 10) return 'Names must be longer than 10 characters.';
                else return null
            }}
        />
    </div>

    <div>
        <TextField
            placeholder='Last'
            value={nameL}
        />
        <Validate
            value={nameL}
            valid={validL}
            validate={value => {
                if (value) {
                    if (value.length > 40) return 'Names are limited to 40 characters.';
                    if (value.length <= 10) return 'Names must be longer than 10 characters.';
                }
                else return null
            }}
            signal={submit}
        />

        <Button
            type='contained'
            label='Publish'
            onClick={() => submit.set(true)}
        />
    </div>
</div>);
