import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { EditorView, ViewUpdate, DecorationSet, Decoration, ViewPlugin } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';

// Remember to rename these classes and interfaces!

interface DoomsidianSettings {
	ignoreH1: boolean;
}

const DEFAULT_SETTINGS: DoomsidianSettings = {
	ignoreH1: false
}

export default class DoomsidianPlugin extends Plugin {
	settings: DoomsidianSettings;

	async onload() {
		await this.loadSettings();

		// Register the header indentation extension
		this.registerEditorExtension([
			this.headerIndentationExtension()
		]);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// Add the settings tab
		this.addSettingTab(new DoomsidianSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Refresh all markdown views to apply new settings
		this.app.workspace.updateOptions();
	}

	/**
	 * Creates a CodeMirror view plugin that adds indentation to headers based on their level.
	 * The indentation is implemented using CSS padding to maintain clean markdown source.
	 */
	private headerIndentationExtension() {
		const plugin = this;
		return ViewPlugin.fromClass(class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			buildDecorations(view: EditorView) {
				const builder = new RangeSetBuilder<Decoration>();

				for (const { from, to } of view.visibleRanges) {
					syntaxTree(view.state).iterate({
						from,
						to,
						enter: (node) => {
							if (node.type.name.startsWith('HyperMD-header')) {
								const headerLevel = parseInt(node.type.name.slice(-1));
								if (headerLevel && (!plugin.settings.ignoreH1 || headerLevel > 1)) {
									const indent = (headerLevel - 1) * 20;
									builder.add(
										node.from,
										node.to,
										Decoration.line({
											attributes: {
												style: `padding-left: ${indent}px`
											}
										})
									);
								}
							}
						}
					});
				}

				return builder.finish();
			}
		}, {
			decorations: v => v.decorations
		});
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class DoomsidianSettingTab extends PluginSettingTab {
	plugin: DoomsidianPlugin;

	constructor(app: App, plugin: DoomsidianPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Doomsidian Settings' });

		new Setting(containerEl)
			.setName('Ignore H1 Headers')
			.setDesc('When enabled, H1 headers will not be indented, keeping them at the leftmost position.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.ignoreH1)
				.onChange(async (value) => {
					this.plugin.settings.ignoreH1 = value;
					await this.plugin.saveSettings();
				}));
	}
}
