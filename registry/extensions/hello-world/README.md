# hello world

a minimal starter extension for [ted](https://github.com/tomlin7/ted). use this as a template when building your own extensions.

## features

- registers a **hello world: show greeting** command
- shows a notification with the active file path (or a welcome message if no file is open)
- demonstrates the basic `activate` / `deactivate` lifecycle

## installation

```bash
ted ext install hello-world
```

or manually copy this folder to `~/.ted/extensions/hello-world/`.

## usage

open the command palette and run **hello world: show greeting**.

## extension api used

| api | usage |
|-----|-------|
| `api.commands.register` | registers the greet command |
| `api.editor.getActiveFile` | gets the current file path |
| `api.editor.showNotification` | displays the notification |

## source

```js
api.commands.register("hello-world.greet", "Hello World: Show Greeting", () => {
  const file = api.editor.getActiveFile();
  api.editor.showNotification(file ? `Active: ${file}` : "Hello from ted!", "info");
});
```
