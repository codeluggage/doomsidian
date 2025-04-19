import { Plugin, MarkdownView } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { headerIndentation, HeaderIndentationSettings } from './header-indentation';

interface DoomsidianSettings {
    headerIndentation: HeaderIndentationSettings;
}

const DEFAULT_SETTINGS: DoomsidianSettings = {
    headerIndentation: {
        ignoreH1Headers: true
    }
};

export default class DoomsidianPlugin extends Plugin {
    settings: DoomsidianSettings;

    async onload() {
        await this.loadSettings();

        // Register the CodeMirror extension
        this.registerEditorExtension([
            headerIndentation(this.settings.headerIndentation)
        ]);

        // Add settings tab
        this.addSettingTab(new DoomsidianSettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

import { App, PluginSettingTab, Setting } from 'obsidian';

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
            .setDesc('When enabled, H1 headers will not be processed for indentation (recommended for document titles).')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.headerIndentation.ignoreH1Headers)
                .onChange(async (value) => {
                    this.plugin.settings.headerIndentation.ignoreH1Headers = value;
                    await this.plugin.saveSettings();
                    // Force refresh of all markdown views
                    this.app.workspace.iterateAllLeaves(leaf => {
                        if (leaf.view instanceof MarkdownView) {
                            leaf.view.editor.refresh();
                        }
                    });
                }));
    }
} 
