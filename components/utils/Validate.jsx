import { Observer } from 'destam-dom';
import Shown from './Shown';
import Typography from '../display/Typography';
import ThemeContext from '../utils/ThemeContext';

// simple validation component
// value, same value as your input component, validate is the validation function, valid is updated with the error string incase you just need that
// signal is a validation signal that is triggered if you want to run validation only when say you submit a form or something
export default ThemeContext.use(h => {
    const Validate = ({ value, validate, valid, signal, children }, cleanup) => {
        if (!(valid instanceof Observer)) valid = Observer.mutable(valid ?? true);
        const label = Observer.mutable('');

        const runValidation = async (val) => {
            const result = await validate(val);
            if (result) {
                valid.set(false);
                label.set(result);
            } else {
                valid.set(true);
                label.set('');
            }
        };

        cleanup(value.watch(() => {
            if (!signal) runValidation(value.get());
            if (label.get()) {
                valid.set(true);
                label.set('');
            }
        }));

        if (signal && signal instanceof Observer) {
            cleanup(signal.watch(trigger => {
                if (trigger) runValidation(value.get());
                signal.set(false);
            }));
        }

        // TODO: Somehow pass children? allow for custom component that takes in valid/label?
        // also make this the default child?: idk
        return <Shown value={valid} invert>
            <Typography type="p1" label={label} />
        </Shown>;
    };

    return Validate;
});
