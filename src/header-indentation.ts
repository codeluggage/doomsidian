import { Extension, RangeSetBuilder } from '@codemirror/state';
import { ViewPlugin, DecorationSet, Decoration, EditorView, ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

export interface HeaderIndentationSettings {
    ignoreH1Headers: boolean;
}

const defaultSettings: HeaderIndentationSettings = {
    ignoreH1Headers: true
};

export function headerIndentation(settings: Partial<HeaderIndentationSettings> = {}): Extension {
    const config = { ...defaultSettings, ...settings };

    return ViewPlugin.fromClass(class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        private buildDecorations(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();

            // We'll iterate through the syntax tree to find headers
            const cursor = syntaxTree(view.state).cursor();
            while (cursor.next()) {
                if (cursor.type.name.startsWith('HeaderMark')) {
                    const line = view.state.doc.lineAt(cursor.from);
                    const headerLevel = this.getHeaderLevel(line.text);

                    if (headerLevel === 1 && config.ignoreH1Headers) {
                        continue;
                    }

                    // Add decoration for header marker concealment
                    builder.add(cursor.from, cursor.to, Decoration.mark({
                        class: 'cm-header-marker',
                        attributes: { style: `visibility: hidden; width: ${headerLevel}ch;` }
                    }));

                    // Add decoration for content indentation
                    // We'll need to find all content under this header until the next header
                    // of the same or higher level
                    this.addContentIndentation(view, builder, line.number, headerLevel);
                }
            }

            return builder.finish();
        }

        private getHeaderLevel(text: string): number {
            const match = text.match(/^(#{1,6})\s/);
            return match ? match[1].length : 0;
        }

        private addContentIndentation(
            view: EditorView,
            builder: RangeSetBuilder<Decoration>,
            startLine: number,
            headerLevel: number
        ) {
            const doc = view.state.doc;
            let currentLine = startLine + 1;

            while (currentLine <= doc.lines) {
                const line = doc.line(currentLine);
                const text = line.text;

                // Check if we've hit another header of same or higher level
                const nextHeaderLevel = this.getHeaderLevel(text);
                if (nextHeaderLevel > 0 && nextHeaderLevel <= headerLevel) {
                    break;
                }

                // Add indentation to this line
                // The indentation should be headerLevel + 1 to account for the space after #
                builder.add(
                    line.from,
                    line.from,
                    Decoration.line({
                        attributes: { style: `padding-left: ${headerLevel + 1}ch;` }
                    })
                );

                currentLine++;
            }
        }
    }, {
        decorations: v => v.decorations
    });
} 
