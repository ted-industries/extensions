# quick open recent

a [ted](https://github.com/ted-industries/ted) extension that tracks your recently opened files and lets you jump back to them instantly.

## features

- keeps a rolling list of the last **10** opened/saved files
- registers a **quick open: recent files** command
- automatically opens the most recent file and shows the top 5 in a notification

## installation

```bash
ted ext install quick-open-recent
```

or manually copy this folder to `~/.ted/extensions/quick-open-recent/`.

## usage

open the command palette and run **quick open: recent files**. the extension will:
1. show a notification listing the 5 most recent files
2. automatically open the most recent file

## extension api used

| api | usage |
|-----|-------|
| `api.commands.register` | registers the open-recent command |
| `api.onEvent` | tracks `fileOpened` and `fileSaved` events |
| `api.editor.openFile` | opens the selected file |
| `api.editor.showNotification` | lists recent files |

## roadmap

- interactive picker ui once ted exposes a `quickPick` api
- persist recent files list across sessions via `api.fs`
