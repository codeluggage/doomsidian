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
				let currentHeaderLevel = 0;
				let lastNonEmptyLine = '';
				let emptyLineCount = 0;

				for (let i = 1; i <= doc.lines; i++) {
					const line = doc.line(i);
					const text = line.text;
					const headerMatch = text.match(/^(#+)\s/);
					const isListItem = text.match(/^[\s]*([-*+]|\d+\.)\s/);
					const isEmpty = !text.trim();

					if (headerMatch) {
						const hashtagCount = headerMatch[1].length;
						currentHeaderLevel = (this.currentSettings.ignoreH1Headers && hashtagCount === 1) ? 0 : hashtagCount;

						if (currentHeaderLevel > 0) {
							const hashtagsStart = line.from;
							const hashtagsEnd = hashtagsStart + hashtagCount;

							// Add indentation for the header line itself
							const headerIndent = (hashtagCount - 1) * this.currentSettings.indentationWidth;
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
						}
						emptyLineCount = 0;
					} else if (isEmpty) {
						// Only reset header level if we've seen multiple empty lines and no lists
						emptyLineCount++;
						if (emptyLineCount > 1 && !lastNonEmptyLine.match(/^[\s]*([-*+]|\d+\.)\s/)) {
							currentHeaderLevel = 0;
						}
					} else {
						emptyLineCount = 0;
						lastNonEmptyLine = text;

						if (currentHeaderLevel > 0) {
							// Add indentation for non-empty lines under headers
							const indentWidth = currentHeaderLevel * this.currentSettings.indentationWidth;
							decorations.push(Decoration.line({
								attributes: { style: `padding-left: ${indentWidth}ch` }
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
