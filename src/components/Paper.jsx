import { h } from './h.jsx';

const Paper = ({children, style}) => {
	return <div style={{
		borderRadius: '5px',
		background: 'white',
		margin: '10px',
		...style
	}}>
		{children}
	</div>;
};

export default Paper;