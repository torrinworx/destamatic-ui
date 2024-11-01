import {h} from './h';
import Observer from 'destam/Observer';

const FocusEffect = ({enabled, error, children, ...props}) => {
	enabled = Observer.immutable(enabled);
	error = Observer.immutable(error);

	return <div theme={[
		'focus',
		enabled.map(e => e ? 'focused' : null),
		error.map(e => e ? 'error' : null),
	]} {...props}>
		{children}
	</div>;
};

export default FocusEffect;
