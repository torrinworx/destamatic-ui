import { OObject } from 'destam-dom';
import Theme from './Theme';
import { currentRoute } from './Router';

/**
 * Global context observer for shared state across components.
 * @type {Object}
 */
const Shared = OObject({
    Theme: Theme,
    currentRoute: currentRoute,
});

export default Shared;
