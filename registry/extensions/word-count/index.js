/**
 * word-count extension for ted
 * Displays a live word and character count in the status bar.
 */

const ITEM_ID = "word-count.statusbar";

function countWords(text) {
    if (!text || !text.trim()) return { words: 0, chars: 0 };
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    return { words, chars };
}

function activate(api) {
    // Add initial status bar item
    api.statusbar.addItem(ITEM_ID, "W: 0  C: 0", {
        tooltip: "Word Count",
        alignment: "right",
        priority: 100,
    });

    // Update on editor events
    api.onEvent("fileOpened", async (data) => {
        try {
            const content = await api.fs.readFile(data.path);
            const { words, chars } = countWords(content);
            api.statusbar.updateItem(ITEM_ID, `W: ${words}  C: ${chars}`);
        } catch (_) {
            api.statusbar.updateItem(ITEM_ID, "W: —  C: —");
        }
    });

    api.onEvent("fileSaved", async (data) => {
        try {
            const content = await api.fs.readFile(data.path);
            const { words, chars } = countWords(content);
            api.statusbar.updateItem(ITEM_ID, `W: ${words}  C: ${chars}`);
        } catch (_) {
            api.statusbar.updateItem(ITEM_ID, "W: —  C: —");
        }
    });

    api.onEvent("contentChanged", (data) => {
        const { words, chars } = countWords(data.content || "");
        api.statusbar.updateItem(ITEM_ID, `W: ${words}  C: ${chars}`);
    });

    api.onEvent("fileClose", () => {
        api.statusbar.updateItem(ITEM_ID, "W: 0  C: 0");
    });
}

function deactivate() {
    // statusbar item cleanup is handled by ted on extension unload
}

module.exports = { activate, deactivate };
