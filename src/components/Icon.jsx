import h from './h';

import Observer from 'destam/Observer';

// Async function to load icons
const loadIcon = async (libraryName, iconName, style) => {
    switch (libraryName) {
        case 'feather':
            try {
                const feather = await import('feather-icons');
                if (feather.icons[iconName]) {
                    return feather.icons[iconName].toSvg({ ...style });
                }
                throw new Error(`Icon ${iconName} not found in ${libraryName}.`);
            } catch (error) {
                // Handling failure of dynamic import or icon not found
                console.error(error.message);
                throw new Error(`Failed to load ${libraryName} or icon ${iconName} not found.`);
            }
        // Cases for other icon libraries here
        default:
            throw new Error(`The library ${libraryName} is not supported.`);
    }
}

const Icon = ({ libraryName, iconName, size='20', style, ...props }) => {
    let Svg = Observer.mutable('');
    const styleObject = {marginTop: '4px', height: size, width: size, ...style}

    loadIcon(libraryName, iconName, styleObject)
        .then(svgContent => {
            Svg.set(svgContent);
        })
        .catch(error => {
            console.error(error.message);
        });

    return <div style={{display: 'inline-block', ...style}} {...props} $innerHTML={Svg} />;
};

export default Icon;
