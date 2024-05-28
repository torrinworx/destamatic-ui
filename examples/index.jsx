import H from '../src';

import { mount } from 'destam-dom';

import { Icon, Button } from '../src';

const Example = () => {
    const handleClick = () => {
        console.log('Button clicked');
    };
    return <div>
        <Button label="Click Me" onClick={handleClick} />
        <Button label="Click Me" type="outlined" onClick={handleClick} />
        <Button
            label="Button"
            type="icon-outlined"
            onClick={handleClick}
            Icon={
                <Icon libraryName="feather" iconName="feather" />
            }
        />
        <Button
            label="Button"
            type="contained"
            onClick={handleClick}
            Icon={
                <Icon libraryName="feather" iconName="feather" />
            }
        />

    </div>;
};

mount(document.body, <Example />);
