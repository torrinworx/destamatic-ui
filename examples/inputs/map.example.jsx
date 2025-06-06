import { mount } from 'destam-dom';
import { Icons } from 'destamatic-ui';
import Map from 'destamatic-ui/components/inputs/Map';
import FeatherIcons from 'destamatic-ui/components/icons/FeatherIcons'

document.getElementsByTagName("body")[0].style.margin = 0;
mount(document.body, <div>
    <Icons value={[FeatherIcons]} >
        <Map />
    </Icons>
</div>);
