import { Extension, StateEffect } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { Range, StateField } from '@codemirror/state';

// Define the effect type for updating decorations
const updateDecorations = StateEffect.define<DecorationSet>();

export const headerIndentationField = StateField.define<DecorationSet>({
	create() { return Decoration.none },
	update(decorations, tr) {
		// Apply any decoration updates from effects
		for (let e of tr.effects) {
			if (e.is(updateDecorations)) {
				return e.value;
			}
		}
		return decorations.map(tr.changes);
	},
	provide: f => EditorView.decorations.from(f)
});

export interface HeaderIndentationSettings {
	ignoreH1Headers: boolean;
	indentationWidth: number;
}

// Unicode bullet symbols for different header levels
const HEADER_BULLETS = ['◉', '○', '✱', '✸', '◇', '▶'];

export function headerIndentation(settings: HeaderIndentationSettings): Extension {
	return [
		headerIndentationField,
		ViewPlugin.fromClass(class {
			private updateScheduled = false;

			constructor(view: EditorView) {
				this.scheduleUpdate(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.scheduleUpdate(update.view);
				}
			}

			private scheduleUpdate(view: EditorView) {
				if (this.updateScheduled) return;
				this.updateScheduled = true;

				Promise.resolve().then(() => {
					this.updateScheduled = false;
					if (!view.state) return; // View was destroyed

					view.dispatch({
						effects: updateDecorations.of(this.computeDecorations(view))
					});
				});
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

						const hashtagCount = headerMatch[1].length;
						const bulletIndex = Math.min(hashtagCount - 1, HEADER_BULLETS.length - 1);
						const bullet = HEADER_BULLETS[bulletIndex];

						// Add the bullet point widget at the start of the line
						decorations.push(
							Decoration.widget({
								widget: new class extends WidgetType {
									toDOM() {
										const span = document.createElement('span');
										span.textContent = bullet + ' ';
										span.style.position = 'absolute';
										span.style.left = '0';
										span.style.marginLeft = `${(hashtagCount - 1) * settings.indentationWidth}ch`;
										return span;
									}
								},
								side: -1
							}).range(line.from)
						);

						// Add a wrapper for the entire header line
						decorations.push(
							Decoration.line({
								attributes: {
									style: `padding-left: ${hashtagCount * settings.indentationWidth + 1}ch`
								}
							}).range(line.from)
						);

					} else if (text.trim() && currentHeaderLevel > 0) {
						// Add indentation for non-empty lines under headers
						decorations.push(
							Decoration.line({
								attributes: {
									style: `padding-left: ${currentHeaderLevel * settings.indentationWidth + 1}ch`
								}
							}).range(line.from)
						);
					}
				}

				return Decoration.set(decorations);
			}
		})
	];
} 
