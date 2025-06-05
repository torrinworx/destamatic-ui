import { mount, Observer } from 'destam-dom';
import { TextField, Validate, Button, Icons, Icon } from 'destamatic-ui';
import FeatherIcons from 'destamatic-ui/components/icons/FeatherIcons';

// Create Observers for each field and a "valid" tracker
const phoneObserver = Observer.mutable('');
const phoneValid = Observer.mutable(true);

const emailObserver = Observer.mutable('');
const emailValid = Observer.mutable(true);

const panObserver = Observer.mutable('');
const panValid = Observer.mutable(true);

const expDateObserver = Observer.mutable('');
const expDateValid = Observer.mutable(true);

const postalObserver = Observer.mutable('');
const postalValid = Observer.mutable(true);

const submit = Observer.mutable(false);

mount(document.body, <Icons value={[FeatherIcons]} >
    <div style={{ padding: '16px', maxWidth: '480px', margin: '0 auto' }}>
        <h2>Phone Validation</h2>
        <TextField placeholder="Phone" value={phoneObserver} />
        <Validate
            value={phoneObserver}
            validate="phone"
            valid={phoneValid}
        />

        <hr />

        <h2>Email Validation</h2>
        <TextField placeholder="Email" value={emailObserver} />
        <Validate
            value={emailObserver}
            validate="email"
            valid={emailValid}
        />

        <hr />

        <h2>Primary Account Number (PAN)</h2>
        <TextField placeholder="Credit Card (16 digits)" value={panObserver} />
        <Validate
            value={panObserver}
            validate="pan"
            valid={panValid}
        />

        <hr />

        <h2>Expiration Date (MM/YY)</h2>
        <TextField placeholder="MM/YY" value={expDateObserver} />
        <Validate
            value={expDateObserver}
            validate="expDate"
            valid={expDateValid}
        />

        <hr />

        <h2>Postal Code (US ZIP or ZIP+4)</h2>
        <TextField placeholder="Postal Code" value={postalObserver} />
        {/* This validator only runs when the submit variable is set to true, 
        such as on button click. */}
        <Validate
            value={postalObserver}
            validate="postalCode"
            valid={postalValid}
            signal={submit}
        />
        <Button
            type='contained'
            label="Validate Postal Code"
            onClick={() => submit.set(true)}
            style={{ marginTop: '8px' }}
        />
    </div>
</Icons>);
