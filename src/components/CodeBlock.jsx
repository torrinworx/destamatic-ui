import h from './h';
import { Observer } from 'destam-dom';
import Icon from './Icon';
import Button from './Button';
import Typography from './Typography';
import Theme from './Theme';

const importLanguage = {
    javascript: () => import('prismjs/components/prism-javascript'),
    python: () => import('prismjs/components/prism-python'),
    markdown: () => import('prismjs/components/prism-markdown'),
    html: () => import('prismjs/components/prism-markup'),
    sql: () => import('prismjs/components/prism-sql'),
    css: () => import('prismjs/components/prism-css'),
    ruby: () => import('prismjs/components/prism-ruby'),
    java: () => import('prismjs/components/prism-java'),
    csharp: () => import('prismjs/components/prism-csharp'),
    bash: () => import('prismjs/components/prism-bash'),
    go: () => import('prismjs/components/prism-go'),
    json: () => import('prismjs/components/prism-json'),
    xml: () => import('prismjs/components/prism-xml-doc'),
    yaml: () => import('prismjs/components/prism-yaml'),
    jsx: () => import('prismjs/components/prism-jsx'),
    // Add more languages as needed
};

const loadPrismLanguage = async (language, mode, code) => {
    let prism;
    try {
        prism = await import('prismjs');
    } catch (e) {
        return code;
    };

    const importLanguageModule = importLanguage[language];
    if (importLanguageModule) {
        await importLanguageModule();
    } else {
        language = 'markdown';
        await importLanguage[language]();
    };

    if (mode === 'dark') {
        await import('prismjs/themes/prism-okaidia.min.css');
    } else if (mode === 'light') {
        await import('prismjs/themes/prism-solarizedlight.css');
    };
    console.log(language)
    code.set(prism.highlight(code.get(), prism.languages[language], language));
};

/**
 * CodeBlock component that renders syntax-highlighted code.
 * 
 * @param {Object} props - The properties object.
 * @param {string} [props.language='markdown'] - The programming language for syntax highlighting.
 * @param {Observer<string>} [props.code] - The code to be highlighted and rendered.
 * @param {string} [props.mode='dark'] - The theme mode ('dark' or 'light').
 * @param {Object} [props.style] - Custom styles to apply to the code block.
 * @param {...Object} props - Additional properties to spread onto the pre element.
 * 
 * @returns {JSX.Element} The rendered code block component.
 */

const CodeBlock = Theme.use(theme => ({ language = 'markdown', code, mode = 'dark', style, ...props }) => {
    if (!(code instanceof Observer)) {
        code = Observer.mutable(code);
    };

    loadPrismLanguage(language, mode, code)

    return <div>
        <div $style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '5px 15px 5px 15px',
            backgroundColor: mode === 'dark' ? '#333' : '#f5f5f5',
            borderTopLeftRadius: theme.borderRadius,
            borderTopRightRadius: theme.borderRadius
        }}>
            <Typography type='p1' $style={{ color: mode === 'dark' ? 'white' : 'black' }}>
                {language.toLowerCase()}
            </Typography>
            <Button
                label={
                    <Icon
                        libraryName="feather"
                        iconName="clipboard"
                        size="16"
                        $style={{
                            color: mode === 'dark' ? 'white' : 'black'
                        }}
                    />
                }
                onClick={async () => await navigator.clipboard.writeText(code)}
            />
        </div>
        <pre
            $style={{
                overflow: 'auto',
                backgroundColor: mode === 'dark' ? 'black' : 'white',
                borderBottomLeftRadius: theme.borderRadius,
                borderBottomRightRadius: theme.borderRadius,
                borderTopLeftRadius: '0',
                borderTopRightRadius: '0',
                padding: '10px',
                margin: 0,
                fontSize: '14px',
                ...style,
            }}
            {...props}
        >
            <code
                $innerHTML={code}
                class={`language-${language}`}
            />
        </pre>
    </div>;
});

export default CodeBlock;
