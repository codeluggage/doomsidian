# Doomsidian

*Doom Emacs (well, the org-mode parts at least) + Obsidian == Doomsidian.*

Indents header content according to header level.

## Installation

*If you see this plugin in the Obsidian community plugins explorer and the BRAT installation instructions are still here, future Matias forgot to update this readme. If you would be so kind, please let him know that the readme is out of date - I'm sure he'll be grateful for the reminder.*

- [ ] Add BRAT installation instructions

1. Download the latest release from the releases page
2. Extract the files into your `.obsidian/plugins` folder, so you have a `.obsidian/plugins/doomsidian` folder
3. Reload Obsidian
4. Enable the plugin in your Community Plugins list

## Usage

The plugin works automatically once enabled. Headers will be visually indented based on their level:

- H1 headers: No indent (or 1 if level 1 header setting is enabled)
- H2 headers: Indent 1 level (or 2 if level 1 header setting is enabled)
- H3 headers: Indent 2 levels (or 3 if level 1 header setting is enabled)
- And so on...

### Settings

- **Ignore H1 Headers**: When enabled, H1 headers will not be indented, maintaining them at the left margin.

## Development

This plugin is built using TypeScript and the Obsidian API. To build from source:

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`

## License

MIT
