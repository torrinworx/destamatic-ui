import h from './h';
import { Observer } from 'destam-dom';

/**
 * Asynchronous function to load icons from various libraries.
 * - Currently supports Feather Icons.
 *
 * @param {string} libraryName - The name of the icon library.
 * @param {string} iconName - The name of the icon to load from the library.
 * @param {Object} style - The style object to apply to the SVG element.
 * @returns {Promise<string>} - A promise that resolves to the SVG string of the icon.
 */
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
        // Cases for other icon libraries can be added here
        default:
            throw new Error(`The library ${libraryName} is not supported.`);
    }
}

/**
 * Icon component that dynamically loads and renders an SVG icon from a specified library.
 * 
 * Uses an asynchronous function to fetch the SVG content of the icon.
 * 
 * @param {Object} props - The properties object.
 * @param {string} props.libraryName - The name of the icon library (e.g., 'feather').
 * @param {string} props.iconName - The name of the icon to load from the library.
 * @param {string} [props.size='20'] - The size of the icon.
 * @param {Object} [props.style] - Custom styles to apply to the icon's wrapper element.
 * @param {...Object} [props] - Additional properties to spread onto the icon's wrapper element.
 * 
 * @returns {JSX.Element} The rendered icon element.
 */
const Icon = ({ libraryName, iconName, size='20', style, ...props }) => {
    let Svg = Observer.mutable('');
    const styleObject = { marginTop: '4px', height: size, width: size, ...style };

    loadIcon(libraryName, iconName, styleObject)
        .then(svgContent => {
            Svg.set(svgContent);
        })
        .catch(error => {
            console.error(error.message);
        });

    return <div style={{ display: 'inline-block', ...style }} {...props} $innerHTML={Svg} />;
};

export default Icon;
