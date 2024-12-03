import { h, Observer } from 'destam-dom';

/**
 * Router component that dynamically renders components based on the current route.
 *
 * @param {Object} routes - An object where keys represent route names and values represent corresponding components.
 * @param {Function} [NotFound] - Optional. A component to render when the route is not found.
 * @param {string} notFoundRoute - Route to use when a route is not found.
 * @returns {HTMLElement} The component that matches the current route, or a 404 message if no match is found.
 */
const Router = ({ currentRoute, routes, NotFound, notFoundRoute = '/not-found', ...props }) => {
    if (!(currentRoute instanceof Observer)) currentRoute = Observer.mutable('/');

    const checkAndSetRoute = (route) => {
        if (routes[route]) {
            currentRoute.set(route);
        } else {
            currentRoute.set(notFoundRoute);
        }
    };

    checkAndSetRoute(window.location.pathname);

    currentRoute.watch((delta) => {
        const route = delta.value;
        if (route !== window.location.pathname) {
            history.pushState(null, '', route);
        }
    });

    window.addEventListener('popstate', () => {
        checkAndSetRoute(window.location.pathname);
    });

    return currentRoute.def('/').map(route => {
        const Component = routes[route];
        return Component
            ? <Component {...props} />
            : (NotFound ? <NotFound {...props} /> : <div>404 - Not Found</div>);
    });
};

export default Router;
