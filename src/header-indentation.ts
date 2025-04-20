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
			decorations: DecorationSet;
			currentSettings: HeaderIndentationSettings;

			constructor(view: EditorView) {
				this.currentSettings = settings;
				this.decorations = this.computeDecorations(view);
			}

			update(update: ViewUpdate) {
				// Basic update check
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.computeDecorations(update.view);
				}
				// TODO: Add settings update check if dynamic reconfiguration is needed
			}

			computeDecorations(view: EditorView): DecorationSet {
				const decorations: Range<Decoration>[] = [];
				const doc = view.state.doc;
				let currentHeaderLevel = 0;

				for (let i = 1; i <= doc.lines; i++) {
					const line = doc.line(i);
					const text = line.text;
					const headerMatch = text.match(/^(#+)\s/);

					if (headerMatch) {
						const hashtagCount = headerMatch[1].length;
						currentHeaderLevel = (this.currentSettings.ignoreH1Headers && hashtagCount === 1) ? 0 : hashtagCount;

						if (currentHeaderLevel > 0) {
							const hashtagsStart = line.from;
							const hashtagsEnd = hashtagsStart + hashtagCount;

							// Add indentation for the header line itself (optional, adjust as needed)
							// const headerIndent = (hashtagCount - 1) * this.currentSettings.indentationWidth;
							// if (headerIndent > 0) {
							// 	decorations.push(Decoration.line({
							// 		attributes: {
							// 			style: `padding-left: ${headerIndent}ch`
							// 		}
							// 	}).range(line.from));
							// }

							// Hide all hashtags
							decorations.push(Decoration.mark({
								class: 'header-hashtag-hidden'
							}).range(hashtagsStart, hashtagsEnd));

							// Add bullet point at the start
							const bulletIndex = Math.min(hashtagCount - 1, HEADER_BULLETS.length - 1);
							decorations.push(Decoration.widget({
								widget: new BulletWidget(HEADER_BULLETS[bulletIndex], hashtagCount),
								side: -1 // Place before other decorations at the same position
							}).range(hashtagsStart));
						}

					} else if (text.trim() && currentHeaderLevel > 0) {
						// Add indentation for non-empty lines under headers using inline style
						const indentWidth = currentHeaderLevel * this.currentSettings.indentationWidth;
						decorations.push(Decoration.line({
							attributes: { style: `padding-left: ${indentWidth}ch` }
						}).range(line.from));
					}
				}

				// Let Decoration.set handle sorting by passing `true`
				return Decoration.set(decorations, true);
			}
		})
	];
}

// Effect for potential dynamic setting updates (if needed later)
export const updateSettingsEffect = StateEffect.define<HeaderIndentationSettings>(); 
