import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { headerIndentation, HeaderIndentationSettings } from '../header-indentation';

describe('Header Indentation Plugin', () => {
    let view: EditorView;
    const defaultSettings: HeaderIndentationSettings = {
        ignoreH1Headers: true
    };

    const createView = (settings: Partial<HeaderIndentationSettings> = {}) => {
        return new EditorView({
            state: EditorState.create({
                doc: '',
                extensions: [
                    markdown(),
                    headerIndentation({ ...defaultSettings, ...settings })
                ]
            })
        });
    };

    beforeEach(() => {
        view = createView();
    });

    afterEach(() => {
        view.destroy();
    });

    describe('H1 Header Handling', () => {
        it('should not indent content under H1 by default', () => {
            const doc = '# Document Title\nContent under title\n## Section\nContent under section';
            view.setState(EditorState.create({
                doc,
                extensions: view.state.extensions
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
            view = createView({ ignoreH1Headers: false });

            const doc = '# Document Title\nContent under title';
            view.setState(EditorState.create({
                doc,
                extensions: view.state.extensions
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
                extensions: view.state.extensions
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
                extensions: view.state.extensions
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
                extensions: view.state.extensions
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
                extensions: view.state.extensions
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
                extensions: view.state.extensions
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
                extensions: view.state.extensions
            }));

            const line = view.domAtPos(0).node as HTMLElement;
            expect(line.querySelector('.cm-header-marker')).toBeNull();
        });

        it('should handle empty headers', () => {
            const doc = '##\nContent';
            view.setState(EditorState.create({
                doc,
                extensions: view.state.extensions
            }));

            const contentLine = view.domAtPos(4).node as HTMLElement;
            expect(contentLine).toHaveStyle({ paddingLeft: '3ch' });
        });

        it('should preserve list indentation under headers', () => {
            const doc = '## Header\n- List item\n  - Nested item';
            view.setState(EditorState.create({
                doc,
                extensions: view.state.extensions
            }));

            const listItem = view.domAtPos(11).node as HTMLElement;
            const nestedItem = view.domAtPos(26).node as HTMLElement;

            // Base indentation (3ch) + list indentation
            expect(listItem).toHaveStyle({ paddingLeft: '3ch' });
            expect(nestedItem).toHaveStyle({ paddingLeft: '5ch' });
        });
    });
}); 
