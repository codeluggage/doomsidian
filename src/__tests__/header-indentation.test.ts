import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { headerIndentation, HeaderIndentationSettings } from '../header-indentation';

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

	test('content under headers has virtual indentation', () => {
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

		// Check that the content lines have the decoration class
		const contentLine1 = view.domAtPos(content.indexOf('Content under header 1')).node as HTMLElement;
		const contentLine2 = view.domAtPos(content.indexOf('Content under header 2')).node as HTMLElement;

		// The parent element should have our decoration
		const line1Parent = contentLine1.closest('.cm-line');
		const line2Parent = contentLine2.closest('.cm-line');

		expect(line1Parent).toHaveStyle({ textIndent: '0ch' });
		expect(line2Parent).toHaveStyle({ textIndent: '4ch' });
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

		// Get the content line element
		const contentLine = view.domAtPos(content.indexOf('Content under header 1')).node as HTMLElement;
		const lineParent = contentLine.closest('.cm-line');

		// With ignoreH1Headers false, content under H1 should be indented
		expect(lineParent).toHaveStyle({ textIndent: '2ch' });
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

		// Get content line elements
		const content1 = view.domAtPos(content.indexOf('Content 1')).node as HTMLElement;
		const content2 = view.domAtPos(content.indexOf('Content 2')).node as HTMLElement;
		const content3 = view.domAtPos(content.indexOf('Content 3')).node as HTMLElement;

		// Get their parent line elements
		const line1 = content1.closest('.cm-line');
		const line2 = content2.closest('.cm-line');
		const line3 = content3.closest('.cm-line');

		// Check indentation levels
		expect(line1).toHaveStyle({ textIndent: '0ch' });  // Under H1 (ignored)
		expect(line2).toHaveStyle({ textIndent: '4ch' });  // Under H2
		expect(line3).toHaveStyle({ textIndent: '6ch' });  // Under H3
	});

	describe('H1 Header Handling', () => {
		it('should not indent content under H1 by default', () => {
			const doc = '# Document Title\nContent under title\n## Section\nContent under section';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const titleContent = view.domAtPos(15).node as HTMLElement;
			const sectionContent = view.domAtPos(45).node as HTMLElement;

			// Content under H1 should not be indented
			expect(titleContent).not.toHaveStyle({ paddingLeft: expect.any(String) });
			// Content under H2 should be indented
			expect(sectionContent).toHaveStyle({ paddingLeft: '3ch' });
		});

		it('should indent content under H1 when ignoreH1Headers is false', () => {
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

			const doc = '# Document Title\nContent under title';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const titleContent = view.domAtPos(15).node as HTMLElement;
			expect(titleContent).toHaveStyle({ paddingLeft: '2ch' });
		});
	});

	describe('Header Marker Concealment', () => {
		it('should conceal header markers but preserve spacing', () => {
			const doc = '## Header\nContent';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const line = view.domAtPos(0).node as HTMLElement;
			expect(line.querySelector('.cm-header-marker')).toHaveStyle({
				visibility: 'hidden',
				width: '2ch' // Width of two #
			});
		});

		it('should handle multiple header levels', () => {
			const doc = '#### Deep Header\nContent';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const line = view.domAtPos(0).node as HTMLElement;
			expect(line.querySelector('.cm-header-marker')).toHaveStyle({
				visibility: 'hidden',
				width: '4ch' // Width of four #
			});
		});
	});

	describe('Content Indentation', () => {
		it('should indent content under headers', () => {
			const doc = '## Header\nContent line';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const contentLine = view.domAtPos(10).node as HTMLElement;
			expect(contentLine).toHaveStyle({
				paddingLeft: '3ch' // Two # + one space
			});
		});

		it('should handle nested header levels', () => {
			const doc = '## Level 2\nContent 2\n### Level 3\nContent 3';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const content2 = view.domAtPos(12).node as HTMLElement;
			const content3 = view.domAtPos(32).node as HTMLElement;

			expect(content2).toHaveStyle({ paddingLeft: '3ch' });
			expect(content3).toHaveStyle({ paddingLeft: '4ch' });
		});

		it('should handle skipped header levels', () => {
			const doc = '## Level 2\nContent 2\n##### Level 5\nContent 5';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const content5 = view.domAtPos(32).node as HTMLElement;
			expect(content5).toHaveStyle({ paddingLeft: '6ch' });
		});
	});

	describe('Edge Cases', () => {
		it('should not treat #text without space as header', () => {
			const doc = '##not-a-header\nContent';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const line = view.domAtPos(0).node as HTMLElement;
			expect(line.querySelector('.cm-header-marker')).toBeNull();
		});

		it('should handle empty headers', () => {
			const doc = '##\nContent';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const contentLine = view.domAtPos(4).node as HTMLElement;
			expect(contentLine).toHaveStyle({ paddingLeft: '3ch' });
		});

		it('should preserve list indentation under headers', () => {
			const doc = '## Header\n- List item\n  - Nested item';
			view.setState(EditorState.create({
				doc,
				extensions: [markdown(), headerIndentation({ ...defaultSettings, ignoreH1Headers: false })]
			}));

			const listItem = view.domAtPos(11).node as HTMLElement;
			const nestedItem = view.domAtPos(26).node as HTMLElement;

			// Base indentation (3ch) + list indentation
			expect(listItem).toHaveStyle({ paddingLeft: '3ch' });
			expect(nestedItem).toHaveStyle({ paddingLeft: '5ch' });
		});
	});
}); 
