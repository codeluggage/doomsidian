import '@testing-library/jest-dom';

// Mock the Obsidian API with minimal required functionality
jest.mock('obsidian', () => ({
    Plugin: class Plugin {
        constructor() { }
        loadData() { return Promise.resolve({}); }
        saveData() { return Promise.resolve(); }
    },
    MarkdownView: class MarkdownView {
        constructor() { }
    },
    EditorView: class EditorView {
        constructor() { }
    },
    App: class App {
        constructor() { }
    },
    PluginSettingTab: class PluginSettingTab {
        constructor() { }
    }
})); 
