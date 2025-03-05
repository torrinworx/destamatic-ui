import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import Button from '../inputs/Button';
import { Icon } from '../display/Icon';
import Observer from 'destam/Observer';

Theme.define({
	menuItem: {
		$icon_rename: 'edit-2',
		$icon_delete: 'trash',
		$icon_remove: 'x',
		$icon_ask: 'message-circle',
		$icon_chat: 'message-circle',
		$icon_add: 'plus',
		$icon_new: 'plus',
		$icon_copy: 'copy',
		$icon_duplicate: 'copy',
		$icon_cut: 'scissors',
		$icon_share: 'share',
		$icon_download: 'download',
		$icon_export: 'download',
		$icon_info: 'info',
		$icon_inspect: 'layers',
		$icon_select: 'activity',
		$icon_show: 'eye',
		$icon_hide: 'eye-off',
		$icon_team: 'users',
		$icon_target: 'target',
	},

	button_menuItem: {
		extends: 'typography_p1_bold_inline',

		borderRadius: 0,
		width: '100%',
		padding: '20px 10px',
		justifyContent: 'left',
	},

	button_menuItem_hovered: {
		background: '$alpha($color_top, .1)',
	},
});

export default ThemeContext.use(h => Theme.use(themer => {
	const MenuItem = ({ icon, theme, children, label, ...props }) => {
		if (children.length) throw new Error("MenuItem does not take children");

		if (!icon) {
			// find the first suitable word for the keyword.
			icon = Observer.immutable(label).map(label => {
				label = label.split(' ').find(word => {
					word = word.toLowerCase();
					return !['manage', 'generate', ''].includes(word);
				}).toLowerCase();

				return themer(theme, 'menuItem').vars('icon_' + label).map(iconName => {
					if (!iconName) {
						return null;
					}

					return <Icon

						name={iconName}
						style={{ paddingRight: 20, boxSizing: 'content-box' }}
						size={20}
					/>;
				});
			}).unwrap();
		}

		return <Button
			icon={icon}
			type='menuItem'
			label={label}
			{...props}
		/>;
	};

	return MenuItem;
}));
