import { Plugin } from 'obsidian';
import { headerIndentation } from './src/header-indentation';

interface DoomsidianSettings {
	ignoreH1Headers: boolean;
	indentationWidth: number;
}

const DEFAULT_SETTINGS: DoomsidianSettings = {
	ignoreH1Headers: true,
	indentationWidth: 2
};

export default class DoomsidianPlugin extends Plugin {
	settings: DoomsidianSettings;

	async onload() {
		await this.loadSettings();

		// Register the header indentation extension
		this.registerEditorExtension(headerIndentation(this.settings));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
} 
