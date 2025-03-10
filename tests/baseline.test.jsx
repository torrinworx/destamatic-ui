import { describe, it, expect } from 'vitest';

// Experimental, not sure if this works:
const h = (name, props = {}, ...children) => {
    const out = { name };

    if (Object.keys(props).length) {
        out.props = props;
    }

    if (children.length) {
        out.children = children;
    }

    return out;
};

describe('JSX Parsing Tests', () => {
	it('parses an empty fragment', () => {
		expect(<></>).toEqual([]);
	});

	it('parses a string', () => {
		expect(<>hello world</>).toEqual(["hello world"]);
	});

	it('parses a runtime string', () => {
		expect(<>hello {"middle"} world</>).toEqual(["hello ", "middle", " world"]);
	});

	it('parses a div element', () => {
		expect(<div />).toEqual({ name: 'div' });
	});

	it('parses a div in member expression', () => {
		let a = {
			b: {
				c: 'div',
			}
		}

		expect(<a.b.c />).toEqual({ name: 'div' });
	});

	it('parses a div with attributes', () => {
		expect(
			<div bool hello="world" />
		).toEqual({ name: 'div', props: { bool: true, hello: "world" } });
	});

	it('parses a div with an empty body', () => {
		expect(
			<div></div>
		).toEqual({ name: 'div'});
	});

	it('parses a nested div', () => {
		expect(
			<div><div /></div>
		).toEqual({ name: 'div', children: [{ name: 'div' }] });
	});

	it('handles newline whitespace between divs', () => {
		expect(
			<>
				<div />
				<div />
				<div />
			</>
		).toEqual([{ name: 'div' }, { name: 'div' }, { name: 'div' }]);
	});

	it('handles same line whitespace between divs', () => {
		expect(
			<><div /> <div /> <div /></>
		).toEqual([{ name: 'div' }, " ", { name: 'div' }, " ", { name: 'div' }]);
	});

	it('handles same line whitespace', () => {
		expect(
			<>  a  b  </>
		).toEqual([" a b "]);
	});

	it('handles newline whitespace', () => {
		expect(
			<>
				a
				b
			</>
		).toEqual(["a b"]);
	});

	it('handles mixed divs and text with whitespace', () => {
		expect(
			<>
				<div />
				a
				<div />
			</>
		).toEqual([{ name: 'div' }, "a", { name: 'div' }]);
	});

	it('handles mixed divs and text on the same line', () => {
		expect(
			<>
				<div /> a <div />
			</>
		).toEqual([{ name: 'div' }, " a ", { name: 'div' }]);
	});

	it('handles JSX spreading', () => {
		expect(
			<div {...{ one: '1', two: '2' }} />
		).toEqual({ name: 'div', props: { one: '1', two: '2' } });
	});

	it('handles JSX expression', () => {
		const val = {};
		expect(
			<div val={val} />
		).toEqual({ name: 'div', props: { val } });
	});

	it('handles nested fragments', () => {
		expect(
			<div>
				<>
					<div />
				</>
			</div>
		).toEqual({ name: 'div', children: [{ name: 'div' }] });
	});

	it('handles multiple nested fragments', () => {
		expect(
			<div>
				<>
					<div />
					<div />
				</>
			</div>
		).toEqual({ name: 'div', children: [{ name: 'div' }, { name: 'div' }] });
	});

	it('handles empty expressions for comments', () => {
		expect(<>
			{/* this is a comment */}
		</>).toEqual([]);
	});

	it('handles children spread', () => {
		expect(<>
			{...[1, 2]}
		</>).toEqual([1, 2]);
	});

	it('parses a custom element', () => {
		const Element = () => { };

		expect(<Element />).toEqual({ name: Element });
	});

	it('handles JSX namespaces', () => {
		const thing = (name) => name;

		expect(<thing:div />).toEqual("div");
	});

	it('handles prop namespaces', () => {
		const thing = (_, props) => props;

		expect(<thing:div hello:world />).toEqual({ 'hello:world': true });
	});

	it('handles spread children', () => {
		expect(<div>{...["a", "b"]}</div>).toEqual({
			name: 'div',
			children: ["a", "b"]
		});
	});
});
