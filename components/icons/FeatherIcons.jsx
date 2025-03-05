import feather from 'feather-icons';

const FeatherIcons = (name) => {
	if (feather.icons[name]) {
		return feather.icons[name].toSvg();
	}
	return null;
};

export default FeatherIcons;
