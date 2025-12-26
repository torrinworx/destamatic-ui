import { mount, DropDown, Typography, Icon, Icons } from 'destamatic-ui';

import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

const ExampleWrapper = ({ example }) => {
    const { header, example: ExampleComp } = example;

    return <DropDown
        open={example.open}
        label={<Typography type="p1" label={header} />}
        iconOpen={<Icon name="feather:chevron-up" />}
        iconClose={<Icon name="feather:chevron-down" />}
    >
        <ExampleComp />
    </DropDown>;
};

const Examples = () => {
    const example_array = Object.values(
        import.meta.glob(
            '../../destamatic-ui/components/**/**/*.example.jsx',
            { eager: true }
        )
    ).map(e => e.default);

    return <Icons value={[IconifyIcons]}>
        <ExampleWrapper each:example={example_array} />
    </Icons>;
};

mount(document.body, <Examples />);
