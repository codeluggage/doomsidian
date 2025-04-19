import { Extension } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

export interface HeaderIndentationSettings {
	ignoreH1Headers: boolean;
	indentationWidth: number;
}

export function headerIndentation(settings: HeaderIndentationSettings): Extension {
	return ViewPlugin.fromClass(class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = this.computeDecorations(view);
		}

		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = this.computeDecorations(update.view);
			}
		}

		computeDecorations(view: EditorView): DecorationSet {
			const decorations: any[] = [];
			const doc = view.state.doc;
			let currentHeaderLevel = 0;

			for (let i = 1; i <= doc.lines; i++) {
				const line = doc.line(i);
				const text = line.text;

				// Check if line is a header
				const headerMatch = text.match(/^(#+)\s/);
				if (headerMatch) {
					currentHeaderLevel = headerMatch[1].length;
					if (settings.ignoreH1Headers && currentHeaderLevel === 1) {
						currentHeaderLevel = 0;
					}
				} else if (text.trim() && currentHeaderLevel > 0) {
					// Add indentation for non-empty lines under headers
					const indent = ' '.repeat(currentHeaderLevel * settings.indentationWidth);
					decorations.push(
						Decoration.line({
							attributes: {
								style: `text-indent: ${indent.length}ch; white-space: pre;`
							}
						}).range(line.from)
					);
				}
			}

			return Decoration.set(decorations);
		}
	}, {
		decorations: v => v.decorations
	});
} 
