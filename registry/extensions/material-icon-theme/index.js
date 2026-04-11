/**
 * Material Icon Theme for Ted
 * Optimized for performance using tiered caching and lazy SVG loading.
 */

let api;
let themeData = null;
let definitions = new Map();
let mappings = new Map();
let folderMappings = new Map();
let defaultFolder = { collapsed: null, expanded: null };
let svgCache = new Map();
let loadingSvgs = new Set();
let extensionPath = '';

/**
 * Extracts the file extension and potential double-extensions (e.g., .test.ts)
 */
function getExtensions(basename) {
    const parts = basename.split('.');
    if (parts.length <= 1) return [];
    
    const results = [];
    // If filename is ".gitignore", parts is ["", "gitignore"]
    // We want to return "gitignore"
    if (parts[0] === '' && parts.length === 2) {
        return [parts[1]];
    }

    // Return parts from right to left, joined
    // e.g. "a.test.ts" -> ["ts", "test.ts"]
    for (let i = 1; i < parts.length; i++) {
        results.push(parts.slice(parts.length - i).join('.'));
    }
    return results;
}

function getIcon(path, is_dir, is_expanded) {
    if (!themeData) return undefined;

    const basename = path.split(/[\\/]/).pop();
    const basenameLower = basename.toLowerCase();

    let iconName = null;

    if (is_dir) {
        const folderMatch = folderMappings.get(basenameLower);
        const relPath = is_expanded 
            ? (folderMatch?.expanded || defaultFolder.expanded)
            : (folderMatch?.collapsed || defaultFolder.collapsed);
        
        if (relPath) return getSvgSync(relPath);
        return undefined;
    } else {
        // 1. Exact match (case insensitive check usually, but Ted uses exact keys)
        // We'll try exact, then lower
        iconName = mappings.get(basename) || mappings.get(basenameLower);

        // 2. Extension match
        if (!iconName) {
            const exts = getExtensions(basenameLower);
            for (const ext of exts) {
                if (mappings.has(ext)) {
                    iconName = mappings.get(ext);
                    break;
                }
            }
        }

        if (iconName) {
            const relPath = definitions.get(iconName);
            if (relPath) return getSvgSync(relPath);
        }
    }

    return undefined;
}

function getSvgSync(relPath) {
    const fullPath = `${extensionPath}\\icon_themes\\${relPath.replace(/^\.\//, '')}`;
    if (svgCache.has(fullPath)) {
        return svgCache.get(fullPath);
    }

    if (!loadingSvgs.has(fullPath)) {
        loadingSvgs.add(fullPath);
        // Async load
        api.fs.readFile(fullPath).then(content => {
            // Material icons often have sizes in them, we want them to feel consistent in the explorer
            // We'll strip width/height if they exist to let CSS control it, or ensure they are small.
            svgCache.set(fullPath, content);
            loadingSvgs.delete(fullPath);
            api.icons.refresh();
        }).catch(err => {
            console.error('[material-icons] Failed to load SVG:', fullPath, err);
            loadingSvgs.delete(fullPath);
        });
    }

    return undefined; // Will be returned once loaded
}

async function activate(_api) {
    api = _api;
    extensionPath = api.extensionPath;

    try {
        const jsonPath = `${extensionPath}\\icon_themes\\material-icon-theme.json`;
        const rawJson = await api.fs.readFile(jsonPath);
        const data = JSON.parse(rawJson);
        const theme = data.themes[0];
        themeData = theme;

        // Pre-process for O(1) lookups
        for (const [key, value] of Object.entries(theme.file_icons)) {
            if (typeof value === 'object' && value.path) {
                definitions.set(key, value.path);
            } else if (typeof value === 'string') {
                mappings.set(key, value);
            }
        }

        if (theme.directory_icons) {
            defaultFolder = theme.directory_icons;
        }

        if (theme.named_directory_icons) {
            for (const [key, value] of Object.entries(theme.named_directory_icons)) {
                folderMappings.set(key.toLowerCase(), value);
            }
        }

        api.icons.registerFileIconProvider(getIcon);
        console.log('[material-icons] Activated and theme loaded.');
    } catch (err) {
        console.error('[material-icons] Activation failed:', err);
    }
}

function deactivate() {
    themeData = null;
    definitions.clear();
    mappings.clear();
    folderMappings.clear();
    svgCache.clear();
}

module.exports = { activate, deactivate };
