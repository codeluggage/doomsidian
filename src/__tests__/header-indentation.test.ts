import { EditorView, DecorationSet, ViewPlugin } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { headerIndentation, HeaderIndentationSettings, headerIndentationField } from '../header-indentation';

describe('Header Indentation Plugin', () => {
	let view: EditorView;
	const defaultSettings: HeaderIndentationSettings = {
		ignoreH1Headers: true,
		indentationWidth: 2
	};

	beforeEach(() => {
		view = new EditorView({
			state: EditorState.create({
				doc: '',
				extensions: [
					markdown(),
					headerIndentation(defaultSettings)
				]
			})
		});
		document.body.appendChild(view.dom);
	});

	afterEach(() => {
		view.dom.remove();
		view.destroy();
	});

	test('decorations are created for headers and content', () => {
		const content = `# Header 1
Content under header 1
## Header 2
Content under header 2`;

		view.dispatch({
			changes: { from: 0, insert: content }
		});

		// Get the actual content - should be unchanged
		const docContent = view.state.doc.toString();
		expect(docContent).toBe(content);

		// Get all decorations from the view
		const decorationRanges: Array<{ from: number; to: number }> = [];
		const plugin = view.state.field(headerIndentationField);
		plugin.between(0, view.state.doc.length, (from: number, to: number) => {
			decorationRanges.push({ from, to });
		});

		// We should have decorations
		expect(decorationRanges.length).toBeGreaterThan(0);

		// For each header: 1 widget + 1 replace decoration
		// For each content line: 1 line decoration
		const expectedDecorationCount = 4; // 2 headers (2 decs each) + 2 content lines
		expect(decorationRanges.length).toBe(expectedDecorationCount);
	});

	test('respects ignoreH1Headers setting', () => {
		view.destroy();
		view = new EditorView({
			state: EditorState.create({
				doc: '',
				extensions: [
					markdown(),
					headerIndentation({ ...defaultSettings, ignoreH1Headers: false })
				]
			})
		});
		document.body.appendChild(view.dom);

		const content = `# Header 1
Content under header 1`;

		view.dispatch({
			changes: { from: 0, insert: content }
		});

		const decorationRanges: Array<{ from: number; to: number }> = [];
		const plugin = view.state.field(headerIndentationField);
		plugin.between(0, view.state.doc.length, (from: number, to: number) => {
			decorationRanges.push({ from, to });
		});
		expect(decorationRanges.length).toBeGreaterThan(0);
	});

	test('handles nested header levels', () => {
		const content = `# H1
Content 1
## H2
Content 2
### H3
Content 3`;

		view.dispatch({
			changes: { from: 0, insert: content }
		});

		const decorationRanges: Array<{ from: number; to: number }> = [];
		const plugin = view.state.field(headerIndentationField);
		plugin.between(0, view.state.doc.length, (from: number, to: number) => {
			decorationRanges.push({ from, to });
		});
		expect(decorationRanges.length).toBeGreaterThan(0);

		// We should have decorations for H2 and H3 headers (2 each)
		// plus decorations for content lines under H2 and H3
		const expectedDecorationCount = 6;
		expect(decorationRanges.length).toBe(expectedDecorationCount);
	});

	describe('Edge Cases', () => {
		it('should not treat #text without space as header', () => {
			const doc = '##not-a-header\nContent';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const decorationRanges: Array<{ from: number; to: number }> = [];
			const plugin = view.state.field(headerIndentationField);
			plugin.between(0, view.state.doc.length, (from: number, to: number) => {
				decorationRanges.push({ from, to });
			});
			expect(decorationRanges.length).toBe(0); // No decorations should be created
		});

		it('should handle empty headers', () => {
			const doc = '##\nContent';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const decorationRanges: Array<{ from: number; to: number }> = [];
			const plugin = view.state.field(headerIndentationField);
			plugin.between(0, view.state.doc.length, (from: number, to: number) => {
				decorationRanges.push({ from, to });
			});
			expect(decorationRanges.length).toBeGreaterThan(0);
		});

		it('should preserve list indentation under headers', () => {
			const doc = '## Header\n- List item\n  - Nested item';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const decorationRanges: Array<{ from: number; to: number }> = [];
			const plugin = view.state.field(headerIndentationField);
			plugin.between(0, view.state.doc.length, (from: number, to: number) => {
				decorationRanges.push({ from, to });
			});
			expect(decorationRanges.length).toBeGreaterThan(0);
		});
	});

	it('should add bullet points and hide hashtags for headers', () => {
		const view = new EditorView({
			state: EditorState.create({
				doc: '# Header 1\n## Header 2\n### Header 3',
				extensions: [headerIndentation(defaultSettings)]
			})
		});

		// Get all decorations from the view
		const decorations = view.state.field(headerIndentationField);
		expect(decorations.size).toBe(6); // 2 decorations per header (bullet + replacement)

		view.destroy();
	});

	it('should ignore H1 headers when ignoreH1Headers is true', () => {
		const view = new EditorView({
			state: EditorState.create({
				doc: '# Header 1\n## Header 2\n### Header 3',
				extensions: [headerIndentation({ ...defaultSettings, ignoreH1Headers: true })]
			})
		});

		const decorations = view.state.field(headerIndentationField);
		expect(decorations.size).toBe(4); // 2 decorations each for H2 and H3

		view.destroy();
	});

	it('should indent content under headers', () => {
		const view = new EditorView({
			state: EditorState.create({
				doc: '# Header 1\nContent 1\n## Header 2\nContent 2\n### Header 3\nContent 3',
				extensions: [headerIndentation(defaultSettings)]
			})
		});

		const decorations = view.state.field(headerIndentationField);
		expect(decorations.size).toBe(9); // 6 for headers (2 each) + 3 for content indentation

		view.destroy();
	});

	it('should not indent empty lines under headers', () => {
		const view = new EditorView({
			state: EditorState.create({
				doc: '# Header 1\n\nContent 1\n## Header 2\n\nContent 2',
				extensions: [headerIndentation(defaultSettings)]
			})
		});

		const decorations = view.state.field(headerIndentationField);
		expect(decorations.size).toBe(6); // 4 for headers (2 each) + 2 for content indentation

		view.destroy();
	});

	it('should respect custom indentation width', () => {
		const view = new EditorView({
			state: EditorState.create({
				doc: '# Header 1\nContent 1\n## Header 2\nContent 2',
				extensions: [headerIndentation({ ...defaultSettings, indentationWidth: 4 })]
			})
		});

		const decorations = view.state.field(headerIndentationField);
		expect(decorations.size).toBe(6); // 4 for headers (2 each) + 2 for content indentation

		view.destroy();
	});

	it('should handle mixed content correctly', () => {
		const view = new EditorView({
			state: EditorState.create({
				doc: '# Header 1\nContent 1\n## Header 2\nContent 2\nRegular line\n### Header 3',
				extensions: [headerIndentation(defaultSettings)]
			})
		});

		const decorations = view.state.field(headerIndentationField);
		expect(decorations.size).toBe(8); // 6 for headers (2 each) + 2 for content indentation

		view.destroy();
	});

	it('should handle code blocks correctly', () => {
		const view = new EditorView({
			state: EditorState.create({
				doc: '## Header\n```typescript\nconst x = 1;\n```\nContent after code block',
				extensions: [headerIndentation(defaultSettings)]
			})
		});

		const decorations = view.state.field(headerIndentationField);
		// Should have decorations for header (2) + content line after code block (1)
		// Code block itself should not be indented
		expect(decorations.size).toBe(3);

		view.destroy();
	});
}); 
