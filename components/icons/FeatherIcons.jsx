import feather from 'feather-icons';

export default function FeatherIcons(name) {
  return () => {
    if (feather.icons[name]) {
      return feather.icons[name].toSvg();
    }
    return null;
  };
}
