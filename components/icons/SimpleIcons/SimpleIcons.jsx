import * as simpleIcons from 'simple-icons';

const SimpleIconsDriver = (name) => {
    const iconVarName = `si${name.charAt(0).toUpperCase() + name.slice(1)}`;

    const icon = simpleIcons[iconVarName];
    return icon ? icon.svg : null;
};

export default SimpleIconsDriver;
