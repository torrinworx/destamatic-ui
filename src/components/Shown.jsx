const Shown = ({children, value}) => {
	return value.map(val => val ? children : null);
};

export default Shown;
