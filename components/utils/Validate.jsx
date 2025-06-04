import { Observer } from 'destam-dom';
import Shown from './Shown';
import Typography from '../display/Typography';
import ThemeContext from '../utils/ThemeContext';

export default ThemeContext.use(h => {
    const Validate = ({ value = true, validate, valid, signal, error = '' }, cleanup) => {
        if (!(valid instanceof Observer)) valid = Observer.mutable(valid);
        if (!(error instanceof Observer)) error = Observer.mutable(error);

        const runValidation = async (val) => {
            const result = await validate(val);
            if (result) {
                valid.set(false);
                error.set(result);
            } else {
                valid.set(true);
                error.set('');
            }
        };

        if (!signal || !(signal instanceof Observer)) {
            cleanup(value.watch(() => {
                runValidation(value.get());
            }));
        } else {
            cleanup(signal.watch(trigger => {
                if (trigger) {
                    runValidation(value.get());
                    signal.set(false);
                }
            }));
        }

        // TODO: Somehow pass children? allow for custom component that takes in valid/label?
        // also make this the default child?: idk
        return <Shown value={valid} invert>
            <Typography type="p1" label={error} />
        </Shown>;
    };

    return Validate;
});
