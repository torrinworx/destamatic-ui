import { h, Observer } from 'destam-dom';

/**
 * Router component that dynamically renders components based on the current route.
 *
 * @param {Object} routes - An object where keys represent route names and values represent corresponding components.
 * @param {Function} [NotFound] - Optional. A component to render when the route is not found.
 * @returns {HTMLElement} The component that matches the current route, or a 404 message if no match is found.
 */
export const Router = ({ currentRoute, routes, NotFound, ...props }) => {
    if (!(currentRoute instanceof Observer)) currentRoute = Observer.immutable('/');

    return currentRoute.map(route => {
        // Default to the root route if no path is provided
        if (!route) route = '/';

        const Component = routes[route];
        return Component
            ? <Component {...props} />
            : (NotFound ? <NotFound {...props} /> : <div>404 - Not Found</div>);
    });
};
