import '@testing-library/jest-dom';

// Mock the Obsidian API
jest.mock('obsidian', () => ({
    Plugin: class Plugin { },
    MarkdownView: class MarkdownView { },
    EditorView: class EditorView { },
})); 
