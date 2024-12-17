import createContext from './Context';
import { h } from './h';

const ThemeContext = createContext('primary');

const use = ThemeContext.use;
ThemeContext.use = (component) =>
		use(context => ({theme = context, ...props}, cleanup, mounted) => {
	const themedH = (name, props = {}, ...children) => {
		if (props.theme) props.theme = [theme, props.theme];
		return h(name, props, ...children);
	};

	props.theme = theme;
	return component(themedH)(props, cleanup, mounted);
});

export default ThemeContext;
