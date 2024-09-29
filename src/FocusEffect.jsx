import {h} from './h';
import Observer from 'destam/Observer';

const FocusEffect = ({enabled, style, error, children, ...props}) => {
	enabled = Observer.immutable(enabled);
	error = Observer.immutable(error);

	return <div style={{
		boxShadow: enabled.map(e => e ? 'rgba(58, 133, 149, 0.25) 0 0 0 0.2rem' : null),
		border: error.map(error => {
			if (error) return 'red';

			return enabled.map(e => e ? '#388595' : '#ced4da');
		}).unwrap().map(col => '.5px solid ' + col),
		borderRadius: 4,
		transitionDuration: '0.3s',
		transitionProperty: 'border-color, background-color, box-shadow',
		...style
	}} {...props}>
		{children}
	</div>;
};

export default FocusEffect;
