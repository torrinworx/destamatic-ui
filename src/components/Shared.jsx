import h from './h';
import { OObject } from 'destam-dom';

import Theme from './Theme';

/**
 * Global context observer for shared state across components.
 * @type {Object}
 */
const Shared = OObject({
    Theme: Theme,
});

export default Shared
