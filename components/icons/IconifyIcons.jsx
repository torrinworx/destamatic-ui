import { icons as lineicons } from '@iconify-json/lineicons';
import { icons as feather } from '@iconify-json/feather';
import { icons as simpleIcons } from '@iconify-json/simple-icons';
import { icons as tabler } from '@iconify-json/tabler';

const libraries = {
    lineicons,
    feather,
    tabler,
    simpleIcons,
};

const IconifyDriver = (name) => {
    const [pack, iconName] = name.split(':');
    const lib = libraries[pack];
    if (!lib) return null;

    console.log(lib, iconName, lib.icons[iconName]);
    const icon = lib.icons[iconName];
    if (!icon) return null;


    const viewBox = `0 0 ${icon.width || 24} ${icon.height || 24}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${icon.body}</svg>`;
};

export default IconifyDriver;
