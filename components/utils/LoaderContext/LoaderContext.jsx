import createContext from '../Context/Context.jsx';
import LoadingDots from '../LoadingDots/LoadingDots.jsx';

/**
 * LoaderContext
 *
 * Holds the component used as the loading indicator across the app (Button's
 * loading state, FileDrop's per-file spinner, the suspend/Stasis fallback).
 * The default is LoadingDots, so behaviour is unchanged unless a provider
 * overrides it: wrap a subtree in `<LoaderContext value={MyLoader}>` to make
 * every loader in that subtree render `MyLoader` instead.
 *
 * A loader is just a component. It receives `{ type, size }`:
 *   - `type` carries the host component's variant (e.g. a Button's `contained`)
 *     so the loader can flip to the contrast colour when it sits inside a
 *     filled surface (this preserves the LoadingDots `_contained` behaviour).
 *   - `size` is an optional pixel size hint.
 *
 * The transform keeps the nearest non-null override and otherwise inherits the
 * parent (or the LoadingDots default), so nesting providers behaves sensibly.
 */
const LoaderContext = createContext(LoadingDots, (raw, parent) => raw ?? parent);

export default LoaderContext;
