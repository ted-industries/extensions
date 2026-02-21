/**
 * hello-world extension for ted
 * Registers a "Hello World" command that shows a welcome notification.
 */

let registered = false;

function activate(api) {
    if (registered) return;
    registered = true;

    api.commands.register(
        "hello-world.greet",
        "Hello World: Show Greeting",
        () => {
            const file = api.editor.getActiveFile();
            const msg = file
                ? `Hello from ted extensions! Active file: ${file}`
                : "Hello from ted extensions! Open a file to get started.";
            api.editor.showNotification(msg, "info");
        }
    );

    api.editor.showNotification("Hello World extension activated!", "info");
}

function deactivate() {
    registered = false;
}

module.exports = { activate, deactivate };
