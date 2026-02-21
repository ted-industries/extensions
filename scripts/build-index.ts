#!/usr/bin/env bun
/**
 * scripts/build-index.ts
 * Reads all registry/extensions/package.json files and rebuilds
 * registry/extensions.json(the master index).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, cpSync, rmSync } from "fs";
import { join, resolve } from "path";

const REGISTRY_DIR = resolve(import.meta.dir, "../registry/extensions");
const OUTPUT_FILE = resolve(import.meta.dir, "../registry/extensions.json");
const PUBLIC_DIR = resolve(import.meta.dir, "../docs/public/v1");

interface ExtensionEntry {
    name: string;
    displayName: string;
    description: string;
    version: string;
    author?: string;
    repository?: string;
    main: string;
    icon?: string;
    tags?: string[];
    downloads?: number;
}

const extensions: ExtensionEntry[] = [];

// Ensure public directory exists
if (existsSync(PUBLIC_DIR)) {
    rmSync(PUBLIC_DIR, { recursive: true, force: true });
}
mkdirSync(PUBLIC_DIR, { recursive: true });

const entries = readdirSync(REGISTRY_DIR).filter((entry) => {
    return statSync(join(REGISTRY_DIR, entry)).isDirectory();
});

console.log(`\n📦 Building index from ${entries.length} extension(s)...\n`);

const EXTERNAL_FILE = resolve(import.meta.dir, "../registry/external.json");

// Add local extensions
for (const extDir of entries) {
    const extPath = join(REGISTRY_DIR, extDir);
    const manifestPath = join(extPath, "package.json");

    if (!existsSync(manifestPath)) {
        console.warn(`  ⚠  Skipping ${extDir}: no package.json`);
        continue;
    }

    let manifest: Record<string, unknown>;
    try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    } catch (e) {
        console.error(`  ✗ Skipping ${extDir}: invalid JSON — ${(e as Error).message}`);
        continue;
    }

    const entry: ExtensionEntry = {
        name: (manifest.name as string) || extDir,
        displayName: (manifest.displayName as string) || extDir,
        description: (manifest.description as string) || "",
        version: (manifest.version as string) || "0.0.1",
        main: (manifest.main as string) || "index.js",
        ...(manifest.author ? { author: manifest.author as string } : {}),
        ...(manifest.repository ? { repository: manifest.repository as string } : {}),
        ...(manifest.icon ? { icon: manifest.icon as string } : {}),
        tags: (manifest.tags as string[]) || [],
        downloads: 0,
    };

    extensions.push(entry);
    console.log(`  ✓ ${entry.name}@${entry.version}`);
}

// Add external extensions
if (existsSync(EXTERNAL_FILE)) {
    try {
        const externalData = JSON.parse(readFileSync(EXTERNAL_FILE, "utf-8"));
        if (Array.isArray(externalData)) {
            console.log(`\n🌐 Adding ${externalData.length} external extension(s)...\n`);
            for (const ext of externalData) {
                if (!ext.name || !ext.repository) {
                    console.warn(`  ⚠  Skipping external entry: missing "name" or "repository"`);
                    continue;
                }

                const entry: ExtensionEntry = {
                    name: ext.name,
                    displayName: ext.displayName || ext.name,
                    description: ext.description || "",
                    version: ext.version || "0.0.1",
                    main: ext.main || "index.js",
                    repository: ext.repository,
                    author: ext.author,
                    tags: ext.tags || [],
                    downloads: 0,
                    ...ext
                };

                extensions.push(entry);
                console.log(`  ✓ ${entry.name} (remote)`);
            }
        }
    } catch (e) {
        console.error(`  ✗ Failed to read external.json: ${(e as Error).message}`);
    }
}

// Sort alphabetically by name
extensions.sort((a, b) => a.name.localeCompare(b.name));

// Write output to both locations
const indexContent = JSON.stringify(extensions, null, 2) + "\n";
writeFileSync(OUTPUT_FILE, indexContent);
writeFileSync(join(PUBLIC_DIR, "extensions.json"), indexContent);

console.log(`\n✅ Wrote ${extensions.length} extension(s) to:`);
console.log(`   - registry/extensions.json`);
console.log(`   - docs/public/v1/extensions.json\n`);
