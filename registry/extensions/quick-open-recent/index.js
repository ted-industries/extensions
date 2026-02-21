/**
 * quick-open-recent extension for ted
 * Maintains a list of recently opened files and registers a command to re-open them.
 */

const MAX_RECENT = 10;
const recentFiles = [];

function addRecent(path) {
    const idx = recentFiles.indexOf(path);
    if (idx !== -1) recentFiles.splice(idx, 1);
    recentFiles.unshift(path);
    if (recentFiles.length > MAX_RECENT) recentFiles.pop();
}

function activate(api) {
    // Track opened files
    api.onEvent("fileOpened", (data) => {
        if (data && data.path) addRecent(data.path);
    });

    api.onEvent("fileSaved", (data) => {
        if (data && data.path) addRecent(data.path);
    });

    // Register command
    api.commands.register(
        "quick-open-recent.open",
        "Quick Open: Recent Files",
        () => {
            if (recentFiles.length === 0) {
                api.editor.showNotification(
                    "No recent files yet. Open a file first.",
                    "info"
                );
                return;
            }

            // Show notification listing recent files (UI picker would be added once ted supports it)
            const list = recentFiles
                .slice(0, 5)
                .map((f, i) => `${i + 1}. ${f}`)
                .join("\n");

            api.editor.showNotification(`Recent files:\n${list}`, "info");

            // Open the most recent file automatically
            api.editor.openFile(recentFiles[0]);
        }
    );
}

function deactivate() {
    recentFiles.length = 0;
}

module.exports = { activate, deactivate };
