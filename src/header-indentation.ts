import { Extension } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { Range } from '@codemirror/state';

export interface HeaderIndentationSettings {
	ignoreH1Headers: boolean;
	indentationWidth: number;
}

// Unicode bullet symbols for different header levels
const HEADER_BULLETS = ['◉', '○', '✱', '✸', '◇', '▶'];

// Zero-width space character for replacing hashtags
const INVISIBLE_CHAR = '\u200B';

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
			const decorations: Range<Decoration>[] = [];
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
						continue;
					}

					// Calculate positions for decorations
					const hashtagCount = headerMatch[1].length;
					const bulletIndex = Math.min(hashtagCount - 1, HEADER_BULLETS.length - 1);
					const bullet = HEADER_BULLETS[bulletIndex];
					const startPos = line.from;
					const endPos = line.from + hashtagCount + 1; // +1 for the space after hashtags

					// Add bullet widget first (lower from position)
					decorations.push(
						Decoration.widget({
							widget: new class extends WidgetType {
								toDOM() {
									const span = document.createElement('span');
									span.textContent = bullet + ' ';
									span.style.marginLeft = `${(hashtagCount - 1) * settings.indentationWidth}ch`;
									return span;
								}
							},
							side: -1 // Place before any other decoration
						}).range(startPos)
					);

					// Then add replacement (higher from position)
					decorations.push(
						Decoration.replace({
							inclusive: true,
						}).range(startPos, endPos)
					);

				} else if (text.trim() && currentHeaderLevel > 0) {
					// Add indentation for non-empty lines under headers
					const indent = ' '.repeat(currentHeaderLevel * settings.indentationWidth);
					decorations.push(
						Decoration.line({
							attributes: {
								style: `text-indent: ${indent.length}ch`
							}
						}).range(line.from)
					);
				}
			}

			// Sort decorations by from position and startSide
			return Decoration.set(decorations.sort((a, b) => {
				const fromDiff = a.from - b.from;
				if (fromDiff) return fromDiff;
				// If from positions are equal, widget decorations should come first
				return (a.value.startSide || 0) - (b.value.startSide || 0);
			}));
		}
	}, {
		decorations: v => v.decorations
	});
} 
