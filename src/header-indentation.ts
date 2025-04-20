import { Extension, StateEffect } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { Range, StateField, Text } from '@codemirror/state';

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
		// Make non-editable to avoid cursor issues
		span.contentEditable = 'false';
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
			decorations: DecorationSet = Decoration.none;
			currentSettings: HeaderIndentationSettings;
			private updateScheduled = false;
			private lastDocLength = 0;
			private lastViewportFrom = 0;
			private lastViewportTo = 0;

			constructor(view: EditorView) {
				this.currentSettings = settings;
				this.scheduleUpdate(view);
			}

			update(update: ViewUpdate) {
				const docChanged = update.docChanged;
				const viewportChanged =
					update.view.viewport.from !== this.lastViewportFrom ||
					update.view.viewport.to !== this.lastViewportTo;
				const docLengthChanged = update.state.doc.length !== this.lastDocLength;

				if (docChanged || viewportChanged || docLengthChanged) {
					this.lastDocLength = update.state.doc.length;
					this.lastViewportFrom = update.view.viewport.from;
					this.lastViewportTo = update.view.viewport.to;
					this.scheduleUpdate(update.view);
				}
			}

			private scheduleUpdate(view: EditorView) {
				if (this.updateScheduled) return;
				this.updateScheduled = true;

				Promise.resolve().then(() => {
					this.updateScheduled = false;
					if (!view.state) return;

					const newDecorations = this.computeDecorations(view);
					view.dispatch({
						effects: updateDecorations.of(newDecorations)
					});
				});
			}

			computeDecorations(view: EditorView): DecorationSet {
				const decorations: Range<Decoration>[] = [];
				const doc = view.state.doc;
				let activeHeaderLevel = 0;
				let lastHeaderLevel = 0;
				let emptyLineCount = 0;
				let inListBlock = false;

				for (let i = 1; i <= doc.lines; i++) {
					const line = doc.line(i);
					const text = line.text;
					const headerMatch = text.match(/^(#+)\s/);
					const isListItem = text.match(/^[\s]*([-*+]|\d+\.)\s/);
					const isEmpty = !text.trim();

					if (headerMatch) {
						const hashtagCount = headerMatch[1].length;
						activeHeaderLevel = (this.currentSettings.ignoreH1Headers && hashtagCount === 1) ? 0 : hashtagCount;
						lastHeaderLevel = activeHeaderLevel;
						emptyLineCount = 0;
						inListBlock = false;

						if (activeHeaderLevel > 0) {
							const hashtagsStart = line.from;
							const hashtagsEnd = hashtagsStart + hashtagCount;

							// Add indentation for the header line itself
							const headerIndent = (hashtagCount - 1) * this.currentSettings.indentationWidth;
							if (headerIndent > 0) {
								decorations.push(Decoration.line({
									attributes: {
										style: `padding-left: ${headerIndent}ch !important`
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
						}
					} else if (isEmpty) {
						emptyLineCount++;
						// Only reset header level if we're not in a list block and have multiple empty lines
						if (emptyLineCount > 1 && !inListBlock) {
							activeHeaderLevel = 0;
						}
					} else {
						emptyLineCount = 0;

						if (isListItem) {
							inListBlock = true;
							// Restore header level if we're in a list
							if (activeHeaderLevel === 0) {
								activeHeaderLevel = lastHeaderLevel;
							}
						}

						if (activeHeaderLevel > 0 && !isListItem) {
							// Only apply padding to non-list items
							const indent = activeHeaderLevel * this.currentSettings.indentationWidth;
							decorations.push(Decoration.line({
								attributes: {
									style: `padding-left: ${indent}ch !important`
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

// Effect for potential dynamic setting updates (if needed later)
export const updateSettingsEffect = StateEffect.define<HeaderIndentationSettings>(); 
