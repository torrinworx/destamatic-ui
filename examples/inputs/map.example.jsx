import { mount } from 'destam-dom';
import { Icons } from 'destamatic-ui';
import Map from 'destamatic-ui/components/inputs/Map';
import FeatherIcons from 'destamatic-ui/components/icons/FeatherIcons'

mount(document.body, <>
    <Icons value={[FeatherIcons]} >
        <Map />
    </Icons>
</>);
