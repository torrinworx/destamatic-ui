import { mount, Observer } from 'destam-dom';
import { TextField, Validate, Button, Icons, ValidateContext } from 'destamatic-ui';
import FeatherIcons from 'destamatic-ui/components/icons/FeatherIcons';

const phoneObserver = Observer.mutable('');
const emailObserver = Observer.mutable('');
const panObserver = Observer.mutable('');
const expDateObserver = Observer.mutable('');
const postalObserver = Observer.mutable('');

const submit = Observer.mutable(false);
const valid = Observer.mutable(true);
const name = Observer.mutable('');
const age = Observer.mutable('');

mount(document.body, <Icons value={[FeatherIcons]} >
    <div style={{ padding: '16px', maxWidth: '480px', margin: '0 auto' }}>
        <h2>Phone Validation</h2>
        <TextField placeholder="Phone" value={phoneObserver} />
        <Validate
            value={phoneObserver}
            validate="phone"
        />

        <hr />

        <h2>Email Validation</h2>
        <TextField placeholder="Email" value={emailObserver} />
        <Validate
            value={emailObserver}
            validate="email"
        />

        <hr />

        <h2>Primary Account Number (PAN)</h2>
        <TextField placeholder="Credit Card (16 digits)" value={panObserver} />
        <Validate
            value={panObserver}
            validate="pan"
        />

        <hr />

        <h2>Expiration Date (MM/YY)</h2>
        <TextField placeholder="MM/YY" value={expDateObserver} />
        <Validate
            value={expDateObserver}
            validate="expDate"
        />

        <hr />

        <h2>Postal Code (US ZIP or ZIP+4)</h2>
        <TextField placeholder="Postal Code" value={postalObserver} />
        <Validate
            value={postalObserver}
            validate="postalCode"
        />

        <hr />
        <h2>Multiple input validation with validation signal</h2>
        <p>In forms you have multiple inputs, and when you submit you would like to check if they are all valid or not</p>
        <ValidateContext value={valid}>
            <TextField placeholder="Name" value={name} />
            <Validate
                value={name}
                validate={value => {
                    if (/\d/.test(value.get())) return 'Name must be a valid string.';
                    return null
                }}
                signal={submit}
            />
            <TextField placeholder="Age" value={age} />
            <Validate
                value={age}
                validate={value => {
                    if (isNaN(value.get())) return 'Age must be a number.';
                    return null;
                }}
                signal={submit}
            />
            <Button type='contained' label='submit' onClick={() => {
                submit.set(true)

                if (valid.get()) {
                    console.log('Form submitted!');
                } else {
                    console.log('Please resolve issues with form before submitting.');
                }
            }} />
        </ValidateContext>
    </div>
</Icons>);
