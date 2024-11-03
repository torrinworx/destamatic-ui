import {h} from './h';
import Observer from 'destam/Observer';
import Theme from './Theme';

Theme.define({
	focus: {
		extends: ['primary', 'radius'],
		transitionDuration: '0.3s',
		transitionProperty: 'border-color, background-color, box-shadow',
		borderStyle: 'solid',
		borderWidth: .5,
		borderColor: '#388595',
		padding: 10,
		marginTop: 10,
		marginBottom: 10,
		alignItems: 'center',
		background: 'white',
	},

	focus_focused: {
		boxShadow: '$color 0 0 0 0.2rem',
		borderColor: '#ced4da',
	},

	focus_error: {
		borderColor: '$color_error',
	},
});

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
