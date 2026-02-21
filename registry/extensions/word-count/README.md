# word count

a [ted](https://github.com/tomlin7/ted) extension that shows a live word and character count for the active file in the status bar.

## features

- adds a **w: / c:** status bar item (right-aligned)
- updates live on `fileOpened`, `fileSaved`, and `contentChanged` events
- resets cleanly when the file is closed

## installation

```bash
ted ext install word-count
```

or manually copy this folder to `~/.ted/extensions/word-count/`.

## usage

once installed and activated the status bar will show something like:

```
W: 342  C: 1 895
```

no commands needed — it works automatically.

## extension api used

| api | usage |
|-----|-------|
| `api.statusbar.addItem` | adds the counter item on activation |
| `api.statusbar.updateItem` | refreshes the count on each event |
| `api.fs.readFile` | reads file content to count on open/save |
| `api.onEvent` | subscribes to `fileOpened`, `fileSaved`, `contentChanged`, `fileClose` |

## how it works

```js
api.onEvent("contentChanged", (data) => {
  const words = data.content.trim().split(/\s+/).length;
  const chars = data.content.length;
  api.statusbar.updateItem("word-count.statusbar", `W: ${words}  C: ${chars}`);
});
```
