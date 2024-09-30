import { h } from './h.jsx';

const Paper = ({children, style}) => {
	return <div style={{
		borderRadius: '5px',
		background: '#EEE',
	    boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
	    insetBoxShadow: 'inset -2px -2px 10px rgba(0,0,0,0.2)',
		padding: '10px',
		...style
	}}>
		{children}
	</div>;
};

export default Paper;
