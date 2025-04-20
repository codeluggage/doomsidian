import { Extension, StateEffect } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { Range, StateField, Text } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

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

// Org-mode style bullets for different header levels
const HEADER_BULLETS = ['•', '○', '✱', '✸', '◇', '▶'];

class BulletWidget extends WidgetType {
	constructor(private bullet: string, private level: number) {
		super();
	}

	toDOM() {
		const span = document.createElement('span');
		span.textContent = this.bullet;
		span.className = `header-bullet header-bullet-${this.level}`;
		return span;
	}

	eq(other: BulletWidget) {
		return other.bullet === this.bullet && other.level === this.level;
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

			private findHeaderLevel(doc: Text, lineNo: number): number {
				// Look backwards to find the nearest header level
				for (let i = lineNo; i >= 1; i--) {
					const lineText = doc.line(i).text;
					const headerMatch = lineText.match(/^(#+)\s/);
					if (headerMatch) {
						const level = headerMatch[1].length;
						if (settings.ignoreH1Headers && level === 1) {
							return 0;
						}
						// Check if we hit a higher level header
						if (i < lineNo) {
							const currentLevel = headerMatch[1].length;
							for (let j = i + 1; j < lineNo; j++) {
								const intermediateText = doc.line(j).text;
								const intermediateMatch = intermediateText.match(/^(#+)\s/);
								if (intermediateMatch && intermediateMatch[1].length <= currentLevel) {
									return 0; // Found a header at same or higher level, stop here
								}
							}
						}
						return level;
					}
				}
				return 0;
			}

			computeDecorations(view: EditorView): DecorationSet {
				const decorations: Range<Decoration>[] = [];
				const doc = view.state.doc;

				// First pass: collect all decorations
				for (let i = 1; i <= doc.lines; i++) {
					const line = doc.line(i);
					const text = line.text;
					const headerLevel = this.findHeaderLevel(doc, i);

					// Handle headers
					const headerMatch = text.match(/^(#+)\s/);
					if (headerMatch) {
						const hashtagCount = headerMatch[1].length;
						if (settings.ignoreH1Headers && hashtagCount === 1) {
							continue;
						}

						const hashtagsStart = line.from;
						const hashtagsEnd = hashtagsStart + hashtagCount;

						// Add indentation for the header line itself
						const headerIndent = (hashtagCount - 1) * settings.indentationWidth;
						if (headerIndent > 0) {
							decorations.push(Decoration.line({
								attributes: {
									style: `padding-left: ${headerIndent}ch`
								}
							}).range(line.from));
						}

						// Hide all hashtags
						decorations.push(Decoration.mark({
							class: 'header-hashtag-hidden'
						}).range(hashtagsStart, hashtagsEnd));

						// Add bullet point at the start
						const bulletIndex = Math.min(hashtagCount - 1, HEADER_BULLETS.length - 1);
						decorations.push(Decoration.widget({
							widget: new BulletWidget(HEADER_BULLETS[bulletIndex], hashtagCount),
							side: -1
						}).range(hashtagsStart));

					} else if (headerLevel > 0) {
						// Calculate base indentation from header level
						const headerIndent = headerLevel * settings.indentationWidth;

						// Check if this is a blockquote
						const isQuote = text.match(/^\s*>/);
						if (isQuote) {
							// For quotes, we need to preserve the quote marker position
							// but indent the content
							decorations.push(Decoration.line({
								attributes: {
									style: `padding-left: ${headerIndent}ch`
								},
								class: 'quote-line'
							}).range(line.from));
						} else {
							// For regular content and lists, use padding-left
							// Lists will handle their own additional indentation
							decorations.push(Decoration.line({
								attributes: {
									style: `padding-left: ${headerIndent}ch`
								}
							}).range(line.from));
						}
					}
				}

				return Decoration.set(decorations, true);
			}
		})
	];
} 
