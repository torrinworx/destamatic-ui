import { h } from '../utils/h.jsx';
import Theme from '../utils/Theme.jsx';
import { OArray, Observer } from 'destam-dom';
import { atomic } from 'destam/Network';

Theme.define({
	date: {
		$scrollSensitivity: 0.25,
		userSelect: 'none',
	},

	date_base: {
		display: 'flex',
		flexDirection: 'column',
		width: 300,
		height: 300,
		flex: 'flex-grow',
	},

	date_row: {
		width: '100%',
		display: 'flex',
		flexDirection: 'row',
		gap: 15,
	},

	date_elem: {
		extends: 'center',
		width: '100%',
		cursor: 'pointer',
		height: 30,
		borderRadius: '50%',
	},

	date_elem_disabled: {
		color: '$shiftBrightness($color_top, 0.6)',
	},

	date_elem_selected: {
		background: '$color',
		color: '$contrast_text($color)',
	},

	date_holder: {
		width: '100%',
	},

	date_body: {
		width: '100%',
		height: '100%',
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
	},

	date_header: {
		extends: 'radius_date_row',
		color: '$shiftBrightness($color_top, 0.3)',
	},

	date_sep: {
		extends: 'center',
		paddingTop: 10,
		cursor: 'default',
	},
});

const normalize = d => {
	d = new Date(d);
	d.setHours(0, 0, 0, 0);
	return d;
};

const dateStr = d => {
	return [d.getFullYear(), d.getMonth(), d.getDate()].join('-');
};

const getAdj = (date, diff) => {
	if (diff === 0) return date;

	date = new Date(date);
	date.setDate(date.getDate() + diff);
	return date;
};

const month = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const DateElem = ({value, theme = "primary", min, max, ...props}, cleanup, mounted) => {
	if (!(value instanceof Observer)) value = Observer.immutable(value);
	if (!(min instanceof Observer)) min = Observer.immutable(min);
	if (!(max instanceof Observer)) max = Observer.immutable(max);
	const bounds = Observer.all([min, max]);

	const scrolled = Observer.mutable(0);
	const selector = value.map(dateStr).selector('selected', null);


	const rows = OArray();
	const getRow = date => {
		// try to see if we already rendered this row
		let found = rows.findIndex(row => row.past <= date && date < row.future);
		if (found >= 0) {
			const row = rows[found];
			rows.splice(found, 1);
			return row;
		}

		let past, future;

		let Div = <raw:div />;
		let content = <Div theme={[theme, "date", "row"]}>
			{Array(7).fill(null).map((_, i) => {
				const adj = getAdj(date, i - date.getDay());
				if (adj.getMonth() === date.getMonth()) {
					if (!past) past = adj;
					future = adj;

					return <div
						theme={[
							theme,
							"date",
							"elem",
							bounds.map(([min, max]) =>
								(!min || min <= adj) && (!max || adj < max)
									? null : 'disabled'),
							selector(dateStr(adj)),
						]}
						onClick={() => value.set(adj)}
					>{adj.getDate()}</div>;
				}

				return <div theme={[
					theme,
					"date",
					"holder",
				]} />
			})}
		</Div>;

		if (past.getDate() === 1) {
			let year = past.getFullYear();
			if (year <= 0) {
				year = (-year + 1) + ' BC';
			}

			Div = <raw:div />;
			content = [
				<Div theme={[
					theme,
					"date",
					"sep",
				]}>{month[past.getMonth()] + ' ' + year}</Div>,
				content
			];
		}

		return {
			content,
			past: normalize(past),
			future: normalize(getAdj(future, 1)),
			prev: getAdj(past, -1),
			next: getAdj(future, 1),
			div: Div,
		};
	};

	const purge = (scroll, len) => {
		const height = Body.getBoundingClientRect().height;

		let first = rows[0];
		let firstAdded = false;
		while (first.div.offsetTop + scroll > 0) {
			let current;
			atomic(() => {
				current = getRow(first.prev);
				rows.splice(0, 0, current);
			});
			len++;
			scroll -= first.div.offsetTop;
			first = current;
			firstAdded = true;
		}

		let last = rows[len - 1];
		let lastAdded = false;
		while (last.div.offsetTop + scroll < height) {
			let current;
			atomic(() => {
				current = getRow(last.next);
				rows.splice(len, 0, current);
			});
			len++;
			last = current;
			lastAdded = true;
		}

		rows.splice(len, rows.length);

		if (!firstAdded) while (rows.length > 2 && rows[1].div.offsetTop + scroll < 0) {
			scroll += rows[1].div.offsetTop;
			rows.splice(0, 1);
		}

		if (!lastAdded) while (rows.length && rows[rows.length - 1].div.offsetTop + scroll > height) {
			rows.splice(rows.length - 1, 1);
		}

		return scroll;
	};

	const Body = <raw:div />;

	mounted(() => cleanup(value.effect(date => {
		let found = rows.find(row => row.past <= date && date < row.future);
		if (found) return;

		let scroll = Body.getBoundingClientRect().height / 2;

		atomic(() => {
			const content = getRow(date);
			rows.splice(0, 0, content);
		});

		scrolled.set(purge(scroll, 1));
	})));

	const Renderer = ({each: {content}}) => content;

	const BodyComp = Theme.use(themer => () => {
		const themed = themer(theme, "date", "body");

		return <Body
			class={themed}
			onWheel={e => {
				e.preventDefault();
				scrolled.set(purge(scrolled.get() - e.deltaY * themed.vars('scrollSensitivity').get(), rows.length));
			}}
		>
			<div style={{position: 'relative', top: scrolled}}>
				<Renderer each={rows} />
			</div>
		</Body>
	});

	return <div theme={[theme, "date", "base"]} {...props}>
		<div theme={[theme, "date", "header"]}>
			{Array(7).fill(null).map((_, i) => {
				return <div theme={[theme, "date", "elem"]}>{"SMTWTFS".charAt(i)}</div>;
			})}
		</div>
		<BodyComp />
	</div>;
};

export default DateElem;
