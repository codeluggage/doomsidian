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

// Unicode bullet symbols for different header levels - selected for consistent width
const HEADER_BULLETS = ['•', '•', '•', '•', '•', '•'];  // Using the same bullet for consistency

class BulletWidget extends WidgetType {
	constructor(private bullet: string) {
		super();
	}

	toDOM() {
		const span = document.createElement('span');
		span.textContent = this.bullet;
		span.className = 'header-bullet';
		return span;
	}

	eq(other: BulletWidget) {
		return other.bullet === this.bullet;
	}

	get estimatedHeight() { return 1; }
}

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

				// First pass: collect all decorations
				for (let i = 1; i <= doc.lines; i++) {
					const line = doc.line(i);
					const text = line.text;

					// Check if line is a header
					const headerMatch = text.match(/^(#+)\s/);
					if (headerMatch) {
						const hashtagCount = headerMatch[1].length;

						// Skip H1 headers if configured
						if (settings.ignoreH1Headers && hashtagCount === 1) {
							currentHeaderLevel = 0;
							continue;
						}

						currentHeaderLevel = hashtagCount;
						const hashtagsStart = line.from;
						const hashtagsEnd = hashtagsStart + hashtagCount;

						if (hashtagCount > 1) {
							// Make all but the last hashtag invisible by matching background color
							decorations.push(Decoration.mark({
								class: 'header-hashtag-hidden'
							}).range(hashtagsStart, hashtagsEnd - 1));

							// Replace the last hashtag with a bullet
							const bulletIndex = Math.min(hashtagCount - 1, HEADER_BULLETS.length - 1);
							decorations.push(Decoration.replace({
								widget: new BulletWidget(HEADER_BULLETS[bulletIndex])
							}).range(hashtagsEnd - 1, hashtagsEnd));
						}

					} else if (text.trim() && currentHeaderLevel > 0) {
						// Add indentation for non-empty lines under headers
						const indentWidth = currentHeaderLevel * settings.indentationWidth;
						decorations.push(Decoration.line({
							attributes: {
								style: `padding-left: ${indentWidth}ch`
							}
						}).range(line.from));
					}
				}

				// Sort decorations by from position and startSide
				decorations.sort((a, b) => {
					const fromDiff = a.from - b.from;
					if (fromDiff) return fromDiff;
					return (a.value.startSide || 0) - (b.value.startSide || 0);
				});

				return Decoration.set(decorations);
			}
		})
	];
} 
