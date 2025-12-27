import { mount, DropDown, Typography, Icon, Icons, OObject, Theme } from 'destamatic-ui';
import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

const globalTheme = OObject({
    primary: OObject({
        $color: '#02CA9F',
        $color_hover: '$shiftBrightness($color, 0.1)',
        $color_error: 'red',
        $color_top: 'black',
    }),
});

const ExampleWrapper = ({ example }) => {
    const { header, example: ExampleComp } = example;

    return <DropDown
        open={example.open}
        label={<Typography type="p1" label={header} />}
        iconOpen={<Icon name="feather:chevron-up" />}
        iconClose={<Icon name="feather:chevron-down" />}
    >
        <ExampleComp globalTheme={globalTheme} />
    </DropDown>;
};

const Examples = () => {
    const example_array = Object.values(
        import.meta.glob(
            '../components/**/**/*.example.jsx',
            { eager: true }
        )
    ).map(e => e.default);

    return <Theme value={globalTheme}>
        <Icons value={[IconifyIcons]}>
            <div theme='primary' style={{
                background: '$color_background',
                height: '100%',
                minHeight: '100vh'
            }}>
                <ExampleWrapper each:example={example_array} />
            </div>
        </Icons>
    </Theme>;
};

mount(document.body, <Examples />);
