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
			decorations: DecorationSet = Decoration.none; // Initialize decorations
			currentSettings: HeaderIndentationSettings;
			private updateScheduled = false; // Added from previous version

			constructor(view: EditorView) {
				this.currentSettings = settings;
				// Don't compute here, scheduleUpdate will handle it
				this.scheduleUpdate(view);
			}

			update(update: ViewUpdate) {
				// Only schedule if changes might affect decorations
				if (update.docChanged || update.viewportChanged || update.geometryChanged) {
					this.scheduleUpdate(update.view);
				}
				// TODO: Add settings update check if dynamic reconfiguration is needed
			}

			// Added from previous version
			private scheduleUpdate(view: EditorView) {
				if (this.updateScheduled) return;
				this.updateScheduled = true;

				Promise.resolve().then(() => {
					this.updateScheduled = false;
					// Check if view state still exists (implies view is not destroyed)
					if (!view.state) return;

					// Dispatch the computed decorations as an effect
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
				console.log('[HeaderIndent] Running computeDecorations. Indentation Width:', this.currentSettings.indentationWidth);

				for (let i = 1; i <= doc.lines; i++) {
					const line = doc.line(i);
					const text = line.text;
					const headerMatch = text.match(/^(#+)\s/);

					if (headerMatch) {
						const hashtagCount = headerMatch[1].length;
						const levelBeforeIgnore = hashtagCount;
						currentHeaderLevel = (this.currentSettings.ignoreH1Headers && hashtagCount === 1) ? 0 : hashtagCount;
						console.log(`[HeaderIndent] Line ${i}: Header found. Raw Level: ${levelBeforeIgnore}, Effective Level (currentHeaderLevel): ${currentHeaderLevel}`);

						if (currentHeaderLevel > 0) {
							const hashtagsStart = line.from;
							const hashtagsEnd = hashtagsStart + hashtagCount;

							// Add indentation for the header line itself (optional, keeping consistent with commit)
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
							console.log(`[HeaderIndent] Line ${i}: Added header decorations (indent, hide, bullet)`);
						}

					} else if (text.trim() && currentHeaderLevel > 0) {
						// Add indentation for non-empty lines under headers using inline style
						const indentWidth = currentHeaderLevel * this.currentSettings.indentationWidth;
						console.log(`[HeaderIndent] Line ${i}: Content line under header. currentHeaderLevel=${currentHeaderLevel}, indentWidth=${indentWidth}. Text: "${text.substring(0, 50)}..."`);
						decorations.push(Decoration.line({
							attributes: { style: `padding-left: ${indentWidth}ch` }
						}).range(line.from));
					} else if (text.trim()) {
						console.log(`[HeaderIndent] Line ${i}: Regular text line (or header ignored). currentHeaderLevel=${currentHeaderLevel}. Text: "${text.substring(0, 50)}..."`);
					} else {
						console.log(`[HeaderIndent] Line ${i}: Empty line. Resetting currentHeaderLevel.`);
					}
				}

				console.log(`[HeaderIndent] computeDecorations finished. Total decorations: ${decorations.length}`);
				// Let Decoration.set handle sorting by passing `true`
				return Decoration.set(decorations, true);
			}
		})
	];
}

// Effect for potential dynamic setting updates (if needed later)
export const updateSettingsEffect = StateEffect.define<HeaderIndentationSettings>(); 
