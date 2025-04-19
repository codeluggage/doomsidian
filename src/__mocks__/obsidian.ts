export class Plugin {
    constructor() { }
    loadData() { return Promise.resolve({}); }
    saveData() { return Promise.resolve(); }
}

export class MarkdownView {
    constructor() { }
}

export class EditorView {
    constructor() { }
}

export class App {
    constructor() { }
}

export class PluginSettingTab {
    constructor() { }
}

// Add any other Obsidian classes or interfaces that might be needed
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    minAppVersion: string;
    author: string;
    authorUrl?: string;
    description: string;
    isDesktopOnly?: boolean;
} 
