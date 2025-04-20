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
		span.className = `cm-header-bullet cm-header-bullet-${this.level}`;
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

			constructor(view: EditorView) {
				this.currentSettings = settings;
				this.decorations = this.computeDecorations(view);
			}

			update(update: ViewUpdate) {
				let settingsChanged = false;
				for (const tr of update.transactions) {
					for (const effect of tr.effects) {
						if (effect.is(updateSettingsEffect)) {
							settingsChanged = true;
							this.currentSettings = effect.value;
							break;
						}
					}
					if (settingsChanged) break;
				}

				if (update.docChanged || update.viewportChanged || settingsChanged) {
					this.decorations = this.computeDecorations(update.view);
				}
			}

			computeDecorations(view: EditorView): DecorationSet {
				const decorations: Range<Decoration>[] = [];
				const doc = view.state.doc;
				const tree = syntaxTree(view.state);
				let currentHeaderLevel = 0;

				for (let i = 1; i <= doc.lines; i++) {
					const line = doc.line(i);
					if (line.length === 0) continue;

					let isHeader = false;
					let isIndentableContent = true;

					tree.iterate({
						from: line.from,
						to: line.from + 1,
						enter: (node) => {
							const nodeName = node.type.name;

							if (nodeName.startsWith('ATXHeading')) {
								isHeader = true;
								const headerMatch = line.text.match(/^(#+)\s/);
								if (headerMatch) {
									const hashtagCount = headerMatch[1].length;
									const calculatedLevel = (this.currentSettings.ignoreH1Headers && hashtagCount === 1) ? 0 : hashtagCount;
									currentHeaderLevel = calculatedLevel;

									if (calculatedLevel > 0) {
										const hashtagsStart = line.from;
										const headerMarkEnd = hashtagsStart + hashtagCount + (line.text[hashtagCount] === ' ' ? 1 : 0);

										decorations.push(Decoration.replace({
											attributes: { class: 'cm-header-hashtag-hidden' }
										}).range(hashtagsStart, headerMarkEnd));

										const bulletIndex = Math.min(hashtagCount - 1, HEADER_BULLETS.length - 1);
										decorations.push(Decoration.widget({
											widget: new BulletWidget(HEADER_BULLETS[bulletIndex], hashtagCount),
											side: -1
										}).range(hashtagsStart));
									}
								}
								return false;
							}

							if (nodeName.includes('List') ||
								nodeName.includes('Quote') ||
								nodeName.includes('Code') ||
								nodeName === 'HorizontalRule' ||
								nodeName === 'Task' || nodeName === 'TaskMarker' ||
								nodeName === 'CommentBlock' || nodeName === 'Comment' ||
								nodeName === 'Table'
							) {
								isIndentableContent = false;
								return false;
							}
						}
					});

					if (!isHeader && isIndentableContent && currentHeaderLevel > 0) {
						const indentClass = `cm-line-indent-${currentHeaderLevel}`;
						decorations.push(Decoration.line({
							attributes: { class: indentClass }
						}).range(line.from));
					}
				}

				decorations.sort((a, b) => {
					const fromDiff = a.from - b.from;
					if (fromDiff !== 0) return fromDiff;
					return (a.value.spec.side || 0) - (b.value.spec.side || 0);
				});

				return Decoration.set(decorations, true);
			}
		})
	];
}

export const updateSettingsEffect = StateEffect.define<HeaderIndentationSettings>(); 
