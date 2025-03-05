import feather from 'feather-icons';

const FeatherIcons = (name) => {
  return () => {
    if (feather.icons[name]) {
      return feather.icons[name].toSvg();
    }
    return null;
  };
};

export default FeatherIcons;
