import feather from 'feather-icons';

export default (name) => {
    if (feather.icons[name]) {
        return feather.icons[name].toSvg();
    } else return null;
};
