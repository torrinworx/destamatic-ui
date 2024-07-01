import h from './h';
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

/*
Ideally we should have some kind of system like this that automatically injects
Shared variable into all child components so that whenever a user imports a 
destamatic-ui component, all child componentns have Shared.

Something like this:
window.addEventListener('load', () => {
	remove = mount(document.body, <SharedProvider Shared={Shared}>
            <Router routes={routes} />
        </SharedProvider>
    );
});

But I haven't figured out a way to do that recursively so that all child
components have access to Shared from the mount() function.

Currently when we import it into a new project and import Shared the
declaration get's re-instantiated when we import it into all components in
destamatic-ui.
*/

export default Shared
